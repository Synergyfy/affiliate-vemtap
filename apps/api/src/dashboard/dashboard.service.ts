import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
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
      totalRevenue: totalRevenue._sum.subscriptionAmount || 0,
      commissionsPaid: commissionsPaid._sum.amount || 0,
      pendingPayouts: pendingPayouts._sum.amount || 0,
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
}
