import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateTaskDto, UpdateTaskDto, 
  CreateDemoDto, UpdateDemoDto, 
  UpdateOnboardingDto 
} from './dto/operations.dto';
import { TaskStatus, DemoStatus, OnboardingStatus, Prisma } from '@prisma/client';

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
          : 0,
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

    const flatten = (nodes: typeof rootNodes, parentId: string | null = null): Array<Record<string, unknown>> =>
      nodes.flatMap((node) => [
        { id: node.id, name: node.name, type: node.type, parentId, totalBusinesses: node.totalBusinesses, penetration: node.penetration },
        ...flatten(node.children, node.id),
      ]);

    return flatten(rootNodes);
  }

  private getReportStart(period: string): Date {
    const start = new Date();
    if (period === 'daily') start.setDate(start.getDate() - 1);
    else if (period === 'weekly') start.setDate(start.getDate() - 7);
    else start.setMonth(start.getMonth() - 1);
    return start;
  }

  private reportRow(user: { id: string; fullName: string; role: string; leads: { id: string }[]; businesses: { status: string; subscriptionAmount: unknown }[] }) {
    const leads = user.leads.length;
    const conversions = user.businesses.filter((business) => business.status === 'ACTIVE').length;
    const earnings = user.businesses.reduce((sum, business) => sum + Number(business.subscriptionAmount), 0);
    return { id: user.id, name: user.fullName, role: user.role, leads, conversions, earnings, conversionRate: leads ? Math.round((conversions / leads) * 100) : 0 };
  }

  async getReportAggregates(dto: {
    period?: string;
    tab?: string;
    country?: string;
    state?: string;
    city?: string;
    area?: string;
    cluster?: string;
  }) {
    const startDate = this.getReportStart(dto.period || 'monthly');
    const users = await this.prisma.user.findMany({
      where: dto.tab === 'agents' ? { role: 'AGENT' } : dto.tab === 'affiliates' ? { role: 'AFFILIATE' } : dto.tab === 'line-managers' ? { role: { in: ['SUPERVISOR', 'MANAGER'] } } : {},
      select: {
        id: true, fullName: true, role: true,
        leads: { where: { createdAt: { gte: startDate } }, select: { id: true } },
        businesses: { where: { createdAt: { gte: startDate } }, select: { status: true, subscriptionAmount: true } },
      },
    });
    const userRows = users.map((user) => this.reportRow(user));
    let rows = userRows;
    if (dto.tab === 'locations') {
      const hierarchy = await this.getReportHierarchy() as Array<{ id: string; name: string; type: string; parentId: string | null }>;
      const selectedId = dto.cluster || dto.area || dto.city || dto.state || dto.country;
      const descendants = new Set<string>(selectedId ? [selectedId] : hierarchy.map((node) => node.id));
      if (selectedId) {
        let changed = true;
        while (changed) {
          changed = false;
          for (const node of hierarchy) {
            if (node.parentId && descendants.has(node.parentId) && !descendants.has(node.id)) {
              descendants.add(node.id);
              changed = true;
            }
          }
        }
      }
      const assignments = await this.prisma.marketMappingAssignment.findMany({
        where: { clusterId: { in: Array.from(descendants) } },
        select: { userId: true, clusterId: true, cluster: { select: { id: true, name: true, type: true } } },
      });
      const rowsByCluster = new Map<string, { id: string; name: string; role: 'LOCATION'; level: string; leads: number; conversions: number; earnings: number; conversionRate: number }>();
      for (const assignment of assignments) {
        const row = rowsByCluster.get(assignment.clusterId) || { id: assignment.cluster.id, name: assignment.cluster.name, role: 'LOCATION', level: assignment.cluster.type, leads: 0, conversions: 0, earnings: 0, conversionRate: 0 };
        const userRow = userRows.find((user) => user.id === assignment.userId);
        if (userRow) {
          row.leads += userRow.leads;
          row.conversions += userRow.conversions;
          row.earnings += userRow.earnings;
        }
        row.conversionRate = row.leads ? Math.round((row.conversions / row.leads) * 100) : 0;
        rowsByCluster.set(assignment.clusterId, row);
      }
      rows = Array.from(rowsByCluster.values());
    }
    const summary = rows.reduce((result, row) => ({
      totalLeads: result.totalLeads + row.leads,
      conversions: result.conversions + row.conversions,
      totalEarnings: result.totalEarnings + row.earnings,
      totalMembers: result.totalMembers + 1,
      activeMembers: result.activeMembers + (row.leads || row.conversions ? 1 : 0),
    }), { totalLeads: 0, conversions: 0, totalEarnings: 0, totalMembers: 0, activeMembers: 0 });

    return {
      summary: { ...summary, conversionRate: summary.totalLeads ? Math.round((summary.conversions / summary.totalLeads) * 100) : 0 },
      rows,
    };
  }

  async getReportDetail(params: { subjectId?: string; type: string; period?: string; locationId?: string }) {
    const startDate = this.getReportStart(params.period || 'monthly');
    let locationUserIds: string[] | undefined;
    if (params.type === 'location' && params.locationId) {
      const assignments = await this.prisma.marketMappingAssignment.findMany({
        where: { clusterId: params.locationId },
        select: { userId: true },
      });
      locationUserIds = assignments.map((assignment) => assignment.userId);
    }
    const userWhere: Prisma.UserWhereInput = params.subjectId && params.type !== 'location'
      ? { id: params.subjectId }
      : locationUserIds ? { id: { in: locationUserIds } } : {};
    const users = await this.prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        leads: { where: { createdAt: { gte: startDate } }, select: { createdAt: true } },
        businesses: { where: { createdAt: { gte: startDate } }, select: { createdAt: true, status: true, subscriptionAmount: true } },
      },
    });
    const leads = users.flatMap((user) => user.leads);
    const businesses = users.flatMap((user) => user.businesses);
    const userIds = users.map((user) => user.id);
    const [commissions, activities] = await Promise.all([
      this.prisma.commission.findMany({ where: { userId: { in: userIds }, createdAt: { gte: startDate } }, select: { createdAt: true, amount: true } }),
      this.prisma.activity.findMany({ where: { userId: { in: userIds }, createdAt: { gte: startDate } }, take: 20, orderBy: { createdAt: 'desc' }, include: { user: { select: { fullName: true, role: true } } } }),
    ]);
    const summary = {
      leads: leads.length,
      conversions: businesses.filter((business) => business.status === 'ACTIVE').length,
      earnings: commissions.reduce((sum, commission) => sum + Number(commission.amount), 0),
    };
    const trend = Array.from({ length: 6 }, (_, index) => {
      const bucketStart = new Date();
      if (params.period === 'daily') bucketStart.setDate(bucketStart.getDate() - (5 - index));
      else if (params.period === 'weekly') bucketStart.setDate(bucketStart.getDate() - (5 - index) * 7);
      else bucketStart.setMonth(bucketStart.getMonth() - (5 - index));
      const bucketEnd = new Date(bucketStart);
      if (params.period === 'daily') bucketEnd.setDate(bucketEnd.getDate() + 1);
      else if (params.period === 'weekly') bucketEnd.setDate(bucketEnd.getDate() + 7);
      else bucketEnd.setMonth(bucketEnd.getMonth() + 1);
      const inBucket = (date: Date) => date >= bucketStart && date < bucketEnd;
      return {
        period: params.period === 'daily' ? bucketStart.toLocaleDateString('en-US', { weekday: 'short' }) : params.period === 'weekly' ? `Week ${index + 1}` : bucketStart.toLocaleDateString('en-US', { month: 'short' }),
        leads: leads.filter((lead) => inBucket(lead.createdAt)).length,
        conversions: businesses.filter((business) => business.status === 'ACTIVE' && inBucket(business.createdAt)).length,
        earnings: commissions.filter((commission) => inBucket(commission.createdAt)).reduce((sum, commission) => sum + Number(commission.amount), 0),
      };
    });

    return {
      subjectId: params.subjectId || null,
      summary: { ...summary, conversionRate: summary.leads ? Math.round((summary.conversions / summary.leads) * 100) : 0 },
      trend,
      recentActivities: activities,
    };
  }
}
