import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SettingsService', () => {
  let service: SettingsService;

  const mockPrisma = {
    platformSettings: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
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
        SettingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: 'CACHE_MANAGER', useValue: mockCache },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should create default settings if none exist', async () => {
      mockPrisma.platformSettings.count.mockResolvedValue(0);
      await service.onModuleInit();
      expect(mockPrisma.platformSettings.create).toHaveBeenCalled();
    });

    it('should not create settings if they already exist', async () => {
      mockPrisma.platformSettings.count.mockResolvedValue(1);
      await service.onModuleInit();
      expect(mockPrisma.platformSettings.create).not.toHaveBeenCalled();
    });
  });

  describe('getSettings', () => {
    it('should return cached settings if available without querying DB', async () => {
      const mockSettings = { id: '1', agreementVersion: 1 };
      mockCache.get.mockResolvedValue(mockSettings);

      const result = await service.getSettings();
      expect(result).toEqual(mockSettings);
      expect(mockCache.get).toHaveBeenCalledWith('platform_settings');
      expect(mockPrisma.platformSettings.findFirst).not.toHaveBeenCalled();
    });

    it('should query DB and cache settings if not in cache', async () => {
      mockCache.get.mockResolvedValue(null);
      const mockSettings = { id: '1', reqAgentActiveDays: 90 };
      mockPrisma.platformSettings.findFirst.mockResolvedValue(mockSettings);

      const result = await service.getSettings();
      expect(result).toEqual(mockSettings);
      expect(mockCache.get).toHaveBeenCalledWith('platform_settings');
      expect(mockPrisma.platformSettings.findFirst).toHaveBeenCalled();
      expect(mockCache.set).toHaveBeenCalledWith('platform_settings', mockSettings, 3600 * 1000);
    });
  });

  describe('updateSettings', () => {
    it('should update settings and evict platform settings cache', async () => {
      const mockSettings = { id: '1' };
      mockPrisma.platformSettings.findFirst.mockResolvedValue(mockSettings);
      mockPrisma.platformSettings.update.mockResolvedValue({ ...mockSettings, reqAgentActiveDays: 45, recurringAgentCommission: 8, recurringDurationMonths: 24 });

      const result = await service.updateSettings({ reqAgentActiveDays: 45, recurringAgentCommission: 8, recurringDurationMonths: 24 });
      expect(result.reqAgentActiveDays).toBe(45);
      expect(result.recurringAgentCommission).toBe(8);
      expect(result.recurringDurationMonths).toBe(24);
      expect(mockPrisma.platformSettings.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: { reqAgentActiveDays: 45, recurringAgentCommission: 8, recurringDurationMonths: 24 },
        }),
      );
      expect(mockCache.del).toHaveBeenCalledWith('platform_settings');
    });

    it('should throw NotFoundException if settings do not exist', async () => {
      mockPrisma.platformSettings.findFirst.mockResolvedValue(null);
      await expect(service.updateSettings({ reqAgentActiveDays: 45 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAgreement', () => {
    it('should return cached agreement if it exists', async () => {
      const mockCached = { agreementTemplate: '<p>Cached</p>', agreementVersion: 2 };
      mockCache.get.mockResolvedValue(mockCached);

      const result = await service.getAgreement();
      expect(result).toEqual(mockCached);
      expect(mockCache.get).toHaveBeenCalledWith('settings_agreement');
    });

    it('should retrieve and cache agreement from DB if not cached', async () => {
      mockCache.get.mockResolvedValue(null);
      const mockSettings = { id: '1', agreementTemplate: '<p>DB Template</p>', agreementVersion: 1 };
      mockPrisma.platformSettings.findFirst.mockResolvedValue(mockSettings);

      const result = await service.getAgreement();
      expect(result.agreementTemplate).toBe('<p>DB Template</p>');
      expect(result.agreementVersion).toBe(1);
      expect(mockCache.set).toHaveBeenCalledWith('settings_agreement', expect.any(Object), 3600 * 1000);
    });
  });

  describe('updateAgreement', () => {
    it('should update agreement and clear cache', async () => {
      const mockSettings = { id: '1' };
      mockPrisma.platformSettings.findFirst.mockResolvedValue(mockSettings);
      mockPrisma.platformSettings.update.mockResolvedValue({
        agreementTemplate: '<p>New Template</p>',
        agreementVersion: 2,
      });

      const result = await service.updateAgreement({ agreementTemplate: '<p>New Template</p>' });
      expect(result.agreementTemplate).toBe('<p>New Template</p>');
      expect(result.agreementVersion).toBe(2);
      expect(mockCache.del).toHaveBeenCalledWith('settings_agreement');
    });

    it('should throw NotFoundException if settings do not exist on update', async () => {
      mockPrisma.platformSettings.findFirst.mockResolvedValue(null);
      await expect(service.updateAgreement({ agreementTemplate: 'test' })).rejects.toThrow(NotFoundException);
    });
  });
});
