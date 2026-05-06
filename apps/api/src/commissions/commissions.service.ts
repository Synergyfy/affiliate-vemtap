import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionStatus } from '@prisma/client';

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, pagination: { skip?: number; take?: number }) {
    const [commissions, total] = await Promise.all([
      this.prisma.commission.findMany({
        where: { userId },
        skip: pagination.skip,
        take: pagination.take,
        include: {
          business: {
            select: {
              id: true,
              businessName: true,
              planType: true,
              status: true,
              createdAt: true,
              _count: {
                select: { commissions: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commission.count({ where: { userId } }),
    ]);

    const data = commissions.map(c => {
      if (c.business) {
        const { _count, ...restBusiness } = c.business;
        return {
          ...c,
          business: {
            ...restBusiness,
            paidMonths: _count?.commissions || 0,
            totalMonths: 12, // Placeholder for total subscription duration
          },
        };
      }
      return c;
    });

    return { data, total };
  }

  async getStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalEarnings: true,
        pendingEarnings: true,
      },
    });

    const totalCount = await this.prisma.commission.count({
      where: { userId },
    });

    return {
      ...user,
      totalCount,
    };
  }

  async findAllAdmin(pagination: { skip?: number; take?: number }) {
    const [data, total] = await Promise.all([
      this.prisma.commission.findMany({
        skip: pagination.skip,
        take: pagination.take,
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
          business: {
            select: { id: true, businessName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commission.count(),
    ]);
    return { data, total };
  }

  async updateStatus(id: string, data: { status: CommissionStatus }) {
    return this.prisma.commission.update({
      where: { id },
      data: { status: data.status },
    });
  }
}
