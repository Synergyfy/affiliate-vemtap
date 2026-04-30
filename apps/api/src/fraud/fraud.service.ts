import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FraudStatus } from '@prisma/client';

@Injectable()
export class FraudService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(pagination: { skip?: number; take?: number }) {
    const [data, total] = await Promise.all([
      this.prisma.fraudAlert.findMany({
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fraudAlert.count(),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    const alert = await this.prisma.fraudAlert.findUnique({
      where: { id },
    });
    if (!alert) throw new NotFoundException('Fraud alert not found');
    return alert;
  }

  async updateStatus(id: string, status: FraudStatus, resolution?: string, adminId?: string) {
    const alert = await this.prisma.fraudAlert.findUnique({
      where: { id },
    });
    if (!alert) throw new NotFoundException('Fraud alert not found');

    return this.prisma.fraudAlert.update({
      where: { id },
      data: {
        status,
        resolution,
        resolvedAt: status === 'RESOLVED' || status === 'FALSE_POSITIVE' ? new Date() : undefined,
        resolvedBy: adminId,
      },
    });
  }
}
