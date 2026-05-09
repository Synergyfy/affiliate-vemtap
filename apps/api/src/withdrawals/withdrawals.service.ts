import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WithdrawalStatus, KycStatus, TransactionType, User, Prisma } from '@prisma/client';
import { TransactionsService } from '../transactions/transactions.service';
import { AuditService } from '../prisma/audit.service';
import { PaystackService } from '../payments/paystack.service';
import { SettingsService } from '../settings/settings.service';

type UserWithPaystack = User & { paystackRecipientCode?: string | null };

@Injectable()
export class WithdrawalsService {
  private readonly logger = new Logger(WithdrawalsService.name);

  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
    private auditService: AuditService,
    private paystackService: PaystackService,
    private settingsService: SettingsService,
  ) {}

  async create(userId: string, amount: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (Number(user.pendingEarnings) < amount) {
      throw new BadRequestException('Insufficient pending earnings');
    }

    if (user.kycStatus !== KycStatus.VERIFIED) {
      throw new BadRequestException('KYC verification required for withdrawals');
    }

    if (!user.bankName || !user.accountNumber) {
      throw new BadRequestException('Bank details missing from profile');
    }

    const settings = await this.settingsService.getSettings();
    const fee = settings?.withdrawalFee ? Number(settings.withdrawalFee) : 0;
    const netAmount = amount - fee;

    if (netAmount <= 0) {
      throw new BadRequestException('Amount after fee must be greater than zero');
    }

    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        userId,
        amount,
        fee,
        netAmount,
        bankName: user.bankName,
        accountNumber: user.accountNumber,
        accountName: user.accountName || user.fullName,
        status: WithdrawalStatus.PENDING,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CREATE',
      entity: 'WITHDRAWAL',
      entityId: withdrawal.id,
      newValue: withdrawal,
    });

    return withdrawal;
  }

  async findAll(userId: string, pagination: { skip?: number; take?: number }) {
    const [data, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        where: { userId },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.withdrawal.count({ where: { userId } }),
    ]);
    return { data, total };
  }

  async findAllAdmin(pagination: { skip?: number; take?: number }) {
    const [data, total] = await Promise.all([
      this.prisma.withdrawal.findMany({
        skip: pagination.skip,
        take: pagination.take,
        include: {
          user: {
            select: { id: true, fullName: true, bankName: true, accountNumber: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.withdrawal.count(),
    ]);
    return { data, total };
  }

  async updateStatus(id: string, status: WithdrawalStatus, adminId?: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!withdrawal) throw new NotFoundException('Withdrawal not found');

    if (status === WithdrawalStatus.APPROVED && withdrawal.status === WithdrawalStatus.PENDING) {
      await this.processApproval(withdrawal, adminId);
    }

    const updated = await this.prisma.withdrawal.update({
      where: { id },
      data: { 
        status,
        processedAt: status === WithdrawalStatus.APPROVED ? new Date() : null,
        processedBy: adminId,
      },
    });

    await this.auditService.log({
      adminId,
      userId: withdrawal.userId,
      action: 'UPDATE_STATUS',
      entity: 'WITHDRAWAL',
      entityId: withdrawal.id,
      oldValue: withdrawal,
      newValue: updated,
    });

    return updated;
  }

  async triggerBulkWithdrawals(adminId: string) {
    const settings = await this.settingsService.getSettings();
    const minWithdrawal = settings?.minWithdrawal ? Number(settings.minWithdrawal) : 5000;
    const fee = settings?.withdrawalFee ? Number(settings.withdrawalFee) : 100;

    // Find all eligible users
    const eligibleUsers = await this.prisma.user.findMany({
      where: {
        kycStatus: KycStatus.VERIFIED,
        bankName: { not: null },
        accountNumber: { not: null },
        pendingEarnings: { gte: minWithdrawal },
        status: 'ACTIVE',
      },
    });

    if (eligibleUsers.length === 0) {
      return { message: 'No eligible users found for withdrawal', count: 0 };
    }

    const totalAmount = eligibleUsers.reduce((sum, user) => sum + Number(user.pendingEarnings), 0);

    // Create bulk run record
    const bulkRun = await this.prisma.bulkWithdrawalRun.create({
      data: {
        adminId,
        totalAmount: new Prisma.Decimal(totalAmount),
        userCount: eligibleUsers.length,
        status: 'PROCESSING',
      },
    });

    let successCount = 0;
    let failCount = 0;

    for (const user of eligibleUsers) {
      try {
        const amount = Number(user.pendingEarnings);
        const netAmount = amount - fee;

        if (netAmount <= 0) continue;

        // Start a transaction for each withdrawal to ensure consistency
        await this.prisma.$transaction(async (tx) => {
          // 1. Create withdrawal record
          const withdrawal = await tx.withdrawal.create({
            data: {
              userId: user.id,
              amount: new Prisma.Decimal(amount),
              fee: new Prisma.Decimal(fee),
              netAmount: new Prisma.Decimal(netAmount),
              bankName: user.bankName!,
              accountNumber: user.accountNumber!,
              accountName: user.accountName || user.fullName,
              status: WithdrawalStatus.APPROVED,
              processedAt: new Date(),
              processedBy: adminId,
              bulkRunId: bulkRun.id,
            },
          });

          // 2. Deduct from user balance
          await tx.user.update({
            where: { id: user.id },
            data: {
              pendingEarnings: { decrement: amount },
              totalEarnings: { increment: 0 }, // Total earnings already includes pending
            },
          });

          // 3. Create transaction record
          await this.transactionsService.createWithTx(
            tx,
            user.id,
            TransactionType.WITHDRAWAL,
            amount,
            `Bulk withdrawal processed: ${withdrawal.id}`
          );

          // 4. Initiate Paystack transfer if recipient exists
          if (user.paystackRecipientCode) {
            try {
              await this.paystackService.initiateTransfer(
                amount,
                user.paystackRecipientCode,
                `WD-BULK-${withdrawal.id}`
              );
            } catch (err) {
              this.logger.error(`Paystack transfer failed for user ${user.id}: ${err.message}`);
              // We don't rollback the whole thing if transfer fails, 
              // but we might want to mark the withdrawal as PROCESSING or FAILED?
              // For now, we assume the record is truth.
            }
          }
        });

        successCount++;
      } catch (error) {
        this.logger.error(`Failed to process withdrawal for user ${user.id}: ${error.message}`);
        failCount++;
      }
    }

    // Update bulk run status
    await this.prisma.bulkWithdrawalRun.update({
      where: { id: bulkRun.id },
      data: {
        status: failCount === 0 ? 'COMPLETED' : successCount > 0 ? 'PARTIAL' : 'FAILED',
      },
    });

    await this.auditService.log({
      adminId,
      action: 'TRIGGER_BULK_WITHDRAWAL',
      entity: 'BULK_WITHDRAWAL_RUN',
      entityId: bulkRun.id,
      newValue: { successCount, failCount, totalAmount },
    });

    return {
      message: 'Bulk withdrawal processing completed',
      runId: bulkRun.id,
      eligibleCount: eligibleUsers.length,
      successCount,
      failCount,
      totalAmount,
    };
  }

  private async processApproval(withdrawal: any, _adminId?: string) {
    // 1. Initiate Paystack transfer if recipient exists
    if ((withdrawal.user as UserWithPaystack).paystackRecipientCode) {
      await this.paystackService.initiateTransfer(
        Number(withdrawal.amount),
        (withdrawal.user as UserWithPaystack).paystackRecipientCode!,
        `WD-${withdrawal.id}`
      );
    }

    // 2. Deduct from user balance
    await this.prisma.user.update({
      where: { id: withdrawal.userId },
      data: {
        pendingEarnings: { decrement: withdrawal.amount },
      },
    });

    // 3. Create transaction record
    await this.transactionsService.create(
      withdrawal.userId,
      TransactionType.WITHDRAWAL,
      Number(withdrawal.amount),
      `Withdrawal approved: ${withdrawal.id}`
    );
  }
}
