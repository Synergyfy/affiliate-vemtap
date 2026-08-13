import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BonusType, UpdateTargetsDto } from './dto/network-response.dto';

@Injectable()
export class NetworkService {
  constructor(private prisma: PrismaService) {}

  async getRecruits(userId: string, pagination: { skip?: number; take?: number }) {
    const [settings, data, total] = await Promise.all([
      this.prisma.platformSettings.findFirst(),
      this.prisma.user.findMany({
        where: { referrerId: userId },
        skip: pagination.skip,
        take: pagination.take,
        select: {
          id: true,
          fullName: true,
           email: true,
           role: true,
           status: true,
           createdAt: true,
           updatedAt: true,
           dailyLeadTarget: true,
           monthlyConversionTarget: true,
          totalEarnings: true,
           _count: {
             select: { referrals: true, businesses: true, leads: true },
          },
           businesses: {
             select: { subscriptionAmount: true, createdAt: true },
           },
            leads: { where: { isPlaceholder: false }, select: { createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { referrerId: userId } }),
    ]);

    const managerShareRate = Number(settings?.managerOverrideRate ?? 0.10);

    const recruits = data.map(r => {
      const totalVolume = r.businesses.reduce((sum, b) => sum + Number(b.subscriptionAmount), 0);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const week = new Date(today); week.setDate(today.getDate() - 6);
      const month = new Date(today); month.setDate(today.getDate() - 29);
      const dailyLeadsCount = r.leads.filter((lead) => lead.createdAt >= today).length;
      const weeklyLeadsCount = r.leads.filter((lead) => lead.createdAt >= week).length;
      const monthlyLeadsCount = r.leads.filter((lead) => lead.createdAt >= month).length;
      return {
        id: r.id,
        fullName: r.fullName,
        email: r.email,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        role: r.role,
        dailyLeadTarget: r.dailyLeadTarget,
        monthlyConversionTarget: r.monthlyConversionTarget,
        totalEarnings: Number(r.totalEarnings),
        referralCount: r._count.referrals,
        businessCount: r._count.businesses,
        leadCount: r._count.leads,
        dailyLeadsCount,
        weeklyLeadsCount,
        monthlyLeadsCount,
        monthlyConversionsCount: r.businesses.filter((business) => business.createdAt >= month).length,
        completionRate: r.leads.length ? Math.round((r.businesses.length / r.leads.length) * 100) : 0,
        managerShare: totalVolume * managerShareRate,
      };
    });

    return { data: recruits, total };
  }

  async getStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        createdAt: true,
        reportingScore: true,
        attendanceRate: true,
        managerQualificationExpiry: true,

        hasClaimedAgentBonus: true,
        hasClaimedBusinessBonus: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const reportingScoreVal = Number(user.reportingScore ?? 0);
    const attendanceRateVal = Number(user.attendanceRate ?? 0);

    const settings = await this.prisma.platformSettings.findFirst();

    // 1. Calculate Personal Performance Metrics (for AGENT -> SUPERVISOR promotion)
    const personalActiveBusinesses = await this.prisma.business.count({
      where: {
        affiliateId: userId,
        status: 'ACTIVE',
      },
    });

    const daysActive = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const openFraudAlertsCount = await this.prisma.fraudAlert.count({
      where: {
        userId,
        status: 'OPEN',
      },
    });

    // 2. Calculate Team/Network Metrics (for SUPERVISOR -> MANAGER promotion)
    // Count active agents (direct recruits who have closed at least 1 business)
    const activeAgentsCount = await this.prisma.user.count({
      where: {
        referrerId: userId,
        businesses: { some: {} },
      },
    });

    // Count direct supervisors under this user
    const supervisorsCount = await this.prisma.user.count({
      where: {
        referrerId: userId,
        role: 'SUPERVISOR',
      },
    });

    // Total recruits (anyone referred, regardless of activity)
    const totalRecruitsCount = await this.prisma.user.count({
      where: { referrerId: userId },
    });

    // Total businesses closed in the network (direct + indirect)
    const totalNetworkBusinesses = await this.prisma.business.count({
      where: {
        status: 'ACTIVE',
        OR: [
          { affiliateId: userId }, // Direct businesses closed by user
          { affiliate: { referrerId: userId } } // Indirect businesses closed by recruits
        ]
      },
    });

    // 3. Determine Promotion Eligibility
    const isEligibleForSupervisor = 
      personalActiveBusinesses >= Number(settings?.reqAgentActiveBusinesses ?? 40) &&
      daysActive >= Number(settings?.reqAgentActiveDays ?? 90) &&
      reportingScoreVal >= Number(settings?.reqAgentMinReportingScore ?? 85) &&
      attendanceRateVal >= Number(settings?.reqAgentMinAttendanceRate ?? 90) &&
      openFraudAlertsCount === 0;

    const isEligibleForManager =
      activeAgentsCount >= Number(settings?.reqSupervisorActiveAgents ?? 10) &&
      supervisorsCount >= Number(settings?.reqSupervisorActiveSupervisors ?? 5) &&
      totalNetworkBusinesses >= Number(settings?.reqSupervisorNetworkBusinesses ?? 100);

    // 4. Structure dynamic milestone targets (backward compatible with the frontend)
    let milestoneAgentsCurrent = activeAgentsCount;
    let milestoneAgentsTarget = Number(settings?.reqAffiliateActiveAgents ?? 30);
    let milestoneBusinessesCurrent = totalNetworkBusinesses;
    let milestoneBusinessesTarget = Number(settings?.reqAffiliateNetworkBusinesses ?? 100);

    if (user.role === 'AGENT') {
      // Trying to unlock SUPERVISOR: milestones map to Active Days (Agents) and Personal Businesses (Businesses)
      milestoneAgentsCurrent = daysActive;
      milestoneAgentsTarget = Number(settings?.reqAgentActiveDays ?? 90);
      milestoneBusinessesCurrent = personalActiveBusinesses;
      milestoneBusinessesTarget = Number(settings?.reqAgentActiveBusinesses ?? 40);
    } else {
      // Trying to unlock MANAGER (for SUPERVISOR -> MANAGER) OR unlock SUPERVISOR (for AFFILIATE -> SUPERVISOR)
      milestoneAgentsCurrent = activeAgentsCount;
      milestoneAgentsTarget = user.role === 'AFFILIATE' ? Number(settings?.reqAffiliateActiveAgents ?? 30) : Number(settings?.reqSupervisorActiveAgents ?? 10);
      milestoneBusinessesCurrent = totalNetworkBusinesses;
      milestoneBusinessesTarget = Number(settings?.reqSupervisorNetworkBusinesses ?? 100);
    }

    return {
      role: user.role,
      daysActive,
      reportingScore: reportingScoreVal,
      attendanceRate: attendanceRateVal,
      personalActiveBusinesses,
      openFraudAlertsCount,
      activeAgentsCount,
      supervisorsCount,
      totalRecruitsCount,
      totalNetworkBusinesses,
      isEligibleForSupervisor,
      isEligibleForManager,
      milestones: {
        agents: {
          current: milestoneAgentsCurrent,
          target: milestoneAgentsTarget,
          isReached: milestoneAgentsCurrent >= milestoneAgentsTarget,
        },
        businesses: {
          current: milestoneBusinessesCurrent,
          target: milestoneBusinessesTarget,
          isReached: milestoneBusinessesCurrent >= milestoneBusinessesTarget,
        },
      },
      managerQualificationExpiry: user.managerQualificationExpiry,
      isManagerMode: user.role === 'SUPERVISOR' || user.role === 'MANAGER',
      hasClaimedAgentBonus: user.hasClaimedAgentBonus,
      hasClaimedBusinessBonus: user.hasClaimedBusinessBonus,
    };
  }

  async claimBonus(userId: string, type: BonusType) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const stats = await this.getStats(userId);
    let amount = 0;
    let description = '';

    const settings = await this.prisma.platformSettings.findFirst();

    if (type === BonusType.AGENT) {
      if (user.hasClaimedAgentBonus) throw new BadRequestException('Agent bonus already claimed');
      if (!stats.milestones.agents.isReached) throw new BadRequestException('Target for agent bonus not reached');
      amount = Number(settings?.agentMilestoneBonusAmount ?? 5000);
      description = 'Agent milestone bonus';
    } else if (type === BonusType.BUSINESS) {
      if (user.hasClaimedBusinessBonus) throw new BadRequestException('Business bonus already claimed');
      if (!stats.milestones.businesses.isReached) throw new BadRequestException('Target for business bonus not reached');
      amount = Number(settings?.businessMilestoneBonusAmount ?? 10000);
      description = 'Business milestone bonus';
    } else {
      throw new BadRequestException('Invalid bonus type');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create bonus commission
      await tx.commission.create({
        data: {
          userId,
          amount,
          type: 'BONUS',
          status: 'PENDING',
          description,
        },
      });

      // Update user claim status and balance
      await tx.user.update({
        where: { id: userId },
        data: {
          hasClaimedAgentBonus: type === BonusType.AGENT ? true : user!.hasClaimedAgentBonus,
          hasClaimedBusinessBonus: type === BonusType.BUSINESS ? true : user!.hasClaimedBusinessBonus,
          pendingEarnings: { increment: amount },
          totalEarnings: { increment: amount },
        },
      });

      return { success: true, amount };
    });
  }

  async toggleManagerMode(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const stats = await this.getStats(userId);
    let nextRole = user.role;

    if (user.role === 'AGENT') {
      if (!stats.isEligibleForSupervisor) {
        throw new BadRequestException('You do not meet the performance targets (40 active businesses, 90 days active, reporting compliance) to unlock Supervisor status.');
      }
      nextRole = 'SUPERVISOR';
    } else if ((user.role as string) === 'SUPERVISOR') {
      if (!stats.isEligibleForManager) {
        throw new BadRequestException('You do not meet the leadership targets (10 active agents, 5 supervisors, 100 network businesses) to unlock Manager status.');
      }
      nextRole = 'MANAGER';
    } else if (user.role === 'AFFILIATE') {
      // Legacy/Freelance Affiliate Milestone Mode
      if (!stats.milestones.agents.isReached || !stats.milestones.businesses.isReached) {
        throw new BadRequestException('You must reach both milestones (30 active agents & 100 network businesses) to unlock Supervisor status.');
      }
      nextRole = 'SUPERVISOR';
    } else if ((user.role as string) === 'SUPERVISOR' || (user.role as string) === 'MANAGER') {
      // If already supervisor/manager, return current state
      return { role: user.role, isManagerMode: true, expiry: user.managerQualificationExpiry };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: nextRole,
        managerQualificationExpiry: !user.managerQualificationExpiry 
          ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) 
          : user.managerQualificationExpiry,
      },
    });

    return { 
      role: updatedUser.role,
      isManagerMode: true, 
      expiry: updatedUser.managerQualificationExpiry 
    };
  }

  async getTeamMemberDetail(managerId: string, memberId: string) {
    const member = await this.prisma.user.findFirst({
      where: {
        id: memberId,
        OR: [
          { referrerId: managerId },
          { id: managerId },
        ],
      },
      include: {
        businesses: { select: { id: true, businessName: true, planType: true, status: true, subscriptionAmount: true, commissionAmount: true, createdAt: true } },
        leads: { where: { isPlaceholder: false }, select: { id: true, businessName: true, status: true, priority: true, createdAt: true } },
        activities: { take: 10, orderBy: { createdAt: 'desc' } },
        agentDemos: { select: { id: true, date: true, status: true } },
        targetAdjustmentsReceived: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!member) throw new NotFoundException('Team member not found');

    const totalVolume = member.businesses.reduce((sum, b) => sum + Number(b.subscriptionAmount), 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const week = new Date(today); week.setDate(today.getDate() - 6);
    const month = new Date(today); month.setDate(today.getDate() - 29);
    const dailyLeadsCount = member.leads.filter((lead) => lead.createdAt >= today).length;
    const weeklyLeadsCount = member.leads.filter((lead) => lead.createdAt >= week).length;
    const dailyConversionsCount = member.businesses.filter((business) => business.createdAt >= today && business.status === 'ACTIVE').length;
    const weeklyConversionsCount = member.businesses.filter((business) => business.createdAt >= week && business.status === 'ACTIVE').length;
    const monthlyConversionsCount = member.businesses.filter((business) => business.createdAt >= month && business.status === 'ACTIVE').length;
    const dailyVisitsCount = member.agentDemos.filter((demo) => demo.date >= today && demo.status === 'COMPLETED').length;
    const weeklyVisitsCount = member.agentDemos.filter((demo) => demo.date >= week && demo.status === 'COMPLETED').length;
    const monthlyBreakdown = Array.from({ length: 6 }, (_, index) => {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
      const businesses = member.businesses.filter((business) => business.createdAt >= monthStart && business.createdAt < monthEnd);
      const leads = member.leads.filter((lead) => lead.createdAt >= monthStart && lead.createdAt < monthEnd);
      return {
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: businesses.reduce((sum, business) => sum + Number(business.commissionAmount), 0),
        leads: leads.length,
        conversions: businesses.filter((business) => business.status === 'ACTIVE').length,
        businesses: businesses.length,
      };
    });
    const referralHistory = [
      ...member.leads.map((lead) => ({ id: lead.id, businessName: lead.businessName, type: 'lead', date: lead.createdAt, status: lead.status })),
      ...member.businesses.map((business) => ({ id: business.id, businessName: business.businessName, type: 'business', date: business.createdAt, status: business.status })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      id: member.id,
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      avatar: member.avatar,
      role: member.role,
      status: member.status,
      createdAt: member.createdAt,
      dailyLeadTarget: member.dailyLeadTarget,
      monthlyConversionTarget: member.monthlyConversionTarget,
      totalEarnings: Number(member.totalEarnings),
      businessCount: member.businesses.length,
      leadCount: member.leads.length,
      dailyLeadsCount,
      weeklyLeadsCount,
      dailyConversionsCount,
      weeklyConversionsCount,
      monthlyConversionsCount,
       dailyVisitsCount,
       weeklyVisitsCount,
      totalVolume,
      businesses: member.businesses,
      leads: member.leads,
       activities: member.activities,
       targetAdjustmentHistory: member.targetAdjustmentsReceived,
       monthlyBreakdown,
       referralHistory,
    };
  }

  async updateTargets(managerId: string, dto: UpdateTargetsDto) {
    const member = await this.prisma.user.findFirst({
      where: {
        id: dto.memberId,
        OR: [
          { referrerId: managerId },
          { id: managerId },
        ],
      },
    });

    if (!member) throw new NotFoundException('Team member not found or access denied');

    return this.prisma.$transaction(async (tx) => {
      const history = await tx.targetAdjustmentHistory.create({
        data: {
          managerId,
          memberId: dto.memberId,
          oldDailyLeadTarget: member.dailyLeadTarget,
          newDailyLeadTarget: dto.dailyLeadTarget,
          oldMonthlyConversionTarget: member.monthlyConversionTarget,
          newMonthlyConversionTarget: dto.monthlyConversionTarget,
          reason: dto.reason || 'Manager target adjustment',
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: dto.memberId },
        data: {
          dailyLeadTarget: dto.dailyLeadTarget,
          monthlyConversionTarget: dto.monthlyConversionTarget,
        },
      });

      return {
        message: 'Team member targets updated successfully',
        memberId: updatedUser.id,
        dailyLeadTarget: updatedUser.dailyLeadTarget,
        monthlyConversionTarget: updatedUser.monthlyConversionTarget,
        history,
      };
    });
  }

  async getEarningsHistory(userId: string) {
    const recruits = await this.prisma.user.findMany({
      where: { referrerId: userId },
      select: { id: true, fullName: true, totalEarnings: true, businesses: { select: { commissionAmount: true, createdAt: true } } },
    });

    const settings = await this.prisma.platformSettings.findFirst();
    const overrideRate = Number(settings?.managerOverrideRate ?? 0.10);
    const now = new Date();
    const monthlyBreakdown = Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
      const businesses = recruits.flatMap((recruit) => recruit.businesses).filter((business) => business.createdAt >= monthDate && business.createdAt < nextMonth);
      const totalEarnings = businesses.reduce((sum, business) => sum + Number(business.commissionAmount || 0), 0);
      return { month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), totalEarnings, overrideEarnings: totalEarnings * overrideRate };
    });

    return {
      totalTeamMembers: recruits.length,
      monthlyBreakdown,
      recruitsSummary: recruits.map(r => ({
        id: r.id,
        fullName: r.fullName,
        earnings: Number(r.totalEarnings),
      })),
    };
  }

  async getTeamReports(userId: string, period: string = 'monthly') {
    const start = new Date();
    if (period === 'daily') start.setHours(0, 0, 0, 0);
    else if (period === 'weekly') start.setDate(start.getDate() - 6);
    else start.setDate(start.getDate() - 29);
    const recruits = await this.prisma.user.findMany({
      where: { referrerId: userId },
      include: {
        leads: { where: { createdAt: { gte: start } }, select: { id: true } },
        businesses: { where: { createdAt: { gte: start } }, select: { commissionAmount: true } },
      },
    });

    const totalLeads = recruits.reduce((sum, r) => sum + r.leads.length, 0);
    const totalConversions = recruits.reduce((sum, r) => sum + r.businesses.length, 0);
    const totalRevenueGenerated = recruits.reduce((sum, r) => sum + r.businesses.reduce((inner, business) => inner + Number(business.commissionAmount || 0), 0), 0);

    return {
      period,
      teamSize: recruits.length,
      metrics: {
        totalLeads,
        totalConversions,
        averageCompletionRate: totalLeads > 0 ? Math.round((totalConversions / totalLeads) * 100) : 0,
        totalRevenueGenerated,
      },
      agentPerformance: recruits.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        leads: r.leads.length,
        conversions: r.businesses.length,
        conversionRate: r.leads.length > 0 ? Math.round((r.businesses.length / r.leads.length) * 100) : 0,
      })),
    };
  }
}
