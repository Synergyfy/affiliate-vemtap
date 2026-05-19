import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';
import { AuditService } from '../prisma/audit.service';
import { RecordReferralDto } from './dto/record-referral.dto';
import { ProcessWithdrawalDto } from './dto/process-withdrawal.dto';
import { GetAffiliatesFilterDto } from './dto/get-affiliates-filter.dto';
import { AttachBusinessDto } from './dto/attach-business.dto';
import { PlanType } from '@prisma/client';

@Injectable()
export class ExternalService {
  private readonly logger = new Logger(ExternalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly businessesService: BusinessesService,
    private readonly withdrawalsService: WithdrawalsService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Validates a referral code.
   * Returns { valid: true, affiliateId, fullName } on success.
   * Returns { valid: false } if not found — never throws 404 (Vemtap needs a clean boolean).
   */
  async validateReferralCode(code: string): Promise<
    | { valid: true; affiliateId: string; fullName: string; referralCode: string }
    | { valid: false }
  > {
    const affiliate = await this.prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true, fullName: true, referralCode: true, status: true },
    });

    if (!affiliate || affiliate.status !== 'ACTIVE') {
      this.logger.log(`Referral code validation failed: ${code}`);
      return { valid: false };
    }

    this.logger.log(`Referral code validated: ${code} → affiliate ${affiliate.id}`);
    return {
      valid: true,
      affiliateId: affiliate.id,
      fullName: affiliate.fullName,
      referralCode: affiliate.referralCode,
    };
  }

  /**
   * Records a successful referral from Vemtap.
   * Looks up affiliate by referralCode, creates a Business record,
   * generates commissions, and increments referralCount — all in a transaction.
   */
  async recordReferral(dto: RecordReferralDto): Promise<{ businessId: string; commissionTriggered: boolean }> {
    // 1. Resolve affiliate from referral code
    const affiliate = await this.prisma.user.findUnique({
      where: { referralCode: dto.referralCode },
      select: { id: true, fullName: true, referrerId: true, status: true },
    });

    if (!affiliate) {
      throw new NotFoundException(`No affiliate found with referral code: ${dto.referralCode}`);
    }

    if (affiliate.status !== 'ACTIVE') {
      throw new BadRequestException(`Affiliate account is not active`);
    }

    // 2. Guard against duplicate referrals for the same email
    const existing = await this.prisma.business.findFirst({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(`A business with email ${dto.email} is already registered`);
    }

    // 3. Determine plan & amounts
    const planType = dto.planType ?? PlanType.BASIC;
    const planPrices: Record<PlanType, number> = {
      [PlanType.BASIC]: 3000,
      [PlanType.STARTER]: 5000,
      [PlanType.PROFESSIONAL]: 10000,
      [PlanType.ENTERPRISE]: 15000,
    };
    const subscriptionAmount = planPrices[planType];

    const settings = await this.prisma.platformSettings.findFirst();
    const commissionRate = settings?.directCommissionRate
      ? Number(settings.directCommissionRate)
      : 0.15;
    const commissionAmount = subscriptionAmount * commissionRate;

    // 4. Create Business + increment referralCount in a transaction
    const business = await this.prisma.$transaction(async (tx) => {
      const created = await tx.business.create({
        data: {
          businessName: dto.businessName,
          ownerName: dto.ownerName,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
          businessType: dto.businessType,
          planType,
          referralCode: dto.referralCode,
          affiliateId: affiliate.id,
          subscriptionAmount,
          commissionRate,
          commissionAmount,
          status: 'ACTIVE',
          paidAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: affiliate.id },
        data: { referralCount: { increment: 1 } },
      });

      return created;
    });

    // 5. Trigger commissions (outside transaction — generateCommissions opens its own tx)
    let commissionTriggered = false;
    try {
      const businessWithAffiliate = await this.prisma.business.findUnique({
        where: { id: business.id },
        include: { affiliate: { select: { id: true, fullName: true, referrerId: true } } },
      });

      if (businessWithAffiliate) {
        await this.businessesService.generateCommissions(businessWithAffiliate);
        commissionTriggered = true;
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error(`Commission generation failed for business ${business.id}`, error.stack);
      // Don't fail the whole request — business is already recorded
    }

    await this.auditService.log({
      action: 'EXTERNAL_REFERRAL_RECORDED',
      entity: 'BUSINESS',
      entityId: business.id,
      newValue: { businessId: business.id, affiliateId: affiliate.id, referralCode: dto.referralCode },
    });

    this.logger.log(`Referral recorded: ${dto.referralCode} → business ${business.id}`);

    return { businessId: business.id, commissionTriggered };
  }

  /**
   * Creates a withdrawal request for an affiliate (PENDING — admin still approves).
   * Vemtap provides the affiliateId and amount.
   */
  async processWithdrawal(dto: ProcessWithdrawalDto): Promise<{ withdrawalId: string; status: string }> {
    // WithdrawalsService.create handles all validations (KYC, balance, bank details)
    const withdrawal = await this.withdrawalsService.create(dto.affiliateId, dto.amount);

    await this.auditService.log({
      action: 'EXTERNAL_WITHDRAWAL_REQUESTED',
      entity: 'WITHDRAWAL',
      entityId: withdrawal.id,
      newValue: {
        withdrawalId: withdrawal.id,
        affiliateId: dto.affiliateId,
        externalReference: dto.externalReference,
        amount: dto.amount,
      },
    });

    this.logger.log(
      `External withdrawal request created: ${withdrawal.id} for affiliate ${dto.affiliateId} (ref: ${dto.externalReference})`,
    );

    return { withdrawalId: withdrawal.id, status: withdrawal.status };
  }

  /**
   * Fetches affiliate users with filters and pagination.
   */
  async getAffiliates(filters: GetAffiliatesFilterDto) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {
      role: 'AFFILIATE',
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { referralCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          referralCode: true,
          status: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Attaches a business to an affiliate manually.
   */
  async attachBusiness(dto: AttachBusinessDto): Promise<{ businessId: string; commissionTriggered: boolean }> {
    // 1. Resolve affiliate by ID
    const affiliate = await this.prisma.user.findUnique({
      where: { id: dto.affiliateId },
      select: { id: true, fullName: true, referralCode: true, referrerId: true, status: true },
    });

    if (!affiliate) {
      throw new NotFoundException(`No affiliate found with ID: ${dto.affiliateId}`);
    }

    if (affiliate.status !== 'ACTIVE') {
      throw new BadRequestException(`Affiliate account is not active`);
    }

    // 2. Guard against duplicate business record with the same email
    const existing = await this.prisma.business.findFirst({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(`A business with email ${dto.email} is already registered`);
    }

    // 3. Determine plan & amounts
    const planType = dto.planType ?? PlanType.BASIC;
    const planPrices: Record<PlanType, number> = {
      [PlanType.BASIC]: 3000,
      [PlanType.STARTER]: 5000,
      [PlanType.PROFESSIONAL]: 10000,
      [PlanType.ENTERPRISE]: 15000,
    };
    const subscriptionAmount = planPrices[planType];

    const settings = await this.prisma.platformSettings.findFirst();
    const commissionRate = settings?.directCommissionRate
      ? Number(settings.directCommissionRate)
      : 0.15;
    const commissionAmount = subscriptionAmount * commissionRate;

    // 4. Create Business + increment referralCount in a transaction
    const business = await this.prisma.$transaction(async (tx) => {
      const created = await tx.business.create({
        data: {
          businessName: dto.businessName,
          ownerName: dto.ownerName,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
          businessType: dto.businessType,
          planType,
          referralCode: affiliate.referralCode,
          affiliateId: affiliate.id,
          subscriptionAmount,
          commissionRate,
          commissionAmount,
          status: 'ACTIVE',
          paidAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: affiliate.id },
        data: { referralCount: { increment: 1 } },
      });

      return created;
    });

    // 5. Trigger commissions
    let commissionTriggered = false;
    try {
      const businessWithAffiliate = await this.prisma.business.findUnique({
        where: { id: business.id },
        include: { affiliate: { select: { id: true, fullName: true, referrerId: true } } },
      });

      if (businessWithAffiliate) {
        await this.businessesService.generateCommissions(businessWithAffiliate);
        commissionTriggered = true;
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error(`Commission generation failed for business ${business.id}`, error.stack);
    }

    await this.auditService.log({
      action: 'EXTERNAL_BUSINESS_ATTACHED',
      entity: 'BUSINESS',
      entityId: business.id,
      newValue: { businessId: business.id, affiliateId: affiliate.id, referralCode: affiliate.referralCode },
    });

    this.logger.log(`Business attached manually by Vemtap admin: affiliate ${affiliate.id} → business ${business.id}`);

    return { businessId: business.id, commissionTriggered };
  }
}
