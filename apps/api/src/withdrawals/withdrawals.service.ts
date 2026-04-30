import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WithdrawalStatus, KycStatus, TransactionType, User } from '@prisma/client';
import { TransactionsService } from '../transactions/transactions.service';
import { AuditService } from '../prisma/audit.service';
import { PaystackService } from '../payments/paystack.service';

type UserWithPaystack = User & { paystackSubaccountId?: string | null };

@Injectable()
export class WithdrawalsService {
  constructor(
    private prisma: PrismaService,
    private transactionsService: TransactionsService,
    private auditService: AuditService,
    private paystackService: PaystackService,
  ) {}

  async create(userId: string, amount: number) {
    // ... same as before
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

    const fee = 0; // Future: implement fee calculation
    const netAmount = amount - fee;

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
      // 1. Initiate Paystack transfer if subaccount exists
      if ((withdrawal.user as UserWithPaystack).paystackSubaccountId) {
        await this.paystackService.initiateTransfer(
          Number(withdrawal.amount),
          (withdrawal.user as UserWithPaystack).paystackSubaccountId!,
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
}
