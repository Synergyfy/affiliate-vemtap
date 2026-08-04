import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommissionStatus } from '@prisma/client';

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, pagination: { skip?: number; take?: number; status?: CommissionStatus; search?: string }) {
    const where: any = { userId };
    if (pagination.status) {
      where.status = pagination.status;
    }
    if (pagination.search) {
      where.OR = [
        { business: { businessName: { contains: pagination.search, mode: 'insensitive' } } },
        { description: { contains: pagination.search, mode: 'insensitive' } }
      ];
    }

    const [commissions, total, settings] = await Promise.all([
      this.prisma.commission.findMany({
        where,
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
      this.prisma.commission.count({ where }),
      this.prisma.platformSettings.findFirst(),
    ]);

    const totalMonths = settings?.earningDurationMonths || settings?.recurringDurationMonths || 12;

    const data = commissions.map(c => {
      if (c.business) {
        const { _count, ...restBusiness } = c.business;
        return {
          ...c,
          business: {
            ...restBusiness,
            paidMonths: _count?.commissions || 0,
            totalMonths,
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

  async findAllAdmin(pagination: { skip?: number; take?: number; status?: CommissionStatus; userId?: string; search?: string }) {
    const where: any = {};
    if (pagination.status) where.status = pagination.status;
    if (pagination.userId) where.userId = pagination.userId;
    if (pagination.search) {
      where.OR = [
        { user: { fullName: { contains: pagination.search, mode: 'insensitive' } } },
        { user: { email: { contains: pagination.search, mode: 'insensitive' } } },
        { business: { businessName: { contains: pagination.search, mode: 'insensitive' } } }
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
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
      this.prisma.commission.count({ where }),
    ]);
    return { data, total };
  }

  async updateStatus(id: string, data: { status: CommissionStatus }) {
    return this.prisma.commission.update({
      where: { id },
      data: { status: data.status },
    });
  }

  async getGlobalStats() {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

    const [totalAgg, paidAgg, pendingAgg, prevTotalAgg, prevPaidAgg, prevPendingAgg] = await Promise.all([
      this.prisma.commission.aggregate({ _sum: { amount: true }, _count: { id: true } }),
      this.prisma.commission.aggregate({ where: { status: 'PAID' }, _sum: { amount: true }, _count: { id: true } }),
      this.prisma.commission.aggregate({ where: { status: 'PENDING' }, _sum: { amount: true }, _count: { id: true } }),
      this.prisma.commission.aggregate({
        where: { createdAt: { gte: twoMonthsAgo, lt: monthAgo } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.commission.aggregate({
        where: { status: 'PAID', createdAt: { gte: twoMonthsAgo, lt: monthAgo } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      this.prisma.commission.aggregate({
        where: { status: 'PENDING', createdAt: { gte: twoMonthsAgo, lt: monthAgo } },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const pctChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      totalCommissions: totalAgg._count.id,
      totalAmount: Number(totalAgg._sum.amount || 0),
      paidCount: paidAgg._count.id,
      paidAmount: Number(paidAgg._sum.amount || 0),
      pendingCount: pendingAgg._count.id,
      pendingAmount: Number(pendingAgg._sum.amount || 0),
      trends: {
        totalChangePercent: pctChange(totalAgg._count.id, prevTotalAgg._count.id),
        paidChangePercent: pctChange(paidAgg._count.id, prevPaidAgg._count.id),
        pendingChangePercent: pctChange(pendingAgg._count.id, prevPendingAgg._count.id),
      },
    };
  }

  async exportCsv() {
    const commissions = await this.prisma.commission.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        business: { select: { businessName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const escapeCsv = (val?: string) => `"${(val || '').replace(/"/g, '""')}"`;
    const header = 'ID,Affiliate Name,Affiliate Email,Business Source,Amount,Type,Status,Date\n';
    const rows = commissions.map(c =>
      [
        c.id,
        escapeCsv(c.user?.fullName),
        escapeCsv(c.user?.email),
        escapeCsv(c.business?.businessName),
        c.amount,
        c.type,
        c.status,
        c.createdAt.toISOString(),
      ].join(',')
    ).join('\n');

    return header + rows;
  }
}

