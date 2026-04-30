import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NetworkService {
  constructor(private prisma: PrismaService) {}

  async getRecruits(userId: string) {
    const recruits = await this.prisma.user.findMany({
      where: { referrerId: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { businesses: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return recruits.map(r => ({
      id: r.id,
      fullName: r.fullName,
      email: r.email,
      role: r.role,
      dateJoined: r.createdAt,
      businessesCount: r._count.businesses,
    }));
  }

  async getStats(userId: string) {
    // 1. Count active agents (direct recruits who have closed at least 1 business)
    const activeAgentsCount = await this.prisma.user.count({
      where: {
        referrerId: userId,
        businesses: { some: {} },
      },
    });

    // 2. Total businesses closed by direct recruits
    const totalNetworkBusinesses = await this.prisma.business.count({
      where: {
        affiliate: {
          referrerId: userId,
        },
      },
    });

    // 3. Milestone targets from SUMMARY
    const TARGET_AGENTS = 30;
    const TARGET_BUSINESSES = 100;

    return {
      activeAgentsCount,
      totalNetworkBusinesses,
      milestones: {
        agents: {
          current: activeAgentsCount,
          target: TARGET_AGENTS,
          isReached: activeAgentsCount >= TARGET_AGENTS,
        },
        businesses: {
          current: totalNetworkBusinesses,
          target: TARGET_BUSINESSES,
          isReached: totalNetworkBusinesses >= TARGET_BUSINESSES,
        },
      },
    };
  }
}
