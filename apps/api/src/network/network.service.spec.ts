import { Test, TestingModule } from '@nestjs/testing';
import { NetworkService } from './network.service';
import { PrismaService } from '../prisma/prisma.service';
import { BonusType } from './dto/network-response.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('NetworkService', () => {
  let service: NetworkService;
  let prisma: PrismaService;

  const mockUser = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  };

  const mockBusiness = {
    count: jest.fn(),
  };

  const mockCommission = {
    create: jest.fn(),
  };

  // Define mockPrisma structure first
  const mockPrisma: any = {
    user: mockUser,
    business: mockBusiness,
    commission: mockCommission,
  };

  // Then add $transaction
  mockPrisma.$transaction = jest.fn((cb) => cb(mockPrisma));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NetworkService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NetworkService>(NetworkService);
    prisma = module.get<PrismaService>(PrismaService);
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
        managerQualificationExpiry: null,
        isManagerMode: false,
        hasClaimedAgentBonus: false,
        hasClaimedBusinessBonus: false,
      });
      mockUser.count.mockResolvedValue(15); // active agents
      mockBusiness.count.mockResolvedValue(45); // total network businesses

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
      mockUser.findUnique.mockResolvedValue({ id: userId, hasClaimedAgentBonus: false });
      mockUser.count.mockResolvedValue(10); // < 30
      mockBusiness.count.mockResolvedValue(0);

      await expect(service.claimBonus(userId, BonusType.AGENT))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw if agent bonus already claimed', async () => {
      const userId = 'user-1';
      mockUser.findUnique.mockResolvedValue({ id: userId, hasClaimedAgentBonus: true });
      mockUser.count.mockResolvedValue(30);
      mockBusiness.count.mockResolvedValue(100);

      await expect(service.claimBonus(userId, BonusType.AGENT))
        .rejects.toThrow(BadRequestException);
    });

    it('should successfully claim agent bonus when qualified', async () => {
      const userId = 'user-1';
      mockUser.findUnique.mockResolvedValue({ id: userId, hasClaimedAgentBonus: false });
      mockUser.count.mockResolvedValue(30);
      mockBusiness.count.mockResolvedValue(0);

      const result = await service.claimBonus(userId, BonusType.AGENT);

      expect(result.success).toBe(true);
      expect(result.amount).toBe(5000);
      expect(mockCommission.create).toHaveBeenCalled();
      expect(mockUser.update).toHaveBeenCalled();
    });
  });

  describe('toggleManagerMode', () => {
    it('should throw if milestones not reached', async () => {
      const userId = 'user-1';
      mockUser.findUnique.mockResolvedValue({ id: userId });
      mockUser.count.mockResolvedValue(10); // Not qualified
      mockBusiness.count.mockResolvedValue(10);

      await expect(service.toggleManagerMode(userId))
        .rejects.toThrow(BadRequestException);
    });

    it('should toggle mode if qualified', async () => {
      const userId = 'user-1';
      mockUser.findUnique.mockResolvedValue({ id: userId, isManagerMode: false });
      mockUser.count.mockResolvedValue(30);
      mockBusiness.count.mockResolvedValue(100);
      mockUser.update.mockResolvedValue({ id: userId, isManagerMode: true });

      const result = await service.toggleManagerMode(userId);

      expect(result.isManagerMode).toBe(true);
      expect(mockUser.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: expect.objectContaining({ isManagerMode: true }),
      });
    });
  });
});
