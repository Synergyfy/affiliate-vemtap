import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
            business: {
              findMany: jest.fn(),
              count: jest.fn(),
              aggregate: jest.fn(),
            },
            commission: {
              groupBy: jest.fn(),
              aggregate: jest.fn(),
            },
            withdrawal: {
              aggregate: jest.fn(),
            },
            fraudAlert: {
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGlobalLeaderboard', () => {
    it('should return all-time leaderboard using user totalEarnings when timeframe is all', async () => {
      const mockUsers = [
        { id: '1', fullName: 'User 1', totalEarnings: 1000, referralCount: 5 },
        { id: '2', fullName: 'User 2', totalEarnings: 500, referralCount: 2 },
      ];
      
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(mockUsers as any);

      const result = await service.getGlobalLeaderboard(10, 'all');

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: 'AFFILIATE', status: 'ACTIVE' },
        orderBy: { totalEarnings: 'desc' },
        take: 10,
        select: { id: true, fullName: true, totalEarnings: true, referralCount: true },
      });

      expect(result).toEqual([
        { rank: 1, fullName: 'User 1', totalEarnings: 1000, referralCount: 5, trend: 'stable' },
        { rank: 2, fullName: 'User 2', totalEarnings: 500, referralCount: 2, trend: 'stable' },
      ]);
    });

    it('should calculate time-based leaderboard and trends', async () => {
      // Mock grouped commissions for current week
      const mockEarnings = [
        { userId: '1', _sum: { amount: 500 } },
      ];
      
      // Mock grouped commissions for previous week
      const mockPrevEarnings = [
        { userId: '2', _sum: { amount: 300 } },
        { userId: '1', _sum: { amount: 200 } },
      ];

      const mockUsers = [
        { id: '1', fullName: 'User 1', referralCount: 5 },
      ];

      jest.spyOn(prisma.commission, 'groupBy')
        .mockResolvedValueOnce(mockEarnings as any) // First call: current period
        .mockResolvedValueOnce(mockPrevEarnings as any); // Second call: previous period

      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(mockUsers as any);

      const result = await service.getGlobalLeaderboard(10, 'week');

      expect(prisma.commission.groupBy).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        { rank: 1, fullName: 'User 1', totalEarnings: 500, referralCount: 5, trend: 'up' }, // Improved rank from 2 -> 1
      ]);
    });
  });

  describe('getDashboardCharts', () => {
    it('should aggregate revenue and signups over the last 30 days', async () => {
      const now = new Date();
      const mockBusinesses = [
        { createdAt: now, subscriptionAmount: 100 },
        { createdAt: now, subscriptionAmount: 200 },
      ];
      const mockUsers = [
        { createdAt: now },
      ];

      jest.spyOn(prisma.business, 'findMany').mockResolvedValue(mockBusinesses as any);
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(mockUsers as any);

      const result = await service.getDashboardCharts();

      expect(result.revenueGrowth).toBeDefined();
      expect(result.affiliateSignups).toBeDefined();
      expect(prisma.business.findMany).toHaveBeenCalled();
      expect(prisma.user.findMany).toHaveBeenCalled();
    });
  });

  describe('getAdminStats', () => {
    it('should return admin stats including commissions trend percentage', async () => {
      jest.spyOn(prisma.user, 'count').mockResolvedValue(10);
      jest.spyOn(prisma.business, 'aggregate').mockResolvedValue({ _sum: { subscriptionAmount: 1000 } } as any);
      jest.spyOn(prisma.withdrawal, 'aggregate').mockResolvedValue({ _sum: { amount: 200 } } as any);
      jest.spyOn(prisma.fraudAlert, 'count').mockResolvedValue(1);

      // Mock commissions: totalPaid, currentMonth, previousMonth
      jest.spyOn(prisma.commission, 'aggregate')
        .mockResolvedValueOnce({ _sum: { amount: 5000 } } as any) // total paid
        .mockResolvedValueOnce({ _sum: { amount: 1500 } } as any) // current month
        .mockResolvedValueOnce({ _sum: { amount: 1000 } } as any); // previous month

      const result = await service.getAdminStats();

      expect(result.commissionsTrendPercentage).toBe(50);
      expect(result.totalAffiliates).toBe(10);
    });

    it('should handle zero previous commissions for trend percentage', async () => {
      jest.spyOn(prisma.user, 'count').mockResolvedValue(10);
      jest.spyOn(prisma.business, 'aggregate').mockResolvedValue({ _sum: { subscriptionAmount: 1000 } } as any);
      jest.spyOn(prisma.withdrawal, 'aggregate').mockResolvedValue({ _sum: { amount: 200 } } as any);
      jest.spyOn(prisma.fraudAlert, 'count').mockResolvedValue(1);

      jest.spyOn(prisma.commission, 'aggregate')
        .mockResolvedValueOnce({ _sum: { amount: 500 } } as any) // total paid
        .mockResolvedValueOnce({ _sum: { amount: 500 } } as any) // current month
        .mockResolvedValueOnce({ _sum: { amount: 0 } } as any); // previous month

      const result = await service.getAdminStats();

      expect(result.commissionsTrendPercentage).toBe(100);
    });
  });

  describe('getManagerPerformance', () => {
    it('should return manager performance including networkSize', async () => {
      const recruits = [
        { id: 'recruit1', referralCount: 1 },
        { id: 'recruit2', referralCount: 0 },
      ];

      jest.spyOn(prisma.user, 'findMany')
        .mockResolvedValueOnce(recruits as any) // First call: recruits within 90 days
        .mockResolvedValueOnce([{ id: 'recruit1' }, { id: 'recruit2' }] as any); // Second call: directReferralIds (all time)

      jest.spyOn(prisma.business, 'count').mockResolvedValue(50);
      jest.spyOn(prisma.user, 'count').mockResolvedValue(120); // networkSize

      const result = await service.getManagerPerformance('managerId');

      expect(result.networkSize).toBe(120);
      expect(result.activeAgentsCount).toBe(1);
    });
  });
});
