import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { AuditService } from '../prisma/audit.service';
import { RecordReferralDto } from './dto/record-referral.dto';
import { ProcessWithdrawalDto } from './dto/process-withdrawal.dto';
import { GetAffiliatesFilterDto } from './dto/get-affiliates-filter.dto';
import { AttachBusinessDto } from './dto/attach-business.dto';
import {
  Prisma,
  PlanType,
  ExternalSyncScope,
  ExternalSyncStatus,
  WithdrawalStatus,
  KycStatus,
} from '@prisma/client';

@Injectable()
export class ExternalService {
  private readonly logger = new Logger(ExternalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly businessesService: BusinessesService,
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
   * Records a payment commission event from Vemtap.
   *
   * Semantics (Vemtap contract):
   * - externalReference = the payment reference → unique per payment, NOT per
   *   business. Recurring payments are separate commission events.
   * - isFirstPayment = first successful paid subscription for that business.
   * - rate = commission % (30 first payment, 10 recurring); credit = rate × amountPaid.
   *
   * Idempotent on Idempotency-Key and externalReference: replays return the
   * original success response and never double-credit.
   */
  async recordReferral(
    dto: RecordReferralDto,
    idempotencyKey?: string,
  ): Promise<{ businessId: string; commissionTriggered: boolean; deduplicated: boolean }> {
    // 1. Idempotency fast path — return the stored success response.
    const existing = await this.findSyncLog(
      ExternalSyncScope.REFERRAL,
      idempotencyKey,
      dto.externalReference,
    );
    if (existing) {
      return this.replay(existing, { deduplicated: true });
    }

    // 2. Resolve affiliate from referral code
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

    // 3. Commission credit = rate% × amountPaid (rate: 30 first / 10 recurring)
    const commissionRate = dto.rate / 100;
    const commissionAmount = dto.amountPaid * commissionRate;

    // 4. Credit business + commission + idempotency ledger in one tx.
    let business: { id: string };
    try {
      business = await this.prisma.$transaction(async (tx) => {
        // Re-check idempotency inside the tx to guard against races.
        const dup = await tx.externalSyncLog.findFirst({
          where: {
            scope: ExternalSyncScope.REFERRAL,
            OR: [
              idempotencyKey ? { idempotencyKey } : {},
              dto.externalReference ? { externalReference: dto.externalReference } : {},
            ],
          },
        });
        if (dup) {
          return { id: '', alreadyExists: true } as any;
        }

        // Link recurring payments to the existing business (by Vemtap businessId
        // or email). Do NOT treat recurring payments as a duplicate business.
        const existingBusiness = await tx.business.findFirst({
          where: dto.businessId
            ? { OR: [{ externalBusinessId: dto.businessId }, { email: dto.email }] }
            : { email: dto.email },
        });

        let businessRecord = existingBusiness;

        if (!businessRecord) {
          businessRecord = await tx.business.create({
            data: {
              businessName: dto.businessName,
              ownerName: dto.ownerName,
              email: dto.email,
              phone: dto.phone ?? '',
              address: dto.address,
              planName: dto.planName,
              planId: dto.planId,
              externalReference: dto.externalReference,
              externalBusinessId: dto.businessId,
              referralCode: dto.referralCode,
              affiliateId: affiliate.id,
              subscriptionAmount: dto.amountPaid,
              commissionRate,
              commissionAmount,
              status: 'ACTIVE',
              paidAt: new Date(),
            },
          });

          // Only a new business counts as a new referral.
          await tx.user.update({
            where: { id: affiliate.id },
            data: { referralCount: { increment: 1 } },
          });
        } else {
          businessRecord = await tx.business.update({
            where: { id: businessRecord.id },
            data: {
              planName: dto.planName,
              planId: dto.planId,
              externalReference: dto.externalReference,
              externalBusinessId: dto.businessId || businessRecord.externalBusinessId,
              subscriptionAmount: dto.amountPaid,
              commissionRate,
              commissionAmount,
              status: 'ACTIVE',
              paidAt: new Date(),
            },
          });
        }

        // Credit the agent for THIS payment (each payment is a separate event).
        await tx.commission.create({
          data: {
            amount: commissionAmount,
            type: 'DIRECT',
            status: 'PENDING',
            userId: affiliate.id,
            businessId: businessRecord.id,
            description: `${dto.isFirstPayment ? 'First' : 'Recurring'} commission (${dto.rate}%) from ${dto.businessName}`,
          },
        });

        await tx.user.update({
          where: { id: affiliate.id },
          data: {
            pendingEarnings: { increment: commissionAmount },
            totalEarnings: { increment: commissionAmount },
          },
        });

        await tx.externalSyncLog.create({
          data: {
            scope: ExternalSyncScope.REFERRAL,
            idempotencyKey: idempotencyKey ?? null,
            externalReference: dto.externalReference,
            status: ExternalSyncStatus.SUCCESS,
            responseJson: {
              businessId: businessRecord.id,
              commissionTriggered: true,
              deduplicated: false,
            },
            businessId: businessRecord.id,
          },
        });

        return businessRecord;
      });
    } catch (err: unknown) {
      // Race on the ledger unique constraint → someone else recorded it first.
      if (this.isUniqueViolation(err)) {
        const raced = await this.findSyncLog(
          ExternalSyncScope.REFERRAL,
          idempotencyKey,
          dto.externalReference,
        );
        if (raced) {
          return this.replay(raced, { deduplicated: true });
        }
      }
      throw err;
    }

    // A concurrent duplicate slipped past the fast path but was caught in-tx.
    if ((business as any)?.alreadyExists) {
      const raced = await this.findSyncLog(
        ExternalSyncScope.REFERRAL,
        idempotencyKey,
        dto.externalReference,
      );
      if (raced) {
        return this.replay(raced, { deduplicated: true });
      }
    }

    await this.auditService.log({
      action: 'EXTERNAL_REFERRAL_RECORDED',
      entity: 'BUSINESS',
      entityId: business.id,
      newValue: {
        businessId: business.id,
        affiliateId: affiliate.id,
        referralCode: dto.referralCode,
        planId: dto.planId,
        planName: dto.planName,
        externalReference: dto.externalReference,
        amountPaid: dto.amountPaid,
        rate: dto.rate,
        isFirstPayment: dto.isFirstPayment,
        commissionAmount,
      },
    });

    this.logger.log(
      `Referral payment recorded: ${dto.referralCode} → business ${business.id} (ref: ${dto.externalReference}, rate ${dto.rate}%, ${dto.amountPaid} NGN)`,
    );

    return {
      businessId: business.id,
      commissionTriggered: true,
      deduplicated: false,
    };
  }

  /**
   * Creates a withdrawal request for an affiliate (PENDING — admin still approves).
   * Identified by affiliate email; bank details supplied in the payload.
   * Idempotent on Idempotency-Key and externalReference.
   */
  async processWithdrawal(
    dto: ProcessWithdrawalDto,
    idempotencyKey?: string,
  ): Promise<{ withdrawalId: string; status: string; deduplicated: boolean }> {
    // 1. Idempotency fast path
    const existing = await this.findSyncLog(
      ExternalSyncScope.WITHDRAWAL,
      idempotencyKey,
      dto.externalReference,
    );
    if (existing) {
      return this.replay(existing, { deduplicated: true });
    }

    // 2. Resolve affiliate by email
    const affiliate = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        fullName: true,
        status: true,
        kycStatus: true,
        pendingEarnings: true,
      },
    });

    if (!affiliate) {
      throw new NotFoundException(`No affiliate found with email: ${dto.email}`);
    }

    if (affiliate.status !== 'ACTIVE') {
      throw new BadRequestException(`Affiliate account is not active`);
    }

    // 3. Terminal validations (no retry — Vemtap will surface these to the user)
    if (Number(affiliate.pendingEarnings) < dto.amount) {
      throw new BadRequestException('Insufficient pending earnings');
    }

    if (affiliate.kycStatus !== KycStatus.VERIFIED) {
      throw new BadRequestException('KYC verification required for withdrawals');
    }

    // 4. Compute fee / net amount (mirrors WithdrawalsService.create)
    const settings = await this.prisma.platformSettings.findFirst();
    const fee = settings?.withdrawalFee ? Number(settings.withdrawalFee) : 0;
    const netAmount = dto.amount - fee;

    if (netAmount <= 0) {
      throw new BadRequestException('Amount after fee must be greater than zero');
    }

    let withdrawal: { id: string };
    try {
      withdrawal = await this.prisma.$transaction(async (tx) => {
        const dup = await tx.externalSyncLog.findFirst({
          where: {
            scope: ExternalSyncScope.WITHDRAWAL,
            OR: [
              idempotencyKey ? { idempotencyKey } : {},
              { externalReference: dto.externalReference },
            ],
          },
        });
        if (dup) {
          return { id: '', alreadyExists: true } as any;
        }

        const created = await tx.withdrawal.create({
          data: {
            userId: affiliate.id,
            amount: dto.amount,
            fee,
            netAmount,
            bankName: dto.bankName,
            accountNumber: dto.accountNumber,
            accountName: dto.accountName,
            externalReference: dto.externalReference,
            status: WithdrawalStatus.PENDING,
          },
        });

        return created;
      });
    } catch (err: unknown) {
      if (this.isUniqueViolation(err)) {
        const raced = await this.findSyncLog(
          ExternalSyncScope.WITHDRAWAL,
          idempotencyKey,
          dto.externalReference,
        );
        if (raced) {
          return this.replay(raced, { deduplicated: true });
        }
      }
      throw err;
    }

    if ((withdrawal as any)?.alreadyExists) {
      const raced = await this.findSyncLog(
        ExternalSyncScope.WITHDRAWAL,
        idempotencyKey,
        dto.externalReference,
      );
      if (raced) {
        return this.replay(raced, { deduplicated: true });
      }
    }

    const responseBody = { withdrawalId: withdrawal.id, status: 'PENDING', deduplicated: false };

    await this.recordSyncSuccess(
      ExternalSyncScope.WITHDRAWAL,
      idempotencyKey,
      dto.externalReference,
      undefined,
      withdrawal.id,
      responseBody,
    );

    await this.auditService.log({
      userId: affiliate.id,
      action: 'EXTERNAL_WITHDRAWAL_REQUESTED',
      entity: 'WITHDRAWAL',
      entityId: withdrawal.id,
      newValue: {
        withdrawalId: withdrawal.id,
        email: dto.email,
        externalReference: dto.externalReference,
        amount: dto.amount,
      },
    });

    this.logger.log(
      `External withdrawal request created: ${withdrawal.id} for ${dto.email} (ref: ${dto.externalReference})`,
    );

    return responseBody;
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
    const subscriptionAmount = dto.amount;

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

  // ---------------------------------------------------------------------------
  // Idempotency & pricing helpers
  // ---------------------------------------------------------------------------

  private async findSyncLog(
    scope: ExternalSyncScope,
    idempotencyKey?: string,
    externalReference?: string,
  ) {
    const orConditions: Prisma.ExternalSyncLogWhereInput[] = [];
    if (idempotencyKey) orConditions.push({ idempotencyKey });
    if (externalReference) orConditions.push({ externalReference });

    if (orConditions.length === 0) return null;

    return this.prisma.externalSyncLog.findFirst({
      where: {
        scope,
        status: ExternalSyncStatus.SUCCESS,
        OR: orConditions,
      },
    });
  }

  private replay(
    log: { responseJson: Prisma.JsonValue | null },
    extra: Record<string, unknown>,
  ) {
    const stored =
      log.responseJson && typeof log.responseJson === 'object' && !Array.isArray(log.responseJson)
        ? (log.responseJson as Record<string, unknown>)
        : {};
    return { ...stored, ...extra } as any;
  }

  private async recordSyncSuccess(
    scope: ExternalSyncScope,
    idempotencyKey: string | undefined,
    externalReference: string | undefined,
    businessId: string | undefined,
    withdrawalId: string | undefined,
    responseBody: Prisma.InputJsonValue,
  ) {
    try {
      await this.prisma.externalSyncLog.create({
        data: {
          scope,
          idempotencyKey: idempotencyKey ?? null,
          externalReference: externalReference ?? null,
          status: ExternalSyncStatus.SUCCESS,
          responseJson: responseBody,
          businessId: businessId ?? null,
          withdrawalId: withdrawalId ?? null,
        },
      });
    } catch (err: unknown) {
      if (this.isUniqueViolation(err)) {
        return; // Ledger row already exists — treat as idempotent.
      }
      this.logger.error(`Failed to persist sync log (${scope})`, (err as Error)?.stack);
    }
  }

  private async recordSyncFailure(
    scope: ExternalSyncScope,
    idempotencyKey: string | undefined,
    externalReference: string | undefined,
    businessId: string | undefined,
    error: Error,
  ) {
    try {
      await this.prisma.externalSyncLog.create({
        data: {
          scope,
          idempotencyKey: idempotencyKey ?? null,
          externalReference: externalReference ?? null,
          status: ExternalSyncStatus.FAILED,
          errorJson: { message: error.message, stack: error.stack },
          businessId: businessId ?? null,
        },
      });
    } catch (err: unknown) {
      this.logger.error(`Failed to persist sync failure log (${scope})`, (err as Error)?.stack);
    }
  }

  private isUniqueViolation(err: unknown): boolean {
    return (
      err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
    );
  }
}