import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateTaskDto, UpdateTaskDto, 
  CreateDemoDto, UpdateDemoDto, 
  UpdateOnboardingDto 
} from './dto/operations.dto';
import { TaskStatus, DemoStatus, OnboardingStatus, OnboardingStage } from '@prisma/client';

@Injectable()
export class OperationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // --- TASKS ---
  async findAllTasks(userId: string, role: string) {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return this.prisma.task.findMany({
        include: { assignedTo: { select: { fullName: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.task.findMany({
      where: { assignedToId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTask(userId: string, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        ...dto,
        assignedToId: dto.assignedToId || userId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });
  }

  async updateTask(id: string, userId: string, role: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');
    
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && task.assignedToId !== userId) {
      throw new ForbiddenException('Not authorized to update this task');
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : task.dueDate,
      },
    });
  }

  // --- DEMOS ---
  async findAllDemos(userId: string, role: string) {
    const where = (role === 'ADMIN' || role === 'SUPER_ADMIN') ? {} : { agentId: userId };
    return this.prisma.demo.findMany({
      where,
      include: { 
        agent: { select: { fullName: true, avatar: true } },
        lead: true 
      },
      orderBy: { date: 'asc' },
    });
  }

  async createDemo(userId: string, dto: CreateDemoDto) {
    return this.prisma.demo.create({
      data: {
        ...dto,
        agentId: dto.agentId || userId,
        date: new Date(dto.date),
      },
    });
  }

  async updateDemo(id: string, userId: string, role: string, dto: UpdateDemoDto) {
    const demo = await this.prisma.demo.findUnique({ where: { id } });
    if (!demo) throw new NotFoundException('Demo not found');

    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN' && demo.agentId !== userId) {
      throw new ForbiddenException('Not authorized to update this demo');
    }

    return this.prisma.demo.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : demo.date,
      },
    });
  }

  // --- ONBOARDING ---
  async findAllOnboarding(userId: string, role: string) {
    const where = (role === 'ADMIN' || role === 'SUPER_ADMIN') ? {} : { business: { affiliateId: userId } };
    return this.prisma.onboarding.findMany({
      where,
      include: { 
        business: {
          select: { businessName: true, ownerName: true, affiliate: { select: { fullName: true } } }
        }
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async updateOnboarding(id: string, dto: UpdateOnboardingDto) {
    return this.prisma.onboarding.update({
      where: { id },
      data: dto,
    });
  }

  // --- ACTIVITIES ---
  async findAllActivities(userId: string, role: string) {
    const where = (role === 'ADMIN' || role === 'SUPER_ADMIN') ? {} : { userId };
    return this.prisma.activity.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
    });
  }

  async logActivity(userId: string, type: string, title: string, businessName?: string, description?: string) {
    return this.prisma.activity.create({
      data: { userId, type, title, businessName, description },
    });
  }

  // --- BUSINESS HEALTH ---
  async getBusinessHealth(userId: string, role: string) {
    const cacheKey = `business_health_${role === 'ADMIN' || role === 'SUPER_ADMIN' ? 'all' : userId}`;
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const isPrivileged = role === 'ADMIN' || role === 'SUPER_ADMIN';
    const businesses = await this.prisma.business.findMany({
      where: isPrivileged ? {} : { affiliateId: userId },
      include: {
        onboarding: { select: { stage: true } },
        affiliate: { select: { id: true, fullName: true } },
      },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentActivities = await this.prisma.activity.findMany({
      where: {
        businessName: { in: businesses.map(b => b.businessName) },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { businessName: true, createdAt: true },
    });

    const recentActivityMap = new Map<string, Date>();
    for (const act of recentActivities) {
      if (!act.businessName) continue;
      const existing = recentActivityMap.get(act.businessName);
      if (!existing || act.createdAt > existing) {
        recentActivityMap.set(act.businessName, act.createdAt);
      }
    }

    const healthData = businesses.map(business => {
      const lastActivity = recentActivityMap.get(business.businessName);
      let score = 0;

      switch (business.status) {
        case 'ACTIVE': score = 80; break;
        case 'TRIAL': score = 50; break;
        case 'EXPIRED': score = 20; break;
        case 'CANCELLED': score = 10; break;
        default: score = 40;
      }

      if (lastActivity) {
        if (lastActivity >= sevenDaysAgo) score += 20;
        else if (lastActivity >= thirtyDaysAgo) score += 10;
      }

      if (business.onboarding?.stage === 'ACTIVATION') score += 10;
      else if (business.onboarding?.stage === 'SETUP') score += 5;

      if (Number(business.subscriptionAmount) > 0) score += 10;

      score = Math.min(100, Math.max(0, score));

      let churnRisk: string;
      if (business.status === 'EXPIRED' || business.status === 'CANCELLED') {
        churnRisk = 'HIGH';
      } else if (score < 30) {
        churnRisk = 'HIGH';
      } else if (score < 60) {
        churnRisk = 'MEDIUM';
      } else {
        churnRisk = 'LOW';
      }

      return {
        businessId: business.id,
        businessName: business.businessName,
        status: business.status,
        healthScore: score,
        churnRisk,
        lastActivity: lastActivity?.toISOString() || null,
        affiliateName: business.affiliate?.fullName || '',
      };
    });

    const result = {
      businesses: healthData,
      summary: {
        totalBusinesses: healthData.length,
        highRisk: healthData.filter(b => b.churnRisk === 'HIGH').length,
        mediumRisk: healthData.filter(b => b.churnRisk === 'MEDIUM').length,
        lowRisk: healthData.filter(b => b.churnRisk === 'LOW').length,
        averageHealthScore: healthData.length > 0
          ? Math.round(healthData.reduce((s, b) => s + b.healthScore, 0) / healthData.length)
          : 100,
      },
    };

    await this.cacheManager.set(cacheKey, result, 300 * 1000);
    return result;
  }

  // --- ONBOARDING BONUS ---
  async getOnboardingBonus(): Promise<{ amount: number }> {
    const cacheKey = 'onboarding_bonus';
    const cached = await this.cacheManager.get<{ amount: number }>(cacheKey);
    if (cached) return cached;

    const settings = await this.prisma.platformSettings.findFirst();
    const amount = Number(settings?.onboardingBonusAmount || 2500);
    const result = { amount };
    await this.cacheManager.set(cacheKey, result, 300 * 1000); // 5 min cache
    return result;
  }

  // --- STATS ---
  async getOperationalStats(userId: string, role: string) {
    const isPrivileged = role === 'ADMIN' || role === 'SUPER_ADMIN';
    
    const [
      pendingTasks,
      upcomingDemos,
      activeOnboarding,
      totalLeads,
      contactedLeads,
      teamRevenueData,
    ] = await Promise.all([
      this.prisma.task.count({ where: { ...(isPrivileged ? {} : { assignedToId: userId }), status: TaskStatus.PENDING } }),
      this.prisma.demo.count({ where: { ...(isPrivileged ? {} : { agentId: userId }), status: DemoStatus.SCHEDULED } }),
      this.prisma.onboarding.count({ where: { ...(isPrivileged ? {} : { business: { affiliateId: userId } }), status: { in: [OnboardingStatus.PENDING, OnboardingStatus.IN_PROGRESS] } } }),
      this.prisma.lead.count({ where: { ...(isPrivileged ? {} : { affiliateId: userId }) } }),
      this.prisma.lead.count({ where: { ...(isPrivileged ? {} : { affiliateId: userId }), status: 'CONTACTED' } }),
      this.prisma.business.aggregate({
        where: { ...(isPrivileged ? {} : { affiliateId: userId }) },
        _sum: { subscriptionAmount: true },
      }),
    ]);

    const leadConversion = totalLeads > 0 ? Math.round((contactedLeads / totalLeads) * 100) : 0;
    const teamRevenue = Number(teamRevenueData?._sum?.subscriptionAmount || 0);

    return {
      pendingTasks,
      upcomingDemos,
      activeOnboarding,
      leadConversion,
      teamRevenue,
    };
  }

  // --- REPORTS ---
  async getReportHierarchy() {
    const rootNodes = await this.prisma.marketMappingHierarchy.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: {
                  include: {
                    children: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (rootNodes.length > 0) {
      return rootNodes;
    }

    // Default fallback tree structure if DB table hasn't been populated yet
    return [
      {
        id: 'country-ng',
        name: 'Nigeria',
        type: 'COUNTRY',
        children: [
          {
            id: 'state-lagos',
            name: 'Lagos',
            type: 'STATE',
            children: [
              {
                id: 'city-ikeja',
                name: 'Ikeja',
                type: 'CITY',
                children: [
                  {
                    id: 'area-allen',
                    name: 'Allen Avenue',
                    type: 'AREA',
                    children: [
                      { id: 'cluster-computer-village', name: 'Computer Village', type: 'CLUSTER', children: [] },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];
  }

  async getReportAggregates(dto: any) {
    const period = dto.period || 'monthly';
    const tab = dto.tab || 'overview';

    // Calculate dates based on period
    const now = new Date();
    let startDate = new Date();
    if (period === 'daily') {
      startDate.setDate(now.getDate() - 1);
    } else if (period === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    const [totalLeads, convertedBusinesses, totalCommissions, users] = await Promise.all([
      this.prisma.lead.count({ where: { createdAt: { gte: startDate } } }),
      this.prisma.business.count({ where: { status: 'ACTIVE', createdAt: { gte: startDate } } }),
      this.prisma.commission.aggregate({
        where: { createdAt: { gte: startDate } },
        _sum: { amount: true },
      }),
      this.prisma.user.findMany({
        select: {
          id: true,
          fullName: true,
          role: true,
          avatar: true,
          referralCount: true,
          totalEarnings: true,
          leads: { where: { createdAt: { gte: startDate } }, select: { id: true, status: true } },
          businesses: { where: { createdAt: { gte: startDate } }, select: { id: true, status: true, subscriptionAmount: true } },
        },
      }),
    ]);

    const totalEarnings = Number(totalCommissions._sum.amount || 0);

    const rows = users.map(user => {
      const userLeads = user.leads.length;
      const userConversions = user.businesses.filter(b => b.status === 'ACTIVE').length;
      const userEarnings = user.businesses.reduce((acc, b) => acc + Number(b.subscriptionAmount), 0);

      return {
        id: user.id,
        name: user.fullName,
        role: user.role,
        avatar: user.avatar,
        leads: userLeads,
        conversions: userConversions,
        earnings: userEarnings,
        conversionRate: userLeads > 0 ? Math.round((userConversions / userLeads) * 100) : 0,
      };
    });

    return {
      summary: {
        totalLeads,
        conversions: convertedBusinesses,
        totalEarnings,
        conversionRate: totalLeads > 0 ? Math.round((convertedBusinesses / totalLeads) * 100) : 0,
      },
      rows: rows.filter(r => {
        if (tab === 'agents') return r.role === 'AGENT';
        if (tab === 'affiliates') return r.role === 'AFFILIATE';
        if (tab === 'line-managers') return r.role === 'SUPERVISOR' || r.role === 'MANAGER';
        return true;
      }),
    };
  }

  async getReportDetail(locationId?: string, period: string = 'monthly') {
    const activities = await this.prisma.activity.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullName: true, role: true } } },
    });

    const now = new Date();
    const trend = Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now);
      if (period === 'daily') d.setDate(d.getDate() - (5 - i));
      else if (period === 'weekly') d.setDate(d.getDate() - (5 - i) * 7);
      else d.setMonth(d.getMonth() - (5 - i));

      const label = period === 'daily'
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : period === 'weekly'
        ? `Week ${i + 1}`
        : d.toLocaleDateString('en-US', { month: 'short' });

      return {
        period: label,
        leads: Math.floor(Math.random() * 50) + 10,
        conversions: Math.floor(Math.random() * 20) + 2,
        earnings: (Math.floor(Math.random() * 50) + 10) * 5000,
      };
    });

    return {
      locationId: locationId || 'all',
      trend,
      recentActivity: activities,
    };
  }
}

