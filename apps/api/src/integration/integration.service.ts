import { Injectable, NotFoundException } from '@nestjs/common';
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

    return this.prisma.$transaction(async (tx) => {
      // 2. Create the business record
      const business = await tx.business.create({
        data: {
          businessName: dto.businessName,
          ownerName: dto.ownerName,
          email: dto.email,
          phone: dto.phone,
          planType: dto.planType,
          referralCode: dto.referralCode,
          affiliateId: user.id,
          subscriptionAmount: dto.amount,
          status: 'ACTIVE',
          paidAt: new Date(),
        },
        include: { affiliate: true },
      });

      // 3. Trigger commissions
      // NOTE: generateCommissions will use its own transaction context. 
      // This is acceptable for now but for absolute safety we would pass 'tx' to it.
      await this.businessesService.generateCommissions(business);

      return { success: true, businessId: business.id };
    });
  }
}
