import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, type: TransactionType, amount: number, description: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const balanceAfter = Number(user.pendingEarnings);

    return this.prisma.transaction.create({
      data: {
        userId,
        type,
        amount,
        balanceAfter,
        description,
        reference: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      },
    });
  }
}
