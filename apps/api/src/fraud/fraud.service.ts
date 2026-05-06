import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FraudStatus, Severity, FraudType } from '@prisma/client';

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAlert(data: { userId: string; type: FraudType; severity: Severity; description: string; evidence?: Record<string, any> }) {
    return this.prisma.fraudAlert.create({
      data,
    });
  }

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

    // Automated Suspension Hook
    if (status === 'CONFIRMED' && alert.severity === 'CRITICAL') {
      await this.prisma.user.update({
        where: { id: alert.userId },
        data: { status: 'SUSPENDED' },
      });
      this.logger.warn(`User ${alert.userId} automatically SUSPENDED due to confirmed CRITICAL fraud alert ${id}`);
    }

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
