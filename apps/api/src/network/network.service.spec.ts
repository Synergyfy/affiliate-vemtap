import { Test, TestingModule } from '@nestjs/testing';
import { NetworkService } from './network.service';
import { PrismaService } from '../prisma/prisma.service';
import { BonusType } from './dto/network-response.dto';
import { BadRequestException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

describe('NetworkService', () => {
  let service: NetworkService;

  const mockUser = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  };

  const mockBusiness = {
    count: jest.fn().mockImplementation((args?: any) => {
      if (args?.where?.affiliateId) {
        return 10; // Personal active businesses
      }
      return 45; // Total network active businesses
    }),
  };

  const mockCommission = {
    create: jest.fn(),
  };

  const mockFraudAlert = {
    count: jest.fn(),
  };

  const mockSettingsService = {
    getSettings: jest.fn().mockResolvedValue({
      reqAgentActiveDays: 90,
      reqAgentActiveBusinesses: 40,
      reqAgentMinReportingScore: 85.0,
      reqAgentMinAttendanceRate: 90.0,
      reqAffiliateActiveAgents: 30,
      reqAffiliateNetworkBusinesses: 100,
      reqSupervisorActiveAgents: 10,
      reqSupervisorActiveSupervisors: 5,
      reqSupervisorNetworkBusinesses: 100,
    }),
  };

  // Define mockPrisma structure first
  const mockPrisma: any = {
    user: mockUser,
    business: mockBusiness,
    commission: mockCommission,
    fraudAlert: mockFraudAlert,
    platformSettings: {
      findFirst: jest.fn().mockResolvedValue({
        reqAgentActiveDays: 90,
        reqAgentActiveBusinesses: 40,
        reqAgentMinReportingScore: 85.0,
        reqAgentMinAttendanceRate: 90.0,
        reqAffiliateActiveAgents: 30,
        reqAffiliateNetworkBusinesses: 100,
        reqSupervisorActiveAgents: 10,
        reqSupervisorActiveSupervisors: 5,
        reqSupervisorNetworkBusinesses: 100,
        managerOverrideRate: 0.10,
        agentMilestoneBonusAmount: 5000,
        businessMilestoneBonusAmount: 10000,
      }),
    },
  };

  // Then add $transaction
  mockPrisma.$transaction = jest.fn((cb) => cb(mockPrisma));

  beforeEach(() => {
    mockFraudAlert.count.mockResolvedValue(0); // Default to no fraud issues
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NetworkService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get<NetworkService>(NetworkService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('should return stats and milestone progress', async () => {
      const userId = 'user-1';
      mockUser.findUnique.mockResolvedValue({
        id: userId,
        role: 'AFFILIATE',
        createdAt: new Date(),
        managerQualificationExpiry: null,
        isManagerMode: false,
        hasClaimedAgentBonus: false,
        hasClaimedBusinessBonus: false,
      });
      mockUser.count.mockResolvedValue(15); // active agents
      mockBusiness.count
        .mockResolvedValueOnce(10)  // personalActiveBusinesses
        .mockResolvedValueOnce(45); // totalNetworkBusinesses

      const result = await service.getStats(userId);

      expect(result.activeAgentsCount).toBe(15);
      expect(result.totalNetworkBusinesses).toBe(45);
      expect(result.milestones.agents.isReached).toBe(false);
      expect(result.milestones.businesses.isReached).toBe(false);
    });

    it('should mark milestones as reached when targets are met', async () => {
      const userId = 'user-1';
      mockUser.findUnique.mockResolvedValue({
        id: userId,
        role: 'SUPERVISOR', // supervisors evaluate manager targets (10 agents, 100 businesses)
        createdAt: new Date(),
        managerQualificationExpiry: null,
        isManagerMode: false,
        hasClaimedAgentBonus: false,
        hasClaimedBusinessBonus: false,
      });
      mockUser.count.mockResolvedValue(30);
      mockBusiness.count.mockResolvedValue(100);

      const result = await service.getStats(userId);

      expect(result.milestones.agents.isReached).toBe(true);
      expect(result.milestones.businesses.isReached).toBe(true);
    });
  });

  describe('claimBonus', () => {
    it('should throw if target for agent bonus not reached', async () => {
      const userId = 'user-1';
      mockUser.findUnique.mockResolvedValue({ id: userId, role: 'SUPERVISOR', createdAt: new Date(), hasClaimedAgentBonus: false });
      mockUser.count.mockResolvedValue(5); // < 10 target
      mockBusiness.count.mockResolvedValue(0);

      await expect(service.claimBonus(userId, BonusType.AGENT))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw if agent bonus already claimed', async () => {
      const userId = 'user-1';
      mockUser.findUnique.mockResolvedValue({ id: userId, role: 'SUPERVISOR', createdAt: new Date(), hasClaimedAgentBonus: true });
      mockUser.count.mockResolvedValue(30);
      mockBusiness.count.mockResolvedValue(100);

      await expect(service.claimBonus(userId, BonusType.AGENT))
        .rejects.toThrow(BadRequestException);
    });

    it('should successfully claim agent bonus when qualified', async () => {
      const userId = 'user-1';
      mockUser.findUnique.mockResolvedValue({ id: userId, role: 'SUPERVISOR', createdAt: new Date(), hasClaimedAgentBonus: false });
      mockUser.count.mockResolvedValue(30);
      mockBusiness.count.mockResolvedValue(0);

      const result = await service.claimBonus(userId, BonusType.AGENT);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(5000);
      expect(mockCommission.create).toHaveBeenCalled();
      expect(mockUser.update).toHaveBeenCalled();
    });
  });

  describe('getTeamMemberDetail', () => {
    it('computes visits from visited leads (visitedAt), not demos', async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

      mockUser.findFirst.mockResolvedValue({
        id: 'member-1',
        fullName: 'Team Member',
        email: 'tm@test.com',
        phone: '08000000000',
        avatar: null,
        role: 'AGENT',
        status: 'ACTIVE',
        createdAt: new Date(),
        dailyLeadTarget: 5,
        monthlyConversionTarget: 2,
        totalEarnings: 0,
        businesses: [],
        leads: [
          { id: 'l1', businessName: 'A', status: 'VISITED', priority: 'MEDIUM', createdAt: today, visitedAt: today },
          { id: 'l2', businessName: 'B', status: 'NOT_YET', priority: 'LOW', createdAt: today, visitedAt: null },
          { id: 'l3', businessName: 'C', status: 'CONTACTED', priority: 'HIGH', createdAt: yesterday, visitedAt: yesterday },
        ],
        activities: [],
        agentDemos: [{ id: 'd1', date: today, status: 'COMPLETED' }],
        targetAdjustmentsReceived: [],
      });

      const result = await service.getTeamMemberDetail('manager-1', 'member-1');

      // Only the lead visited today (l1) counts; demo d1 and non-visited leads are excluded.
      expect(result.dailyVisitsCount).toBe(1);
      expect(result.weeklyVisitsCount).toBe(2);
    });
  });

  describe('toggleManagerMode', () => {
    it('should throw if milestones not reached', async () => {
      const userId = 'user-1';
      mockUser.findUnique.mockResolvedValue({ id: userId, role: 'SUPERVISOR', createdAt: new Date() });
      mockUser.count.mockResolvedValue(2); // Not qualified
      mockBusiness.count.mockResolvedValue(10);

      await expect(service.toggleManagerMode(userId))
        .rejects.toThrow(BadRequestException);
    });

    it('should toggle mode if qualified', async () => {
      const userId = 'user-1';
      mockUser.findUnique.mockResolvedValue({ id: userId, role: 'SUPERVISOR', createdAt: new Date(), isManagerMode: false });
      mockUser.count.mockResolvedValue(30);
      mockBusiness.count.mockResolvedValue(100);
      mockUser.update.mockResolvedValue({ id: userId, role: 'MANAGER', managerQualificationExpiry: new Date() });

      const result = await service.toggleManagerMode(userId);

      expect(result.isManagerMode).toBe(true);
      expect(result.role).toBe('MANAGER');
      expect(mockUser.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({
          role: 'MANAGER',
          managerQualificationExpiry: expect.any(Date),
        }),
      });
    });
  });
});
