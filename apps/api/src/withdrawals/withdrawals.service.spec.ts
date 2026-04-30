import { Test, TestingModule } from '@nestjs/testing';
import { WithdrawalsService } from './withdrawals.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { AuditService } from '../prisma/audit.service';
import { PaystackService } from '../payments/paystack.service';
import { SettingsService } from '../settings/settings.service';
import { KycStatus, Prisma } from '@prisma/client';

describe('WithdrawalsService Bulk', () => {
  let service: WithdrawalsService;
  // @ts-ignore
  let prisma: PrismaService;
  // @ts-ignore
  let settingsService: SettingsService;

  const mockPrisma: any = {
    user: {
      findMany: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    withdrawal: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    bulkWithdrawalRun: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  
  mockPrisma.$transaction = jest.fn((callback: (tx: any) => any) => callback(mockPrisma));

  const mockTransactionsService = {
    createWithTx: jest.fn(),
    create: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockPaystackService = {
    initiateTransfer: jest.fn(),
  };

  const mockSettingsService = {
    getSettings: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WithdrawalsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TransactionsService, useValue: mockTransactionsService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: PaystackService, useValue: mockPaystackService },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compile();

    service = module.get<WithdrawalsService>(WithdrawalsService);
    prisma = module.get<PrismaService>(PrismaService);
    settingsService = module.get<SettingsService>(SettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('triggerBulkWithdrawals', () => {
    const adminId = 'admin-uuid';

    it('should process withdrawals for eligible users correctly', async () => {
      // Mock settings
      mockSettingsService.getSettings.mockResolvedValue({
        minWithdrawal: new Prisma.Decimal(5000),
        withdrawalFee: new Prisma.Decimal(100),
      });

      // Mock eligible users
      const mockUsers = [
        {
          id: 'user1',
          fullName: 'User One',
          bankName: 'Bank A',
          accountNumber: '123',
          pendingEarnings: new Prisma.Decimal(10000),
          kycStatus: KycStatus.VERIFIED,
          paystackSubaccountId: 'sub1',
          status: 'ACTIVE',
        },
        {
          id: 'user2',
          fullName: 'User Two',
          bankName: 'Bank B',
          accountNumber: '456',
          pendingEarnings: new Prisma.Decimal(6000),
          kycStatus: KycStatus.VERIFIED,
          paystackSubaccountId: null,
          status: 'ACTIVE',
        },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.bulkWithdrawalRun.create.mockResolvedValue({ id: 'run-1' });
      mockPrisma.withdrawal.create.mockImplementation(({ data }: any) => ({ ...data, id: 'wd-' + data.userId }));

      const result = await service.triggerBulkWithdrawals(adminId);

      // Verify bulk run record
      expect(mockPrisma.bulkWithdrawalRun.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          adminId,
          totalAmount: new Prisma.Decimal(16000),
          userCount: 2,
        }),
      }));

      // Verify individual withdrawals
      expect(mockPrisma.withdrawal.create).toHaveBeenCalledTimes(2);
      
      // Check User 1 (10000 - 100 = 9900)
      expect(mockPrisma.withdrawal.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user1',
          amount: new Prisma.Decimal(10000),
          fee: new Prisma.Decimal(100),
          netAmount: new Prisma.Decimal(9900),
        }),
      }));

      // Verify balance deduction
      expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'user1' },
        data: { pendingEarnings: { decrement: 10000 }, totalEarnings: { increment: 0 } },
      }));

      // Verify Paystack transfer
      expect(mockPaystackService.initiateTransfer).toHaveBeenCalledWith(10000, 'sub1', expect.stringContaining('WD-BULK'));

      // Verify transaction log
      expect(mockTransactionsService.createWithTx).toHaveBeenCalledWith(expect.anything(), 'user1', 'WITHDRAWAL', 10000, expect.any(String));

      expect(result.successCount).toBe(2);
      expect(result.totalAmount).toBe(16000);
    });

    it('should skip users whose balance after fee would be zero or less', async () => {
      mockSettingsService.getSettings.mockResolvedValue({
        minWithdrawal: new Prisma.Decimal(100),
        withdrawalFee: new Prisma.Decimal(100),
      });

      const mockUsers = [
        {
          id: 'user_poor',
          fullName: 'Poor User',
          bankName: 'Bank A',
          accountNumber: '123',
          pendingEarnings: new Prisma.Decimal(100), // Exact fee amount
          kycStatus: KycStatus.VERIFIED,
          status: 'ACTIVE',
        },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.bulkWithdrawalRun.create.mockResolvedValue({ id: 'run-2' });

      const result = await service.triggerBulkWithdrawals(adminId);

      expect(result.successCount).toBe(0);
      expect(mockPrisma.withdrawal.create).not.toHaveBeenCalled();
    });

    it('should return 0 count if no eligible users found', async () => {
      mockSettingsService.getSettings.mockResolvedValue({
        minWithdrawal: new Prisma.Decimal(5000),
      });
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.triggerBulkWithdrawals(adminId);

      expect(result.count).toBe(0);
      expect(mockPrisma.bulkWithdrawalRun.create).not.toHaveBeenCalled();
    });

    it('should handle partial failures and update run status', async () => {
      mockSettingsService.getSettings.mockResolvedValue({
        minWithdrawal: new Prisma.Decimal(5000),
        withdrawalFee: new Prisma.Decimal(0),
      });

      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user1', pendingEarnings: new Prisma.Decimal(5000), bankName: 'B1', accountNumber: 'A1', kycStatus: KycStatus.VERIFIED, status: 'ACTIVE' },
        { id: 'user2', pendingEarnings: new Prisma.Decimal(5000), bankName: 'B2', accountNumber: 'A2', kycStatus: KycStatus.VERIFIED, status: 'ACTIVE' },
      ]);
      mockPrisma.bulkWithdrawalRun.create.mockResolvedValue({ id: 'run-3' });

      // Succeed for user1, fail for user2
      mockPrisma.withdrawal.create
        .mockResolvedValueOnce({ id: 'wd1' })
        .mockRejectedValueOnce(new Error('DB Error'));

      const result = await service.triggerBulkWithdrawals(adminId);

      expect(result.successCount).toBe(1);
      expect(result.failCount).toBe(1);
      expect(mockPrisma.bulkWithdrawalRun.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'run-3' },
        data: { status: 'PARTIAL' },
      }));
    });
  });
});
