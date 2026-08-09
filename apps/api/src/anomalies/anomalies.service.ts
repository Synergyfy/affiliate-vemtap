import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnomalyStatus, AnomalyType } from '@prisma/client';
import { UpdateAnomalyDto } from './dto/anomalies.dto';

@Injectable()
export class AnomaliesService {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    type: AnomalyType,
    description: string,
    evidence?: any,
  ) {
    return this.prisma.activityAnomaly.create({
      data: { userId, type, description, evidence: evidence ?? undefined },
    });
  }

  async getMyAnomalies(userId: string) {
    return this.prisma.activityAnomaly.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getAll(filters: { take?: number; skip?: number; status?: string; userId?: string }) {
    const where: any = {};
    if (filters.status) {
      const status = (filters.status as string).toUpperCase();
      if (['OPEN', 'ACKNOWLEDGED', 'DISMISSED'].includes(status)) {
        where.status = status as AnomalyStatus;
      }
    }
    if (filters.userId) where.userId = filters.userId;

    const [data, total] = await Promise.all([
      this.prisma.activityAnomaly.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      this.prisma.activityAnomaly.count({ where }),
    ]);
    return { data, total };
  }

  async updateStatus(id: string, dto: UpdateAnomalyDto) {
    const existing = await this.prisma.activityAnomaly.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Anomaly not found');

    return this.prisma.activityAnomaly.update({
      where: { id },
      data: {
        status: dto.status ?? existing.status,
        resolution: dto.resolution ?? existing.resolution,
      },
    });
  }

  async getOverview() {
    const [open, acknowledged, dismissed, total] = await Promise.all([
      this.prisma.activityAnomaly.count({ where: { status: AnomalyStatus.OPEN } }),
      this.prisma.activityAnomaly.count({ where: { status: AnomalyStatus.ACKNOWLEDGED } }),
      this.prisma.activityAnomaly.count({ where: { status: AnomalyStatus.DISMISSED } }),
      this.prisma.activityAnomaly.count(),
    ]);
    return { open, acknowledged, dismissed, total };
  }
}
