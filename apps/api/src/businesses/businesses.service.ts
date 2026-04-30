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

  async findAll(userId: string) {
    return this.prisma.business.findMany({
      where: { affiliateId: userId },
      orderBy: { createdAt: 'desc' },
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
}
