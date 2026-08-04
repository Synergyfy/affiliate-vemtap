import { Test, TestingModule } from '@nestjs/testing';
import { ExternalService } from './external.service';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessesService } from '../businesses/businesses.service';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';
import { AuditService } from '../prisma/audit.service';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PlanType, UserStatus } from '@prisma/client';

describe('ExternalService', () => {
  let service: ExternalService;

  const mockPrisma: any = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    business: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    platformSettings: {
      findFirst: jest.fn(),
    },
  };
  mockPrisma.$transaction = jest.fn((cb) => cb(mockPrisma));

  const mockBusinessesService = {
    generateCommissions: jest.fn(),
  };

  const mockWithdrawalsService = {
    create: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BusinessesService, useValue: mockBusinessesService },
        { provide: WithdrawalsService, useValue: mockWithdrawalsService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<ExternalService>(ExternalService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAffiliates', () => {
    it('should return affiliates matching the search filter', async () => {
      const mockAffiliates = [
        {
          id: 'user-1',
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          referralCode: 'VEM-JD123',
          status: UserStatus.ACTIVE,
          createdAt: new Date(),
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockAffiliates);
      mockPrisma.user.count.mockResolvedValue(1);

      const result = await service.getAffiliates({ search: 'John', status: UserStatus.ACTIVE });

      expect(result.data).toEqual(mockAffiliates);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: 'AFFILIATE',
            status: UserStatus.ACTIVE,
          }),
        }),
      );
    });
  });

  describe('attachBusiness', () => {
    const dto = {
      affiliateId: 'affiliate-uuid',
      businessName: 'Mock Business',
      ownerName: 'Owner Name',
      email: 'owner@business.com',
      phone: '08123456789',
      amount: 5000,
      planType: PlanType.STARTER,
      address: '123 Test St',
      businessType: 'SaaS',
    };

    it('should throw NotFoundException if affiliate does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.attachBusiness(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if affiliate is inactive', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'affiliate-uuid',
        status: UserStatus.SUSPENDED,
      });

      await expect(service.attachBusiness(dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if business with email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'affiliate-uuid',
        status: UserStatus.ACTIVE,
        referralCode: 'REF-123',
      });
      mockPrisma.business.findFirst.mockResolvedValue({
        id: 'existing-business-id',
        email: dto.email,
      });

      await expect(service.attachBusiness(dto)).rejects.toThrow(ConflictException);
    });

    it('should attach business successfully and trigger commission', async () => {
      const mockAffiliate = {
        id: 'affiliate-uuid',
        status: UserStatus.ACTIVE,
        referralCode: 'REF-123',
        fullName: 'Affiliate User',
        referrerId: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockAffiliate);
      mockPrisma.business.findFirst.mockResolvedValue(null);
      mockPrisma.platformSettings.findFirst.mockResolvedValue({
        directCommissionRate: '0.15',
      });

      const mockBusiness = {
        id: 'new-business-uuid',
        businessName: dto.businessName,
        email: dto.email,
        subscriptionAmount: 5000,
        affiliateId: mockAffiliate.id,
      };

      mockPrisma.business.create.mockResolvedValue(mockBusiness);
      mockPrisma.business.findUnique.mockResolvedValue({
        ...mockBusiness,
        affiliate: mockAffiliate,
      });

      mockBusinessesService.generateCommissions.mockResolvedValue(true);

      const result = await service.attachBusiness(dto);

      expect(result.businessId).toBe(mockBusiness.id);
      expect(result.commissionTriggered).toBe(true);
      expect(mockPrisma.business.create).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockAffiliate.id },
        data: { referralCount: { increment: 1 } },
      });
      expect(mockBusinessesService.generateCommissions).toHaveBeenCalled();
    });
  });
});
