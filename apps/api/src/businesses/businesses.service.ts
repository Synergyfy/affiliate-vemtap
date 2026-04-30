import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/business.dto';
import { PlanType } from '@prisma/client';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  private getPlanPrice(plan: PlanType): number {
    switch (plan) {
      case PlanType.BASIC: return 3000;
      case PlanType.STARTER: return 5000;      // Maps to "Standard" in Summary
      case PlanType.PROFESSIONAL: return 10000; // Maps to "Pro" in Summary
      case PlanType.ENTERPRISE: return 15000;   // Maps to "Premium" in Summary
      default: return 0;
    }
  }

  async findAll(userId: string, pagination: { skip?: number; take?: number }) {
    const [data, total] = await Promise.all([
      this.prisma.business.findMany({
        where: { affiliateId: userId },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.business.count({ where: { affiliateId: userId } }),
    ]);
    return { data, total };
  }

  async findAllAdmin(pagination: { skip?: number; take?: number }) {
    const [data, total] = await Promise.all([
      this.prisma.business.findMany({
        skip: pagination.skip,
        take: pagination.take,
        include: {
          affiliate: {
            select: { fullName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.business.count(),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    return this.prisma.business.findUnique({
      where: { id },
      include: { affiliate: true },
    });
  }

  async create(userId: string, dto: CreateBusinessDto) {
    const subscriptionAmount = this.getPlanPrice(dto.planType);
    
    // Fetch platform settings for the rate (fallback to 0.15)
    const settings = await this.prisma.platformSettings.findFirst();
    const commissionRate = settings?.directCommissionRate ? Number(settings.directCommissionRate) : 0.15;
    const commissionAmount = subscriptionAmount * commissionRate;

    return this.prisma.business.create({
      data: {
        ...dto,
        affiliateId: userId,
        subscriptionAmount,
        commissionRate,
        commissionAmount,
      },
    });
  }

  async updateStatus(id: string, dto: { status: any }) {
    const business = await this.findOne(id);
    if (!business) throw new Error('Business not found');

    const updatedBusiness = await this.prisma.business.update({
      where: { id },
      data: { 
        status: dto.status,
        paidAt: dto.status === 'ACTIVE' ? new Date() : business.paidAt,
      },
    });

    // TRIGGER COMMISSION IF ACTIVE
    if (dto.status === 'ACTIVE' && business.status !== 'ACTIVE') {
      await this.generateCommissions(business);
    }

    return updatedBusiness;
  }

  public async generateCommissions(business: any) {
    const amount = Number(business.subscriptionAmount);
    
    return this.prisma.$transaction(async (tx) => {
      // 1. Direct Commission (15%)
      const directRate = 0.15;
      const directAmount = amount * directRate;
      
      await tx.commission.create({
        data: {
          amount: directAmount,
          type: 'DIRECT',
          status: 'PENDING',
          userId: business.affiliateId,
          businessId: business.id,
          description: `Direct commission (15%) from ${business.businessName}`,
        },
      });

      // Update Affiliate Balance
      await tx.user.update({
        where: { id: business.affiliateId },
        data: { 
          pendingEarnings: { increment: directAmount },
          totalEarnings: { increment: directAmount },
        },
      });

      // 2. Manager Override (5%)
      if (business.affiliate.referrerId) {
        const indirectRate = 0.05;
        const indirectAmount = amount * indirectRate;

        await tx.commission.create({
          data: {
            amount: indirectAmount,
            type: 'INDIRECT',
            status: 'PENDING',
            userId: business.affiliate.referrerId,
            businessId: business.id,
            subAffiliateId: business.affiliateId,
            description: `Indirect commission (5%) from ${business.businessName} (via ${business.affiliate.fullName})`,
          },
        });

        // Update Manager Balance
        await tx.user.update({
          where: { id: business.affiliate.referrerId },
          data: { 
            pendingEarnings: { increment: indirectAmount },
            totalEarnings: { increment: indirectAmount },
          },
        });
      }
    });
  }
}
