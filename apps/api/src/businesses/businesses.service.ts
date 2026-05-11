import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessFilterDto } from './dto/business-filter.dto';
import { PlanType, Prisma, BusinessStatus } from '@prisma/client';

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

  async findAll(userId: string, filters: BusinessFilterDto) {
    const where = this.buildWhereClause(filters, userId);

    const [data, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.business.count({ where }),
    ]);
    return { data, total };
  }

  async findAllAdmin(filters: BusinessFilterDto) {
    const where = this.buildWhereClause(filters);

    const [data, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        skip: filters.skip,
        take: filters.take,
        include: {
          affiliate: {
            select: { fullName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.business.count({ where }),
    ]);
    return { data, total };
  }

  private buildWhereClause(filters: BusinessFilterDto, userId?: string): Prisma.BusinessWhereInput {
    const where: Prisma.BusinessWhereInput = {};

    if (userId) {
      where.affiliateId = userId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.planType) {
      where.planType = filters.planType;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {
        ...(filters.startDate && { gte: new Date(filters.startDate) }),
        ...(filters.endDate && { lte: new Date(filters.endDate) }),
      };
    }

    if (filters.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { ownerName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
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

  async update(id: string, userId: string, dto: UpdateBusinessDto) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    
    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.affiliateId !== userId) {
      throw new ForbiddenException('You do not have permission to update this business');
    }

    return this.prisma.business.update({
      where: { id },
      data: dto,
    });
  }

  async updateStatus(id: string, dto: { status: BusinessStatus }) {
    const business = await this.findOne(id);
    if (!business) throw new NotFoundException('Business not found');

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

  async sendReminder(id: string, userId: string) {
    const business = await this.prisma.business.findUnique({ where: { id } });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.affiliateId !== userId) {
      throw new ForbiddenException('You do not have permission to send reminders for this business');
    }

    if (business.status === 'ACTIVE') {
      throw new BadRequestException('Cannot send reminder for an active business');
    }

    // Cooldown check (24 hours)
    if (business.lastReminderAt) {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      if (business.lastReminderAt > oneDayAgo) {
        throw new BadRequestException('Reminder already sent recently. Please wait 24 hours.');
      }
    }

    // Update lastReminderAt
    await this.prisma.business.update({
      where: { id },
      data: { lastReminderAt: new Date() },
    });

    // TODO: Actually send email/notification here
    return { message: 'Reminder sent successfully' };
  }

  async exportToCsv(userId: string, filters: BusinessFilterDto) {
    const where = this.buildWhereClause(filters, userId);
    
    const businesses = await this.prisma.business.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Business Name',
      'Owner Name',
      'Email',
      'Phone',
      'Plan Type',
      'Status',
      'Amount',
      'Created At'
    ].join(',');

    const rows = businesses.map(b => [
      `"${b.businessName.replace(/"/g, '""')}"`,
      `"${b.ownerName.replace(/"/g, '""')}"`,
      b.email,
      b.phone,
      b.planType,
      b.status,
      b.subscriptionAmount,
      b.createdAt.toISOString()
    ].join(','));

    return [headers, ...rows].join('\n');
  }

  public async generateCommissions(business: any) {
    const amount = Number(business.subscriptionAmount);
    
    // Fetch current rates from settings
    const settings = await this.prisma.platformSettings.findFirst();
    const directRate = settings?.directCommissionRate ? Number(settings.directCommissionRate) : 0.15;
    
    // Default indirect rate is 5%, but boosted to 10% if Manager Mode is active
    let indirectRate = settings?.indirectCommissionRate ? Number(settings.indirectCommissionRate) : 0.05;

    return this.prisma.$transaction(async (tx) => {
      // 1. Direct Commission
      const directAmount = amount * directRate;
      
      await tx.commission.create({
        data: {
          amount: directAmount,
          type: 'DIRECT',
          status: 'PENDING',
          userId: business.affiliateId,
          businessId: business.id,
          description: `Direct commission (${directRate * 100}%) from ${business.businessName}`,
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

      // 2. Manager Override (Indirect)
      if (business.affiliate.referrerId) {
        const referrer = await tx.user.findUnique({
          where: { id: business.affiliate.referrerId },
          select: { isManagerMode: true },
        });

        if (referrer?.isManagerMode) {
          indirectRate = 0.10; // Manager Mode Boost
        }

        const indirectAmount = amount * indirectRate;

        await tx.commission.create({
          data: {
            amount: indirectAmount,
            type: 'INDIRECT',
            status: 'PENDING',
            userId: business.affiliate.referrerId,
            businessId: business.id,
            subAffiliateId: business.affiliateId,
            description: `Indirect commission (${indirectRate * 100}%) from ${business.businessName} (via ${business.affiliate.fullName})${referrer?.isManagerMode ? ' [Manager Mode Boost]' : ''}`,
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

  async getPortfolioStats(userId: string) {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    const [activeCount, totalCommissions, history] = await Promise.all([
      this.prisma.business.count({
        where: { affiliateId: userId, status: 'ACTIVE' },
      }),
      this.prisma.commission.aggregate({
        where: { userId, status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.commission.findMany({
        where: { 
          userId, 
          status: 'PAID',
          createdAt: { gte: sixMonthsAgo }
        },
        select: { createdAt: true, amount: true },
        orderBy: { createdAt: 'desc' },
      })
    ]);

    // Group history by month
    const groupedHistory = history.reduce((acc, curr) => {
      const month = curr.createdAt.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!acc[month]) acc[month] = 0;
      acc[month] += Number(curr.amount);
      return acc;
    }, {} as Record<string, number>);

    const formattedHistory = Object.entries(groupedHistory).map(([month, amount]) => ({
      month,
      amount: `₦${amount.toLocaleString()}`,
      status: 'Received'
    })).slice(0, 5);

    return {
      activeSubscriberCount: activeCount,
      totalPortfolioEarnings: Number(totalCommissions._sum.amount || 0),
      earningsHistory: formattedHistory
    };
  }
}

