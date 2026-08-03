import { Test, TestingModule } from '@nestjs/testing';
import { FraudService } from './fraud.service';
import { PrismaService } from '../prisma/prisma.service';
import { FraudStatus, Severity, UserStatus } from '@prisma/client';

describe('FraudService', () => {
  let service: FraudService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FraudService,
        {
          provide: PrismaService,
          useValue: {
            fraudAlert: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
            },
            user: {
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<FraudService>(FraudService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateStatus', () => {
    it('should automatically suspend user if critical alert is confirmed', async () => {
      const mockAlert = { id: 'alert1', userId: 'user1', severity: Severity.CRITICAL };
      jest.spyOn(prisma.fraudAlert, 'findUnique').mockResolvedValue(mockAlert as any);
      jest.spyOn(prisma.fraudAlert, 'update').mockResolvedValue({ ...mockAlert, status: FraudStatus.CONFIRMED } as any);
      jest.spyOn(prisma.user, 'update').mockResolvedValue({ id: 'user1', status: UserStatus.SUSPENDED } as any);

      await service.updateStatus('alert1', FraudStatus.CONFIRMED, 'Confirmed fraud', 'admin1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { status: UserStatus.SUSPENDED },
      });
    });

    it('should NOT suspend user if alert is NOT critical', async () => {
      const mockAlert = { id: 'alert1', userId: 'user1', severity: Severity.HIGH };
      jest.spyOn(prisma.fraudAlert, 'findUnique').mockResolvedValue(mockAlert as any);
      jest.spyOn(prisma.fraudAlert, 'update').mockResolvedValue({ ...mockAlert, status: FraudStatus.CONFIRMED } as any);

      await service.updateStatus('alert1', FraudStatus.CONFIRMED, 'Confirmed fraud', 'admin1');

      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should NOT suspend user if status is NOT confirmed', async () => {
      const mockAlert = { id: 'alert1', userId: 'user1', severity: Severity.CRITICAL };
      jest.spyOn(prisma.fraudAlert, 'findUnique').mockResolvedValue(mockAlert as any);
      jest.spyOn(prisma.fraudAlert, 'update').mockResolvedValue({ ...mockAlert, status: FraudStatus.UNDER_REVIEW } as any);

      await service.updateStatus('alert1', FraudStatus.UNDER_REVIEW, 'Reviewing', 'admin1');

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
