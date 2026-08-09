import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsService } from './commissions.service';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionStatus } from '@prisma/client';

describe('CommissionsService', () => {
  let service: CommissionsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        {
          provide: PrismaService,
          useValue: {
            commission: {
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
            platformSettings: {
              findFirst: jest.fn().mockResolvedValue({ earningDurationMonths: 12 }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return mapped commissions with business paidMonths and totalMonths', async () => {
      const mockCommissions = [
        {
          id: '1',
          userId: 'user1',
          amount: 100,
          business: {
            id: 'biz1',
            businessName: 'Biz 1',
            _count: { commissions: 3 },
          },
        },
        {
          id: '2',
          userId: 'user1',
          amount: 50,
          business: null,
        },
      ];

      jest.spyOn(prisma.commission, 'findMany').mockResolvedValue(mockCommissions as any);
      jest.spyOn(prisma.commission, 'count').mockResolvedValue(2);

      const result = await service.findAll('user1', { skip: 0, take: 10 });

      expect(result.total).toBe(2);
      expect(result.data[0].business).toBeDefined();
      expect((result.data[0].business as any).paidMonths).toBe(3);
      expect((result.data[0].business as any).totalMonths).toBe(12);
      expect(result.data[1].business).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update commission status', async () => {
      const mockUpdated = { id: '1', status: CommissionStatus.PAID };
      jest.spyOn(prisma.commission, 'update').mockResolvedValue(mockUpdated as any);

      const result = await service.updateStatus('1', { status: CommissionStatus.PAID });

      expect(prisma.commission.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: CommissionStatus.PAID },
      });
      expect(result).toEqual(mockUpdated);
    });
  });
});
