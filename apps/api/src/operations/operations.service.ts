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
}
