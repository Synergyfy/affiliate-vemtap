import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { JourneyService } from './journey.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CommunicationChannel } from '@prisma/client';

describe('JourneyService', () => {
  let service: JourneyService;

  type PrismaMock = {
    customerJourneyStage: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
      createManyAndReturn: jest.Mock;
    };
    communicationTemplate: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };

  const mockPrisma: PrismaMock = {
    customerJourneyStage: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createManyAndReturn: jest.fn(),
    },
    communicationTemplate: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback: (tx: any) => Promise<unknown>) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JourneyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<JourneyService>(JourneyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStages', () => {
    it('returns stages ordered by sortOrder then createdAt', async () => {
      mockPrisma.customerJourneyStage.findMany.mockResolvedValue([
        { id: 's2', name: 'Second', sortOrder: 1 },
        { id: 's1', name: 'First', sortOrder: 0 },
      ]);

      const result = await service.getStages();

      expect(mockPrisma.customerJourneyStage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          include: { template: { select: { id: true, name: true } } },
        }),
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('replaceStages', () => {
    it('replaces all stages inside a transaction and returns them in order', async () => {
      mockPrisma.communicationTemplate.findMany.mockResolvedValue([{ id: 'tpl-1' }]);
      mockPrisma.customerJourneyStage.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.customerJourneyStage.createManyAndReturn.mockResolvedValue([
        { id: 's2', name: 'Follow-up', waitDays: 3, channel: 'WHATSAPP', templateId: 'tpl-1', enabled: true, sortOrder: 1 },
        { id: 's1', name: 'Welcome', waitDays: 0, channel: 'SMS', templateId: null, enabled: true, sortOrder: 0 },
      ]);

      const result = await service.replaceStages({
        stages: [
          { name: 'Welcome', waitDays: 0, channel: CommunicationChannel.SMS, enabled: true },
          { name: 'Follow-up', waitDays: 3, channel: CommunicationChannel.WHATSAPP, templateId: 'tpl-1', enabled: true },
        ],
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.customerJourneyStage.deleteMany).toHaveBeenCalledWith({});
      expect(mockPrisma.customerJourneyStage.createManyAndReturn).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ name: 'Welcome', sortOrder: 0 }),
          expect.objectContaining({ name: 'Follow-up', sortOrder: 1 }),
        ],
      });
      // Returned stages are re-sorted by sortOrder regardless of DB order.
      expect(result.map((s: any) => s.name)).toEqual(['Welcome', 'Follow-up']);
    });

    it('rejects a missing template with NotFoundException', async () => {
      mockPrisma.communicationTemplate.findMany.mockResolvedValue([{ id: 'tpl-1' }]);

      await expect(
        service.replaceStages({
          stages: [
            { name: 'Broken', waitDays: 0, channel: CommunicationChannel.SMS, templateId: 'does-not-exist', enabled: true },
          ],
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('accepts an empty stage list and clears the journey', async () => {
      mockPrisma.customerJourneyStage.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.replaceStages({ stages: [] });

      expect(mockPrisma.customerJourneyStage.deleteMany).toHaveBeenCalledWith({});
      expect(mockPrisma.customerJourneyStage.createManyAndReturn).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});