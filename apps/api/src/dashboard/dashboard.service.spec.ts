import { Test, TestingModule } from "@nestjs/testing";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { ConfigService } from "@nestjs/config";
import { DashboardService } from "./dashboard.service";
import { PrismaService } from "../prisma/prisma.service";

describe("DashboardService", () => {
  let service: DashboardService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
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
              findUnique: jest.fn(),
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
            linkClick: {
              count: jest.fn(),
            },
            lead: {
              count: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getGlobalLeaderboard", () => {
    it("should return all-time leaderboard using user totalEarnings when timeframe is all", async () => {
      const mockUsers = [
        { id: "1", fullName: "User 1", totalEarnings: 1000, referralCount: 5 },
        { id: "2", fullName: "User 2", totalEarnings: 500, referralCount: 2 },
      ];

      jest.spyOn(prisma.user, "findMany").mockResolvedValue(mockUsers as any);

      const result = await service.getGlobalLeaderboard(10, "all");

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { role: "AFFILIATE", status: "ACTIVE" },
        orderBy: { totalEarnings: "desc" },
        take: 10,
        select: {
          id: true,
          fullName: true,
          totalEarnings: true,
          referralCount: true,
        },
      });

      expect(result).toEqual([
        {
          rank: 1,
          fullName: "User 1",
          totalEarnings: 1000,
          referralCount: 5,
          trend: "stable",
        },
        {
          rank: 2,
          fullName: "User 2",
          totalEarnings: 500,
          referralCount: 2,
          trend: "stable",
        },
      ]);
    });

    it("should calculate time-based leaderboard and trends", async () => {
      // Mock grouped commissions for current week
      const mockEarnings = [{ userId: "1", _sum: { amount: 500 } }];

      // Mock grouped commissions for previous week
      const mockPrevEarnings = [
        { userId: "2", _sum: { amount: 300 } },
        { userId: "1", _sum: { amount: 200 } },
      ];

      const mockUsers = [{ id: "1", fullName: "User 1", referralCount: 5 }];

      jest
        .spyOn(prisma.commission, "groupBy")
        .mockResolvedValueOnce(mockEarnings as any) // First call: current period
        .mockResolvedValueOnce(mockPrevEarnings as any); // Second call: previous period

      jest.spyOn(prisma.user, "findMany").mockResolvedValue(mockUsers as any);

      const result = await service.getGlobalLeaderboard(10, "week");

      expect(prisma.commission.groupBy).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        {
          rank: 1,
          fullName: "User 1",
          totalEarnings: 500,
          referralCount: 5,
          trend: "up",
        }, // Improved rank from 2 -> 1
      ]);
    });
  });

  describe("getDashboardCharts", () => {
    it("should aggregate revenue and signups over the last 30 days", async () => {
      const now = new Date();
      const mockBusinesses = [
        { createdAt: now, subscriptionAmount: 100 },
        { createdAt: now, subscriptionAmount: 200 },
      ];
      const mockUsers = [{ createdAt: now }];

      jest
        .spyOn(prisma.business, "findMany")
        .mockResolvedValue(mockBusinesses as any);
      jest.spyOn(prisma.user, "findMany").mockResolvedValue(mockUsers as any);

      const result = await service.getDashboardCharts();

      expect(result.revenueGrowth).toBeDefined();
      expect(result.affiliateSignups).toBeDefined();
      expect(prisma.business.findMany).toHaveBeenCalled();
      expect(prisma.user.findMany).toHaveBeenCalled();
    });
  });

  describe("getAdminStats", () => {
    it("should return admin stats including commissions trend percentage", async () => {
      jest.spyOn(prisma.user, "count").mockResolvedValue(10);
      jest
        .spyOn(prisma.business, "aggregate")
        .mockResolvedValue({ _sum: { subscriptionAmount: 1000 } } as any);
      jest.spyOn(prisma.fraudAlert, "count").mockResolvedValue(1);

      // Mock withdrawal aggregates: pending, approved, processing, paid
      jest
        .spyOn(prisma.withdrawal, "aggregate")
        .mockResolvedValueOnce({ _sum: { amount: 200 } } as any) // PENDING
        .mockResolvedValueOnce({ _sum: { amount: 300 } } as any) // APPROVED
        .mockResolvedValueOnce({ _sum: { amount: 100 } } as any) // PROCESSING
        .mockResolvedValueOnce({ _sum: { amount: 400 } } as any); // PAID

      // Mock commissions: totalPaid, currentMonth, previousMonth
      jest
        .spyOn(prisma.commission, "aggregate")
        .mockResolvedValueOnce({ _sum: { amount: 5000 } } as any) // total paid
        .mockResolvedValueOnce({ _sum: { amount: 1500 } } as any) // current month
        .mockResolvedValueOnce({ _sum: { amount: 1000 } } as any); // previous month

      // Mock business aggregate: totalRevenue, currentMonthRevenue, previousMonthRevenue
      jest
        .spyOn(prisma.business, "aggregate")
        .mockResolvedValueOnce({ _sum: { subscriptionAmount: 5000 } } as any) // totalRevenue
        .mockResolvedValueOnce({ _sum: { subscriptionAmount: 2000 } } as any) // currentMonthRevenue
        .mockResolvedValueOnce({ _sum: { subscriptionAmount: 1000 } } as any); // previousMonthRevenue

      // Mock user count: totalAffiliates, activeAffiliates, currentMonthAffiliates, previousMonthAffiliates
      jest
        .spyOn(prisma.user, "count")
        .mockResolvedValueOnce(50) // totalAffiliates
        .mockResolvedValueOnce(40) // activeAffiliates
        .mockResolvedValueOnce(10) // currentMonthAffiliates
        .mockResolvedValueOnce(5); // previousMonthAffiliates

      const result = await service.getAdminStats();

      expect(result.commissionsTrendPercentage).toBe(50);
      expect(result.totalRevenueGrowth).toBe(100);
      expect(result.totalAffiliatesGrowth).toBe(100);
      expect(result.totalAffiliates).toBe(50);
    });

    it("should handle zero previous data for growth percentages", async () => {
      jest.spyOn(prisma.user, "count").mockResolvedValue(0);
      jest.spyOn(prisma.business, "aggregate").mockResolvedValue({ _sum: {} } as any);
      jest.spyOn(prisma.fraudAlert, "count").mockResolvedValue(0);
      jest.spyOn(prisma.withdrawal, "aggregate").mockResolvedValue({ _sum: {} } as any);
      jest.spyOn(prisma.commission, "aggregate").mockResolvedValue({ _sum: {} } as any);

      const result = await service.getAdminStats();

      expect(result.totalRevenueGrowth).toBe(0);
      expect(result.totalAffiliatesGrowth).toBe(0);
    });

  });

  describe("getManagerPerformance", () => {
    it("should return manager performance including networkSize", async () => {
      const recruits = [
        { id: "recruit1", role: "AGENT", _count: { businesses: 1 } },
        { id: "recruit2", role: "AGENT", _count: { businesses: 0 } },
      ];

      jest
        .spyOn(prisma.user, "findMany")
        .mockResolvedValueOnce(recruits as any);

      jest.spyOn(prisma.business, "count").mockResolvedValue(50);
      jest
        .spyOn(prisma.user, "count")
        .mockResolvedValueOnce(120) // supervisorsCount
        .mockResolvedValueOnce(120); // networkSize

      const result = await service.getManagerPerformance("managerId");

      expect(result.networkSize).toBe(120);
      expect(result.activeAgentsCount).toBe(1);
    });
  });

  describe("getAffiliateStats", () => {
    it("should return affiliate stats including today's earnings and level", async () => {
      const userId = "user123";
      const mockUser = {
        totalEarnings: 100000,
        pendingEarnings: 20000,
        referralCount: 25, // Should be "Active Earner"
      };

      jest.spyOn(prisma.user, "findUnique").mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.business, "count").mockResolvedValue(5);
      jest.spyOn(prisma.linkClick, "count")
        .mockResolvedValueOnce(100) // Total clicks
        .mockResolvedValueOnce(15); // Today clicks
      jest.spyOn(prisma.commission, "aggregate").mockResolvedValue({
        _sum: { amount: 24500 }
      } as any);

      const result = await service.getAffiliateStats(userId);

      expect(result.totalEarnings).toBe(100000);
      expect(result.todayEarnings).toBe(24500);
      expect(result.todayClicks).toBe(15);
      expect(result.currentLevel).toBe("Active Earner");
      expect(result.referralCount).toBe(25);
    });

    it("should correctly identify 'Rising Star' level", async () => {
      jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ referralCount: 15 } as any);
      jest.spyOn(prisma.business, "count").mockResolvedValue(0);
      jest.spyOn(prisma.linkClick, "count").mockResolvedValue(0);
      jest.spyOn(prisma.commission, "aggregate").mockResolvedValue({ _sum: { amount: 0 } } as any);

      const result = await service.getAffiliateStats("user");
      expect(result.currentLevel).toBe("Rising Star");
    });

    it("should correctly identify 'Elite Partner' level", async () => {
      jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ referralCount: 60 } as any);
      jest.spyOn(prisma.business, "count").mockResolvedValue(0);
      jest.spyOn(prisma.linkClick, "count").mockResolvedValue(0);
      jest.spyOn(prisma.commission, "aggregate").mockResolvedValue({ _sum: { amount: 0 } } as any);

      const result = await service.getAffiliateStats("user");
      expect(result.currentLevel).toBe("Elite Partner");
    });

    it("should correctly identify 'Master Affiliate' level", async () => {
      jest.spyOn(prisma.user, "findUnique").mockResolvedValue({ referralCount: 120 } as any);
      jest.spyOn(prisma.business, "count").mockResolvedValue(0);
      jest.spyOn(prisma.linkClick, "count").mockResolvedValue(0);
      jest.spyOn(prisma.commission, "aggregate").mockResolvedValue({ _sum: { amount: 0 } } as any);

      const result = await service.getAffiliateStats("user");
      expect(result.currentLevel).toBe("Master Affiliate");
    });
  });
});
