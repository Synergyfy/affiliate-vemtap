import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: PrismaService;

  const mockPrisma = {
    platformSettings: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    prisma = module.get<PrismaService>(PrismaService);
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
    it('should return settings', async () => {
      const mockSettings = { id: '1', agreementVersion: 1 };
      mockPrisma.platformSettings.findFirst.mockResolvedValue(mockSettings);
      const result = await service.getSettings();
      expect(result).toEqual(mockSettings);
    });
  });

  describe('updateSettings', () => {
    it('should update settings', async () => {
      const mockSettings = { id: '1' };
      mockPrisma.platformSettings.findFirst.mockResolvedValue(mockSettings);
      mockPrisma.platformSettings.update.mockResolvedValue({ ...mockSettings, linkExpiryDays: 45 });

      const result = await service.updateSettings({ linkExpiryDays: 45 });
      expect(result.linkExpiryDays).toBe(45);
      expect(mockPrisma.platformSettings.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: { linkExpiryDays: 45 },
        }),
      );
    });

    it('should throw NotFoundException if settings do not exist', async () => {
      mockPrisma.platformSettings.findFirst.mockResolvedValue(null);
      await expect(service.updateSettings({ linkExpiryDays: 45 })).rejects.toThrow(NotFoundException);
    });
  });
});
