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

  async findAll(pagination: { 
    skip?: number; 
    take?: number; 
    status?: FraudStatus; 
    severity?: Severity; 
    userId?: string; 
    search?: string; 
  }) {
    const where: any = {};
    if (pagination.status) where.status = pagination.status;
    if (pagination.severity) where.severity = pagination.severity;
    if (pagination.userId) where.userId = pagination.userId;
    if (pagination.search) {
      where.OR = [
        { description: { contains: pagination.search, mode: 'insensitive' } },
        { user: { fullName: { contains: pagination.search, mode: 'insensitive' } } },
        { user: { email: { contains: pagination.search, mode: 'insensitive' } } }
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.fraudAlert.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        include: {
          user: {
            select: { id: true, fullName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fraudAlert.count({ where }),
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

  async getGlobalStats() {
    const [highRisk, pendingReview, total, settings] = await Promise.all([
      this.prisma.fraudAlert.count({ where: { severity: { in: [Severity.HIGH, Severity.CRITICAL] } } }),
      this.prisma.fraudAlert.count({ where: { status: { in: [FraudStatus.OPEN, FraudStatus.UNDER_REVIEW] } } }),
      this.prisma.fraudAlert.count(),
      this.prisma.platformSettings.findFirst(),
    ]);

    return {
      highRiskAlerts: highRisk,
      pendingReview: pendingReview,
      totalAlerts: total,
      globalGuardActive: settings?.fraudGuardActive ?? false,
    };
  }

  async getGuardStatus() {
    const settings = await this.prisma.platformSettings.findFirst();
    return {
      globalGuardActive: settings?.fraudGuardActive ?? false,
      fraudThresholdScore: settings?.fraudThresholdScore || 80,
    };
  }

  async updateGuardStatus(thresholdScore: number) {
    const settings = await this.prisma.platformSettings.findFirst();
    if (settings) {
      return this.prisma.platformSettings.update({
        where: { id: settings.id },
        data: { fraudThresholdScore: thresholdScore },
      });
    }
    return this.prisma.platformSettings.create({
      data: { fraudThresholdScore: thresholdScore },
    });
  }
}

