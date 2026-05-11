import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BonusType } from './dto/network-response.dto';

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
        managerQualificationExpiry: true,
        isManagerMode: true,
        hasClaimedAgentBonus: true,
        hasClaimedBusinessBonus: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // 1. Count active agents (direct recruits who have closed at least 1 business)
    const activeAgentsCount = await this.prisma.user.count({
      where: {
        referrerId: userId,
        businesses: { some: {} },
      },
    });

    // 1b. Total recruits (anyone referred, regardless of activity)
    const totalRecruitsCount = await this.prisma.user.count({
      where: { referrerId: userId },
    });

    // 2. Total businesses closed in the network (direct + indirect)
    const totalNetworkBusinesses = await this.prisma.business.count({
      where: {
        OR: [
          { affiliateId: userId }, // Direct businesses closed by user
          { affiliate: { referrerId: userId } } // Indirect businesses closed by recruits
        ]
      },
    });

    // 3. Milestone targets from SUMMARY
    const TARGET_AGENTS = 30;
    const TARGET_BUSINESSES = 100;

    return {
      activeAgentsCount,
      totalRecruitsCount,
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
      managerQualificationExpiry: user.managerQualificationExpiry,
      isManagerMode: user.isManagerMode,
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
    
    // Check qualification
    if (!stats.milestones.agents.isReached || !stats.milestones.businesses.isReached) {
      throw new BadRequestException('You must reach both milestones (30 agents & 100 businesses) to enable Manager Mode');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isManagerMode: !user.isManagerMode,
        // Set expiry to 90 days from now if enabling for the first time
        managerQualificationExpiry: !user.isManagerMode && !user.managerQualificationExpiry 
          ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) 
          : user.managerQualificationExpiry,
      },
    });

    return { isManagerMode: updatedUser.isManagerMode, expiry: updatedUser.managerQualificationExpiry };
  }
}
