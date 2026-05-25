import { Test, TestingModule } from '@nestjs/testing';
import { AgreementsService } from './agreements.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AgreementsService', () => {
  let service: AgreementsService;

  const mockPrisma = {
    agreement: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    agreementSignature: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
    },
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgreementsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: 'CACHE_MANAGER', useValue: mockCache },
      ],
    }).compile();

    service = module.get<AgreementsService>(AgreementsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create agreement and delete corresponding active caches', async () => {
      const mockAgreement = {
        id: 'agreement-1',
        title: 'Title',
        description: 'Desc',
        content: 'Content',
        targetRoles: [Role.AFFILIATE],
        version: 1,
        isActive: true,
      };

      mockPrisma.agreement.create.mockResolvedValue(mockAgreement);
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'user-1' }]);
      mockPrisma.notification.createMany.mockResolvedValue({ count: 1 });

      const result = await service.create({
        title: 'Title',
        description: 'Desc',
        content: 'Content',
        targetRoles: [Role.AFFILIATE],
      });

      expect(result).toEqual(mockAgreement);
      expect(mockPrisma.agreement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Title',
            version: 1,
            targetRoles: [Role.AFFILIATE],
          }),
        }),
      );
      expect(mockCache.del).toHaveBeenCalledWith('agreements:active:role:AFFILIATE');
    });
  });

  describe('update', () => {
    it('should increment version on schema changes and clear cache', async () => {
      const existing = {
        id: 'agreement-1',
        title: 'Title v1',
        description: 'Desc',
        content: 'Content',
        targetRoles: [Role.AFFILIATE],
        version: 1,
        isActive: true,
      };

      mockPrisma.agreement.findUnique.mockResolvedValue(existing);
      mockPrisma.agreement.update.mockResolvedValue({
        ...existing,
        title: 'Title v2',
        version: 2,
      });
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.update('agreement-1', { title: 'Title v2' });

      expect(result.version).toBe(2);
      expect(mockCache.del).toHaveBeenCalledWith('agreements:active:role:AFFILIATE');
    });

    it('should not increment version on non-version fields like isActive', async () => {
      const existing = {
        id: 'agreement-1',
        title: 'Title',
        description: 'Desc',
        content: 'Content',
        targetRoles: [Role.AFFILIATE],
        version: 1,
        isActive: true,
      };

      mockPrisma.agreement.findUnique.mockResolvedValue(existing);
      mockPrisma.agreement.update.mockResolvedValue({
        ...existing,
        isActive: false,
        version: 1,
      });

      const result = await service.update('agreement-1', { isActive: false });

      expect(result.version).toBe(1);
      expect(result.isActive).toBe(false);
    });

    it('should throw NotFoundException if agreement to update does not exist', async () => {
      mockPrisma.agreement.findUnique.mockResolvedValue(null);
      await expect(service.update('agreement-1', { title: 'Title' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPendingAgreements', () => {
    it('should retrieve pending agreements on cache miss', async () => {
      mockCache.get.mockResolvedValue(null); // Cache miss for both active and signed
      
      const activeAgreements = [
        { id: 'ag-1', title: 'Ag 1', version: 1, targetRoles: [Role.AFFILIATE], isActive: true },
        { id: 'ag-2', title: 'Ag 2', version: 2, targetRoles: [Role.AFFILIATE], isActive: true },
      ];
      mockPrisma.agreement.findMany.mockResolvedValue(activeAgreements);

      const signedLogs = [
        { agreementId: 'ag-1', version: 1 }, // Already signed current version of ag-1
        { agreementId: 'ag-2', version: 1 }, // Signed older version of ag-2
      ];
      mockPrisma.agreementSignature.findMany.mockResolvedValue(signedLogs);

      const result = await service.getPendingAgreements('user-1', Role.AFFILIATE);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('ag-2'); // Only ag-2 is pending (version 2 is active, user only signed 1)
      expect(mockCache.set).toHaveBeenCalledWith('agreements:active:role:AFFILIATE', activeAgreements, 3600 * 1000);
      expect(mockCache.set).toHaveBeenCalledWith('agreements:signed:user:user-1', signedLogs, 3600 * 1000);
    });

    it('should read from cache on cache hit without querying DB', async () => {
      const activeAgreements = [
        { id: 'ag-1', title: 'Ag 1', version: 1, targetRoles: [Role.AFFILIATE], isActive: true },
      ];
      const signedLogs = [
        { agreementId: 'ag-1', version: 1 },
      ];
      
      mockCache.get
        .mockResolvedValueOnce(activeAgreements) // First call: active cache
        .mockResolvedValueOnce(signedLogs);      // Second call: signed cache

      const result = await service.getPendingAgreements('user-1', Role.AFFILIATE);

      expect(result.length).toBe(0); // All signed
      expect(mockPrisma.agreement.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.agreementSignature.findMany).not.toHaveBeenCalled();
    });
  });

  describe('signAgreement', () => {
    it('should create a signature and invalidate user signature cache', async () => {
      const mockAgreement = {
        id: 'ag-1',
        title: 'Ag 1',
        version: 2,
        isActive: true,
      };

      mockPrisma.agreement.findUnique.mockResolvedValue(mockAgreement);
      mockPrisma.agreementSignature.findUnique.mockResolvedValue(null);
      mockPrisma.agreementSignature.create.mockResolvedValue({
        id: 'sig-1',
        userId: 'user-1',
        agreementId: 'ag-1',
        version: 2,
      });

      const result = await service.signAgreement('user-1', 'ag-1', { version: 2 });

      expect(result.version).toBe(2);
      expect(mockPrisma.agreementSignature.create).toHaveBeenCalled();
      expect(mockCache.del).toHaveBeenCalledWith('agreements:signed:user:user-1');
    });

    it('should reject signature if version mismatches the latest', async () => {
      const mockAgreement = {
        id: 'ag-1',
        title: 'Ag 1',
        version: 2,
        isActive: true,
      };

      mockPrisma.agreement.findUnique.mockResolvedValue(mockAgreement);

      await expect(service.signAgreement('user-1', 'ag-1', { version: 1 })).rejects.toThrow(BadRequestException);
    });
  });
});
