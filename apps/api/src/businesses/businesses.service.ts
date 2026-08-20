import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessFilterDto } from './dto/business-filter.dto';
import { Prisma, BusinessStatus } from '@prisma/client';
import { ResendService } from '../otp/resend.service';
import { EngineService } from '../communication/engine/engine.service';
import { phoneSearchTail } from '../communication/common/communication.constants';

@Injectable()
export class BusinessesService {
  constructor(
    private prisma: PrismaService,
    private readonly resendService: ResendService,
    private readonly engineService: EngineService,
  ) {}

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
      include: {
        affiliate: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: { changedBy: { select: { id: true, fullName: true } } },
        },
      },
    });
  }

  async create(userId: string, dto: CreateBusinessDto) {
    // Plan pricing is owned by the Vemtap backend. A business logged by the
    // affiliate starts at ₦0; Vemtap's payment event sets the real amount and
    // then triggers commissions.
    const subscriptionAmount = 0;

    // Commission settings are required for financial calculations.
    const settings = await this.prisma.platformSettings.findFirst();
    if (settings?.directCommissionRate == null) {
      throw new BadRequestException('Direct commission rate is not configured');
    }
    const commissionRate = Number(settings.directCommissionRate);
    if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 1) {
      throw new BadRequestException('Direct commission rate is invalid');
    }
    const commissionAmount = 0;

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

  async updateStatus(id: string, dto: { status: BusinessStatus }, changedById: string) {
    const business = await this.findOne(id);
    if (!business) throw new NotFoundException('Business not found');

    const updatedBusiness = await this.prisma.business.update({
      where: { id },
      data: { 
        status: dto.status,
        paidAt: dto.status === 'ACTIVE' ? new Date() : business.paidAt,
      },
    });

    if (business.status !== dto.status) {
      await this.prisma.businessStatusHistory.create({
        data: {
          businessId: id,
          fromStatus: business.status,
          toStatus: dto.status,
          changedById,
        },
      });
    }

    // TRIGGER COMMISSION IF ACTIVE
    if (dto.status === 'ACTIVE' && business.status !== 'ACTIVE') {
      await this.generateCommissions(business);
    }

    // Notify the Communication Engine so journey state is updated and the
    // subscription override (stop lead messages + welcome) runs immediately.
    await this.notifyCommunicationEngine(updatedBusiness);

    return updatedBusiness;
  }

  private async notifyCommunicationEngine(business: {
    id: string;
    phone: string;
    status: BusinessStatus;
  }) {
    try {
      const tail = phoneSearchTail(business.phone);
      if (!tail) return;
      const lead = await this.prisma.lead.findFirst({
        where: { deletedAt: null, isPlaceholder: false, phone: { contains: tail } },
        select: { id: true },
      });
      if (!lead) return;

      if (business.status === 'ACTIVE') {
        await this.engineService.onSubscribed(lead.id);
      } else {
        await this.engineService.onLeadStatusChanged(lead.id);
      }
    } catch (error) {
      // Communication engine must never break the business status update.
      // Errors are swallowed and logged via the engine's own logger.
    }
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

    const emailSent = await this.resendService.sendBroadcastEmail(
      [business.email],
      `Reminder: Complete your Vemtap ${business.planType} subscription`,
      `Hi ${business.ownerName},\n\nThis is a friendly reminder to complete the subscription for ${business.businessName} so you can start using Vemtap.\n\nIf you have any questions, reply to this email or reach out to support@vemtap.com.\n\nBest regards,\nThe Vemtap Team`,
    );

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: 'Reminder sent',
        message: `Reminder sent to ${business.businessName}`,
      },
    });

    return {
      message: 'Reminder sent successfully',
      emailSent: emailSent > 0,
    };
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

    // Never generate a commission without a real subscription amount. A
    // business logged by the affiliate (₦0) only earns once Vemtap's payment
    // event sets the actual amount.
    if (!Number.isFinite(amount) || amount <= 0) {
      return { skipped: true, reason: 'No subscription amount set' };
    }

    // Fetch current rates from settings
    const settings = await this.prisma.platformSettings.findFirst();
    if (settings?.directCommissionRate == null) {
      throw new BadRequestException('Direct commission rate is not configured');
    }
    const directRate = Number(settings.directCommissionRate);
    if (!Number.isFinite(directRate) || directRate < 0 || directRate > 1) {
      throw new BadRequestException('Direct commission rate is invalid');
    }
    
    // Default indirect rate is 5%, but boosted to 10% if Manager Mode is active
    if (settings?.indirectCommissionRate == null) {
      throw new BadRequestException('Indirect commission rate is not configured');
    }
    let indirectRate = Number(settings.indirectCommissionRate);
    if (!Number.isFinite(indirectRate) || indirectRate < 0 || indirectRate > 1) {
      throw new BadRequestException('Indirect commission rate is invalid');
    }

    return this.prisma.$transaction(async (tx) => {
      // Guard: Check if direct commission already exists for this business
      const existingDirect = await tx.commission.findFirst({
        where: {
          businessId: business.id,
          type: 'DIRECT',
        },
      });

      if (!existingDirect) {
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
      }

      // 2. Team Override (Indirect)
      if (business.affiliate.referrerId) {
        // Guard: Check if indirect commission already exists for this business
        const existingIndirect = await tx.commission.findFirst({
          where: {
            businessId: business.id,
            type: 'INDIRECT',
          },
        });

        if (!existingIndirect) {
          const referrer = await tx.user.findUnique({
            where: { id: business.affiliate.referrerId },
            select: { role: true },
          });

          // Only Supervisors and Managers (or legacy users in Manager Mode) earn overrides
          if (referrer && ((referrer.role as string) === 'SUPERVISOR' || (referrer.role as string) === 'MANAGER')) {
            const managerRate = Number(settings?.managerOverrideRate ?? 0.10);
            const supervisorRate = Number(settings?.supervisorOverrideRate ?? 0.05);
            // Managers earn a boosted override; Supervisors earn the standard rate
            indirectRate = (referrer.role as string) === 'MANAGER' ? managerRate : supervisorRate;

            const indirectAmount = amount * indirectRate;

            await tx.commission.create({
              data: {
                amount: indirectAmount,
                type: 'INDIRECT',
                status: 'PENDING',
                userId: business.affiliate.referrerId,
                businessId: business.id,
                subAffiliateId: business.affiliateId,
                description: `Indirect commission (${indirectRate * 100}%) from ${business.businessName} (via ${business.affiliate.fullName})${referrer.role === 'MANAGER' ? ' [Manager Mode Boost]' : ''}`,
              },
            });

            // Update Recruiter Balance
            await tx.user.update({
              where: { id: business.affiliate.referrerId },
              data: { 
                pendingEarnings: { increment: indirectAmount },
                totalEarnings: { increment: indirectAmount },
              },
            });
          }
        }
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

