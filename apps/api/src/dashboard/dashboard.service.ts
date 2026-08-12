import { Inject, Injectable, Logger } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { ConfigService } from "@nestjs/config";
import { Cache } from "cache-manager";
import { SalesPipelineStage } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  AdminStatsResponseDto,
  DashboardChartsResponseDto,
  ManagerPerformanceResponseDto,
} from "./dto/dashboard-response.dto";

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getAdminStats(): Promise<AdminStatsResponseDto> {
    const cacheKey = "admin_stats";
    const cachedData =
      await this.cacheManager.get<AdminStatsResponseDto>(cacheKey);
    if (cachedData) return cachedData;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [
      totalAffiliates,
      activeAffiliates,
      totalRevenue,
      commissionsPaid,
      pendingPayouts,
      approvedPayouts,
      processingPayouts,
      completedPayouts,
      fraudAlerts,
      currentCommissions,
      previousCommissions,
      currentMonthRevenue,
      previousMonthRevenue,
      currentMonthAffiliates,
      previousMonthAffiliates,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: "AFFILIATE" } }),
      this.prisma.user.count({
        where: { role: "AFFILIATE", status: "ACTIVE" },
      }),
      this.prisma.business.aggregate({
        where: { status: "ACTIVE" },
        _sum: { subscriptionAmount: true },
      }),
      this.prisma.commission.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
      this.prisma.withdrawal.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
      }),
      this.prisma.withdrawal.aggregate({
        where: { status: "APPROVED" },
        _sum: { amount: true },
      }),
      this.prisma.withdrawal.aggregate({
        where: { status: "PROCESSING" },
        _sum: { amount: true },
      }),
      this.prisma.withdrawal.aggregate({
        where: { status: "PAID" },
        _sum: { amount: true },
      }),
      this.prisma.fraudAlert.count({ where: { status: "OPEN" } }),
      this.prisma.commission.aggregate({
        where: { status: "PAID", createdAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
      }),
      this.prisma.commission.aggregate({
        where: {
          status: "PAID",
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
        _sum: { amount: true },
      }),
      this.prisma.business.aggregate({
        where: { status: "ACTIVE", createdAt: { gte: thirtyDaysAgo } },
        _sum: { subscriptionAmount: true },
      }),
      this.prisma.business.aggregate({
        where: {
          status: "ACTIVE",
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
        _sum: { subscriptionAmount: true },
      }),
      this.prisma.user.count({
        where: { role: "AFFILIATE", createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.user.count({
        where: {
          role: "AFFILIATE",
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
    ]);

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const commissionsCurrentVal = Number(currentCommissions._sum.amount || 0);
    const commissionsPreviousVal = Number(previousCommissions._sum.amount || 0);
    const commissionsTrend = calculateGrowth(commissionsCurrentVal, commissionsPreviousVal);

    const revenueCurrentVal = Number(currentMonthRevenue._sum.subscriptionAmount || 0);
    const revenuePreviousVal = Number(previousMonthRevenue._sum.subscriptionAmount || 0);
    const revenueTrend = calculateGrowth(revenueCurrentVal, revenuePreviousVal);

    const affiliatesTrend = calculateGrowth(currentMonthAffiliates, previousMonthAffiliates);

    const stats = {
      totalAffiliates,
      activeAffiliates,
      totalRevenue: Number(totalRevenue._sum.subscriptionAmount || 0),
      commissionsPaid: Number(commissionsPaid._sum.amount || 0),
      pendingPayouts: Number(pendingPayouts._sum.amount || 0),
      approvedPayouts: Number(approvedPayouts._sum.amount || 0),
      completedPayouts:
        Number(processingPayouts._sum.amount || 0) +
        Number(completedPayouts._sum.amount || 0),
      fraudAlerts,
      commissionsTrendPercentage: commissionsTrend,
      totalRevenueGrowth: revenueTrend,
      totalAffiliatesGrowth: affiliatesTrend,
    };

    await this.cacheManager.set(cacheKey, stats, 300 * 1000); // 5 minutes in ms
    return stats;
  }

  async getManagerPerformance(
    managerId: string,
  ): Promise<ManagerPerformanceResponseDto> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [recruits, networkBusinesses, supervisorsCount] = await Promise.all([
      this.prisma.user.findMany({
        where: { referrerId: managerId },
        include: { _count: { select: { businesses: true } } },
      }),
      this.prisma.business.count({
        where: {
          status: 'ACTIVE',
          OR: [
            { affiliateId: managerId },
            { affiliate: { referrerId: managerId } }
          ]
        },
      }),
      this.prisma.user.count({
        where: { referrerId: managerId, role: 'SUPERVISOR' }
      })
    ]);

    const activeAgents = recruits.filter((r) => r.role === 'AGENT' && r._count.businesses > 0);

    // Network Size: Sum of referrals' referrals (all time)
    const directReferralIds = recruits.map((u) => u.id);

    const networkSize = await this.prisma.user.count({
      where: { referrerId: { in: directReferralIds } },
    });

    const isQualified = activeAgents.length >= 10 && supervisorsCount >= 5 && networkBusinesses >= 100;

    return {
      activeAgentsCount: activeAgents.length,
      newNetworkBusinessesCount: networkBusinesses,
      networkSize,
      isQualified,
      targetAgents: 10,
      targetBusinesses: 100,
    };
  }

  async getDashboardCharts(): Promise<DashboardChartsResponseDto> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [businesses, users] = await Promise.all([
      this.prisma.business.findMany({
        where: {
          status: "ACTIVE",
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true, subscriptionAmount: true },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.user.findMany({
        where: {
          role: "AFFILIATE",
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return {
      revenueGrowth: this.groupDataByDate(businesses, "subscriptionAmount"),
      affiliateSignups: this.groupDataByDate(users),
    };
  }

  async getAffiliateStats(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const [
      user,
      activeReferrals,
      totalClicks,
      todayCommissions,
      todayClicks,
      todayLeadsCount,
      monthlyLeadsCount,
      monthlyConversionsCount,
      todaySalesPipelineCount,
      todayMarketMappingCount,
      todayVisitsCount,
      todayFollowUpsDue,
      todayDemosDue,
      todayConversions,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          totalEarnings: true,
          pendingEarnings: true,
          referralCount: true,
          dailyLeadTarget: true,
          monthlyConversionTarget: true,
        },
      }),
      this.prisma.business.count({
        where: { affiliateId: userId, status: "ACTIVE" },
      }),
      this.prisma.linkClick.count({
        where: { userId },
      }),
      this.prisma.commission.aggregate({
        where: {
          userId,
          createdAt: { gte: today },
          status: { in: ['PENDING', 'APPROVED', 'PAID'] }
        },
        _sum: { amount: true }
      }),
      this.prisma.linkClick.count({
        where: { userId, createdAt: { gte: today } },
      }),
      // Leads submitted today by this user
      this.prisma.lead.count({
        where: { affiliateId: userId, createdAt: { gte: today } },
      }),
      // Leads submitted this month by this user
      this.prisma.lead.count({
        where: { affiliateId: userId, createdAt: { gte: startOfMonth } },
      }),
      // Businesses (conversions) created this month linked to this user
      this.prisma.business.count({
        where: { affiliateId: userId, status: 'ACTIVE', createdAt: { gte: startOfMonth } },
      }),
      // SalesPipeline entries created today (businesses added via sales pipeline)
      this.prisma.salesPipeline.count({
        where: { affiliateId: userId, createdAt: { gte: today, lte: todayEnd } },
      }),
      // MarketMappingVisit entries created today (businesses added via field work — includes placeholders)
      this.prisma.marketMappingVisit.count({
        where: { userId, createdAt: { gte: today, lte: todayEnd } },
      }),
      // MarketMappingVisit entries actually visited today (visitedAt is today)
      this.prisma.marketMappingVisit.count({
        where: { userId, visitedAt: { gte: today, lte: todayEnd } },
      }),
      // SalesPipeline entries with a followUpDate of today
      this.prisma.salesPipeline.count({
        where: {
          affiliateId: userId,
          followUpDate: { gte: today, lte: todayEnd },
        },
      }),
      // SalesPipeline entries in DEMO_SCHEDULED stage or with a demoScheduledDate of today
      this.prisma.salesPipeline.count({
        where: {
          affiliateId: userId,
          OR: [
            { pipelineStage: SalesPipelineStage.DEMO_SCHEDULED },
            { demoScheduledDate: { gte: today, lte: todayEnd } },
          ],
        },
      }),
      // SalesPipeline entries that became CUSTOMER today
      this.prisma.salesPipeline.count({
        where: {
          affiliateId: userId,
          pipelineStage: SalesPipelineStage.CUSTOMER,
          updatedAt: { gte: today, lte: todayEnd },
        },
      }),
    ]);

    const referralCount = user?.referralCount || 0;
    let currentLevel = "Novice Affiliate";
    if (referralCount >= 100) currentLevel = "Master Affiliate";
    else if (referralCount >= 50) currentLevel = "Elite Partner";
    else if (referralCount >= 20) currentLevel = "Active Earner";
    else if (referralCount >= 10) currentLevel = "Rising Star";

    return {
      totalEarnings: Number(user?.totalEarnings || 0),
      pendingEarnings: Number(user?.pendingEarnings || 0),
      todayEarnings: Number(todayCommissions._sum.amount || 0),
      todayClicks,
      currentLevel,
      activeReferrals,
      referralCount,
      totalClicks,
      referralSignupUrl: this.configService.get<string>('VEMTAP_SIGNUP_URL') || 'https://vemtap.com/signup',
      // Agent target metrics
      dailyLeadTarget: user?.dailyLeadTarget || 0,
      monthlyConversionTarget: user?.monthlyConversionTarget || 0,
      todayLeadsCount,
      monthlyLeadsCount,
      monthlyConversionsCount,
      // Today's sales work stats — used by the sales-work page
      todaySalesPipelineCount,
      todayMarketMappingCount,
      todayBusinessesAdded: todaySalesPipelineCount + todayMarketMappingCount,
      todayVisitsCount,
      todayFollowUpsDue,
      todayDemosDue,
      todayConversions,
    };
  }

  async getAffiliateForecast(userId: string) {
    const aggregate = await this.prisma.business.aggregate({
      where: { affiliateId: userId, status: "ACTIVE" },
      _sum: { commissionAmount: true },
      _count: true,
    });

    const mrr = Number(aggregate._sum.commissionAmount || 0);

    return {
      monthlyRecurringRevenue: mrr,
      activeBusinessCount: aggregate._count,
      projectedEarnings: mrr, // Simple MRR projection
    };
  }

  async getAffiliateCharts(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [commissions, referrals, clicks] = await Promise.all([
      this.prisma.commission.findMany({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true, amount: true },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.business.findMany({
        where: {
          affiliateId: userId,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.linkClick.findMany({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    return {
      earningsHistory: this.groupDataByDate(commissions, "amount"),
      referralTrends: this.groupDataByDate(referrals),
      clickTrends: this.groupDataByDate(clicks),
    };
  }

  async getGlobalLeaderboard(limit: number = 10, timeframe: string = "all") {
    const now = new Date();
    let startDate: Date | null = null;
    let prevStartDate: Date | null = null;
    let prevEndDate: Date | null = null;

    if (timeframe === "week") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - 7);
      prevEndDate = startDate;
    } else if (timeframe === "month") {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      prevStartDate = new Date(startDate);
      prevStartDate.setMonth(prevStartDate.getMonth() - 1);
      prevEndDate = startDate;
    }

    type LeaderboardEntry = {
      id: string;
      fullName: string;
      totalEarnings: number;
      referralCount: number;
    };
    let rankings: LeaderboardEntry[] = [];
    if (!startDate) {
      // All time - use totalEarnings field for efficiency
      const users = await this.prisma.user.findMany({
        where: { role: "AFFILIATE", status: "ACTIVE" },
        orderBy: { totalEarnings: "desc" },
        take: limit,
        select: {
          id: true,
          fullName: true,
          totalEarnings: true,
          referralCount: true,
        },
      });
      rankings = users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        totalEarnings: Number(u.totalEarnings),
        referralCount: u.referralCount,
      }));
    } else {
      // Time-filtered - aggregate commissions
      const earnings = await this.prisma.commission.groupBy({
        by: ["userId"],
        where: {
          createdAt: { gte: startDate },
          status: { in: ["PENDING", "APPROVED", "PAID"] },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: limit,
      });

      // Fetch user details for these earnings
      const userIds = earnings.map((e) => e.userId);
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, fullName: true, referralCount: true },
      });

      rankings = earnings.map((e) => {
        const user = users.find((u) => u.id === e.userId);
        return {
          id: e.userId,
          fullName: user?.fullName || "Unknown",
          totalEarnings: Number(e._sum.amount || 0),
          referralCount: user?.referralCount || 0,
        };
      });
    }

    // Calculate Trend (compare with previous period if applicable)
    // For simplicity, we compare rank in current list vs rank in previous list
    let prevRankings: string[] = [];
    if (startDate && prevStartDate && prevEndDate) {
      const prevEarnings = await this.prisma.commission.groupBy({
        by: ["userId"],
        where: {
          createdAt: { gte: prevStartDate, lt: prevEndDate },
          status: { in: ["PENDING", "APPROVED", "PAID"] },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: limit * 2, // Take more to find previous ranks of current top users
      });
      prevRankings = prevEarnings.map((e) => e.userId);
    }

    return rankings.map((a, index) => {
      let trend = "stable";
      if (prevRankings.length > 0) {
        const prevIndex = prevRankings.indexOf(a.id);
        if (prevIndex === -1) {
          trend = "up"; // New entry in top list
        } else if (prevIndex > index) {
          trend = "up"; // Rank improved (lower index is better)
        } else if (prevIndex < index) {
          trend = "down"; // Rank dropped
        }
      }

      return {
        rank: index + 1,
        fullName: a.fullName,
        totalEarnings: Number(a.totalEarnings),
        referralCount: a.referralCount,
        trend,
      };
    });
  }

  async getAffiliateActions(userId: string) {
    const [pendingBusinesses, user, inactiveReferrals] = await Promise.all([
      this.prisma.business.count({
        where: { affiliateId: userId, status: "TRIAL" },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { referralCount: true, role: true },
      }),
      this.prisma.user.count({
        where: { 
          referrerId: userId, 
          status: "ACTIVE",
          businesses: { none: {} } // Users who haven't referred any business yet
        },
      }),
    ]);

    const actions = [];
    const referralCount = user?.referralCount || 0;

    // 1. Recruit Action
    if (referralCount < 5) {
      actions.push({
        title: "Recruit Affiliates",
        desc: "Share your link to reach your first 5 referrals",
        icon: "UserPlus",
        color: "text-blue-600",
        bg: "bg-blue-50",
        link: "/dashboard/tools",
      });
    } else {
      actions.push({
        title: "Grow Network",
        desc: "Find 5 new potential affiliates this week",
        icon: "TrendingUp",
        color: "text-blue-600",
        bg: "bg-blue-50",
        link: "/dashboard/tools",
      });
    }

    // 2. Follow-up Action
    if (pendingBusinesses > 0) {
      actions.push({
        title: "Follow up Businesses",
        desc: `Check in on ${pendingBusinesses} pending deals`,
        icon: "Briefcase",
        color: "text-orange-600",
        bg: "bg-orange-50",
        link: "/dashboard/businesses",
      });
    } else {
      actions.push({
        title: "Pitch New Business",
        desc: "Reach out to a new business today",
        icon: "Briefcase",
        color: "text-orange-600",
        bg: "bg-orange-50",
        link: "/dashboard/tools",
      });
    }

    // 3. Activation Action
    if (user?.role === "SUPERVISOR" || user?.role === "MANAGER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
      if (inactiveReferrals > 0) {
        actions.push({
          title: "Activate Affiliates",
          desc: `Nudge ${inactiveReferrals} inactive team members`,
          icon: "Zap",
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          link: "/dashboard/network",
        });
      } else {
        actions.push({
          title: "Team Mentoring",
          desc: "Host a quick sync with your top earners",
          icon: "Users",
          color: "text-emerald-600",
          bg: "bg-emerald-50",
          link: "/dashboard/network",
        });
      }
    } else {
      actions.push({
        title: "Sales Academy",
        desc: "Watch a new training module",
        icon: "BookOpen",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        link: "/dashboard/training",
      });
    }

    return actions;
  }

  async getAffiliateAlerts(userId: string) {
    const [user, stats] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { referralCount: true },
      }),
      this.getAffiliateStats(userId),
    ]);

    const alerts = [];

    // 1. Milestone proximity alert
    const target = 20;
    if (user && user.referralCount < target && target - user.referralCount <= 5) {
      alerts.push({
        title: "Milestone Alert",
        desc: `You are only ${target - user.referralCount} businesses away from "Active Earner"!`,
        type: "info",
        icon: "Target",
        color: "text-blue-600",
        bg: "bg-blue-50",
      });
    }

    // 2. Earnings alert
    if (stats.pendingEarnings > 0) {
      alerts.push({
        title: "Earnings Available",
        desc: `You have ₦${(stats.pendingEarnings / 100).toLocaleString()} pending in your wallet.`,
        type: "success",
        icon: "Wallet",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
      });
    }

    // 3. Inactivity reminder (if no clicks in 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const recentClicks = await this.prisma.linkClick.count({
      where: { userId, createdAt: { gte: threeDaysAgo } },
    });

    if (recentClicks === 0) {
      alerts.push({
        title: "Link Inactivity",
        desc: "Your affiliate links haven't received clicks in 3 days.",
        type: "warning",
        icon: "AlertTriangle",
        color: "text-orange-600",
        bg: "bg-orange-50",
      });
    }

    return alerts;
  }


  private groupDataByDate(
    data: Array<Record<string, any>>,
    valueField?: string,
  ) {
    const grouped = data.reduce((acc, item) => {
      const date = item.createdAt.toISOString().split("T")[0];
      const value = valueField ? Number(item[valueField]) : 1;
      acc[date] = (acc[date] || 0) + value;
      return acc;
    }, {});

    const result = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];
      result.push({
        date: dateString,
        value: grouped[dateString] || 0,
      });
    }

    return result;
  }
}
