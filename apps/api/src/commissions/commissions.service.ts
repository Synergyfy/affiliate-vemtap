import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, pagination: { skip?: number; take?: number }) {
    const [data, total] = await Promise.all([
      this.prisma.commission.findMany({
        where: { userId },
        skip: pagination.skip,
        take: pagination.take,
        include: {
          business: {
            select: {
              businessName: true,
              planType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commission.count({ where: { userId } }),
    ]);
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

  async updateStatus(id: string, data: any) {
    return this.prisma.commission.update({
      where: { id },
      data: { status: data.status },
    });
  }
}
