import { Inject, Injectable, Logger } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { ConfigService } from "@nestjs/config";
import { Cache } from "cache-manager";
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
    ]);

    const currentVal = Number(currentCommissions._sum.amount || 0);
    const previousVal = Number(previousCommissions._sum.amount || 0);
    const trend =
      previousVal === 0
        ? currentVal > 0
          ? 100
          : 0
        : Math.round(((currentVal - previousVal) / previousVal) * 100);

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
      commissionsTrendPercentage: trend,
    };

    await this.cacheManager.set(cacheKey, stats, 300 * 1000); // 5 minutes in ms
    return stats;
  }

  async getManagerPerformance(
    managerId: string,
  ): Promise<ManagerPerformanceResponseDto> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [recruits, networkBusinesses] = await Promise.all([
      this.prisma.user.findMany({
        where: { referrerId: managerId, createdAt: { gte: ninetyDaysAgo } },
      }),
      this.prisma.business.count({
        where: {
          affiliate: { referrerId: managerId },
          createdAt: { gte: ninetyDaysAgo },
        },
      }),
    ]);

    const activeAgents = recruits.filter((r) => r.referralCount > 0);

    // Network Size: Sum of referrals' referrals (all time)
    const directReferralIds = await this.prisma.user
      .findMany({
        where: { referrerId: managerId },
        select: { id: true },
      })
      .then((users) => users.map((u) => u.id));

    const networkSize = await this.prisma.user.count({
      where: { referrerId: { in: directReferralIds } },
    });

    return {
      activeAgentsCount: activeAgents.length,
      newNetworkBusinessesCount: networkBusinesses,
      networkSize,
      isQualified: activeAgents.length >= 30 && networkBusinesses >= 100,
      targetAgents: 30,
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
    const [user, activeReferrals, totalClicks] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          totalEarnings: true,
          pendingEarnings: true,
          referralCount: true,
        },
      }),
      this.prisma.business.count({
        where: { affiliateId: userId, status: "ACTIVE" },
      }),
      this.prisma.linkClick.count({
        where: { userId },
      }),
    ]);

    return {
      totalEarnings: Number(user?.totalEarnings || 0),
      pendingEarnings: Number(user?.pendingEarnings || 0),
      activeReferrals,
      referralCount: user?.referralCount || 0,
      totalClicks,
      referralSignupUrl: this.configService.get<string>('VEMTAP_SIGNUP_URL') || 'https://vemtap.com/signup',
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
          status: { in: ["APPROVED", "PAID"] },
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
          status: { in: ["APPROVED", "PAID"] },
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
