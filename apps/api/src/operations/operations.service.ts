import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateTaskDto, UpdateTaskDto, 
  CreateDemoDto, UpdateDemoDto, 
  UpdateOnboardingDto 
} from './dto/operations.dto';
import { TaskStatus, DemoStatus, OnboardingStatus, OnboardingStage } from '@prisma/client';

@Injectable()
export class OperationsService {
  constructor(private prisma: PrismaService) {}

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
      slaPerformance: 98,
    };
  }
}
