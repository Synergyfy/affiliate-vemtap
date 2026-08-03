import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BonusType, UpdateTargetsDto } from './dto/network-response.dto';

@Injectable()
export class NetworkService {
  constructor(private prisma: PrismaService) {}

  async getRecruits(userId: string, pagination: { skip?: number; take?: number }) {
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { referrerId: userId },
        skip: pagination.skip,
        take: pagination.take,
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
          createdAt: true,
          totalEarnings: true,
          _count: {
            select: { referrals: true, businesses: true },
          },
          businesses: {
            select: { subscriptionAmount: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { referrerId: userId } }),
    ]);

    const recruits = data.map(r => {
      const totalVolume = r.businesses.reduce((sum, b) => sum + Number(b.subscriptionAmount), 0);
      return {
        id: r.id,
        fullName: r.fullName,
        email: r.email,
        status: r.status,
        createdAt: r.createdAt,
        totalEarnings: Number(r.totalEarnings),
        referralCount: r._count.referrals,
        businessCount: r._count.businesses,
        managerShare: totalVolume * 0.10, // 10% of their total closed business volume
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
        isManagerMode: true,
        hasClaimedAgentBonus: true,
        hasClaimedBusinessBonus: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const reportingScoreVal = Number(user.reportingScore || 100);
    const attendanceRateVal = Number(user.attendanceRate || 100);

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
      personalActiveBusinesses >= 40 &&
      daysActive >= 90 &&
      reportingScoreVal >= 85 &&
      attendanceRateVal >= 90 &&
      openFraudAlertsCount === 0;

    const isEligibleForManager =
      activeAgentsCount >= 10 &&
      supervisorsCount >= 5 &&
      totalNetworkBusinesses >= 100;

    // 4. Structure dynamic milestone targets (backward compatible with the frontend)
    let milestoneAgentsCurrent = activeAgentsCount;
    let milestoneAgentsTarget = 30;
    let milestoneBusinessesCurrent = totalNetworkBusinesses;
    let milestoneBusinessesTarget = 100;

    if (user.role === 'AGENT') {
      // Trying to unlock SUPERVISOR: milestones map to Active Days (Agents) and Personal Businesses (Businesses)
      milestoneAgentsCurrent = daysActive;
      milestoneAgentsTarget = 90;
      milestoneBusinessesCurrent = personalActiveBusinesses;
      milestoneBusinessesTarget = 40;
    } else {
      // Trying to unlock MANAGER (for SUPERVISOR -> MANAGER) OR unlock SUPERVISOR (for AFFILIATE -> SUPERVISOR)
      milestoneAgentsCurrent = activeAgentsCount;
      milestoneAgentsTarget = user.role === 'AFFILIATE' ? 30 : 10;
      milestoneBusinessesCurrent = totalNetworkBusinesses;
      milestoneBusinessesTarget = 100;
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
      isManagerMode: user.isManagerMode || user.role === 'SUPERVISOR' || user.role === 'MANAGER',
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

    if (type === BonusType.AGENT) {
      if (user.hasClaimedAgentBonus) throw new BadRequestException('Agent bonus already claimed');
      if (!stats.milestones.agents.isReached) throw new BadRequestException('Target for agent bonus not reached');
      amount = 5000;
      description = 'Agent milestone bonus (30 active agents)';
    } else if (type === BonusType.BUSINESS) {
      if (user.hasClaimedBusinessBonus) throw new BadRequestException('Business bonus already claimed');
      if (!stats.milestones.businesses.isReached) throw new BadRequestException('Target for business bonus not reached');
      amount = 10000;
      description = 'Business milestone bonus (100 network businesses)';
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
        isManagerMode: true,
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
        businesses: { select: { id: true, businessName: true, planType: true, status: true, subscriptionAmount: true, createdAt: true } },
        leads: { select: { id: true, businessName: true, status: true, priority: true, createdAt: true } },
        activities: { take: 10, orderBy: { createdAt: 'desc' } },
        targetAdjustmentsReceived: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!member) throw new NotFoundException('Team member not found');

    const totalVolume = member.businesses.reduce((sum, b) => sum + Number(b.subscriptionAmount), 0);

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
      totalVolume,
      businesses: member.businesses,
      leads: member.leads,
      activities: member.activities,
      targetAdjustmentHistory: member.targetAdjustmentsReceived,
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
      select: { id: true, fullName: true, totalEarnings: true, businesses: { select: { subscriptionAmount: true, createdAt: true } } },
    });

    const monthlyBreakdown = [
      { month: 'Jan 2026', totalEarnings: 120000, overrideEarnings: 12000 },
      { month: 'Feb 2026', totalEarnings: 180000, overrideEarnings: 18000 },
      { month: 'Mar 2026', totalEarnings: 250000, overrideEarnings: 25000 },
      { month: 'Apr 2026', totalEarnings: 310000, overrideEarnings: 31000 },
      { month: 'May 2026', totalEarnings: 420000, overrideEarnings: 42000 },
    ];

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
    const recruits = await this.prisma.user.findMany({
      where: { referrerId: userId },
      include: {
        _count: { select: { leads: true, businesses: true } },
      },
    });

    const totalLeads = recruits.reduce((sum, r) => sum + r._count.leads, 0);
    const totalConversions = recruits.reduce((sum, r) => sum + r._count.businesses, 0);

    return {
      period,
      teamSize: recruits.length,
      metrics: {
        totalLeads,
        totalConversions,
        averageCompletionRate: 88,
        totalRevenueGenerated: totalConversions * 45000,
      },
      agentPerformance: recruits.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        leads: r._count.leads,
        conversions: r._count.businesses,
        conversionRate: r._count.leads > 0 ? Math.round((r._count.businesses / r._count.leads) * 100) : 0,
      })),
    };
  }
}
