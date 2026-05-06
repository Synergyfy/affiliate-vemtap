import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getAdminStats() {
    const cacheKey = 'admin_stats';
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) return cachedData;
    const [
      totalAffiliates,
      activeAffiliates,
      totalRevenue,
      commissionsPaid,
      pendingPayouts,
      fraudAlerts,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'AFFILIATE' } }),
      this.prisma.user.count({ where: { role: 'AFFILIATE', status: 'ACTIVE' } }),
      this.prisma.business.aggregate({
        where: { status: 'ACTIVE' },
        _sum: { subscriptionAmount: true },
      }),
      this.prisma.commission.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
      this.prisma.withdrawal.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      this.prisma.fraudAlert.count({ where: { status: 'OPEN' } }),
    ]);

    const stats = {
      totalAffiliates,
      activeAffiliates,
      totalRevenue: Number(totalRevenue._sum.subscriptionAmount || 0),
      commissionsPaid: Number(commissionsPaid._sum.amount || 0),
      pendingPayouts: Number(pendingPayouts._sum.amount || 0),
      fraudAlerts,
    };

    await this.cacheManager.set(cacheKey, stats, 300 * 1000); // 5 minutes in ms
    return stats;
  }

  async getManagerPerformance(managerId: string) {
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

    const activeAgents = recruits.filter(r => r.referralCount > 0);

    return {
      activeAgentsCount: activeAgents.length,
      totalBusinessesCount: networkBusinesses,
      isQualified: activeAgents.length >= 30 && networkBusinesses >= 100,
      targetAgents: 30,
      targetBusinesses: 100,
    };
  }


  async getDashboardCharts() {
    // This could be more complex, e.g., monthly growth
    // For now returning empty or placeholder structure
    return {
      revenueGrowth: [],
      affiliateSignups: [],
    };
  }

  async getAffiliateStats(userId: string) {
    const [user, activeReferrals] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          totalEarnings: true,
          pendingEarnings: true,
          referralCount: true,
        },
      }),
      this.prisma.business.count({
        where: { affiliateId: userId, status: 'ACTIVE' },
      }),
    ]);

    return {
      totalEarnings: Number(user?.totalEarnings || 0),
      pendingEarnings: Number(user?.pendingEarnings || 0),
      activeReferrals,
      referralCount: user?.referralCount || 0,
    };
  }

  async getAffiliateForecast(userId: string) {
    const aggregate = await this.prisma.business.aggregate({
      where: { affiliateId: userId, status: 'ACTIVE' },
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

    const [commissions, referrals] = await Promise.all([
      this.prisma.commission.findMany({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true, amount: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.business.findMany({
        where: {
          affiliateId: userId,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      earningsHistory: this.groupDataByDate(commissions, 'amount'),
      referralTrends: this.groupDataByDate(referrals),
    };
  }

  async getGlobalLeaderboard(limit: number = 10) {
    const topAffiliates = await this.prisma.user.findMany({
      where: { role: 'AFFILIATE', status: 'ACTIVE' },
      orderBy: { totalEarnings: 'desc' },
      take: limit,
      select: {
        fullName: true,
        totalEarnings: true,
        referralCount: true,
      },
    });

    return topAffiliates.map((a, index) => ({
      rank: index + 1,
      fullName: a.fullName,
      totalEarnings: Number(a.totalEarnings),
      referralCount: a.referralCount,
    }));
  }

  private groupDataByDate(data: any[], valueField?: string) {
    const grouped = data.reduce((acc, item) => {
      const date = item.createdAt.toISOString().split('T')[0];
      const value = valueField ? Number(item[valueField]) : 1;
      acc[date] = (acc[date] || 0) + value;
      return acc;
    }, {});

    const result = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      result.push({
        date: dateString,
        value: grouped[dateString] || 0,
      });
    }

    return result;
  }
}
