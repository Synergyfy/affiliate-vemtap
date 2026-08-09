import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';

@Injectable()
export class IntegrationService {
  constructor(
    private prisma: PrismaService,
    private businessesService: BusinessesService,
  ) {}

  async handlePaymentEvent(dto: any) {
    // 1. Find the affiliate by referral code
    const user = await this.prisma.user.findUnique({
      where: { referralCode: dto.referralCode },
    });

    if (!user) {
      throw new NotFoundException(`Affiliate with code ${dto.referralCode} not found`);
    }

    const amount = Number(dto.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('A valid payment amount is required');
    }

    return this.prisma.$transaction(async (tx) => {
      // Commission rate comes from the affiliate platform's settings.
      const settings = await tx.platformSettings.findFirst();
      const commissionRate = settings?.directCommissionRate
        ? Number(settings.directCommissionRate)
        : 0.15;
      const commissionAmount = amount * commissionRate;

      // 2. Upsert the business by email so the real subscription amount lands
      // on the affiliate-logged record instead of creating a duplicate.
      const existing = await tx.business.findFirst({
        where: { email: dto.email },
      });

      const business = existing
        ? await tx.business.update({
            where: { id: existing.id },
            data: {
              subscriptionAmount: amount,
              commissionRate,
              commissionAmount,
              status: 'ACTIVE',
              paidAt: new Date(),
            },
            include: { affiliate: true },
          })
        : await tx.business.create({
            data: {
              businessName: dto.businessName,
              ownerName: dto.ownerName,
              email: dto.email,
              phone: dto.phone,
              planType: dto.planType,
              referralCode: dto.referralCode,
              affiliateId: user.id,
              subscriptionAmount: amount,
              commissionRate,
              commissionAmount,
              status: 'ACTIVE',
              paidAt: new Date(),
            },
            include: { affiliate: true },
          });

      // 3. Trigger commissions (guarded against zero amounts and duplicates)
      await this.businessesService.generateCommissions(business);

      return { success: true, businessId: business.id };
    });
  }
}
