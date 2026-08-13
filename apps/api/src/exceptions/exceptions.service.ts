import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExceptionStatus } from '@prisma/client';
import { CreateExceptionDto, ReviewExceptionDto } from './dto/exceptions.dto';

@Injectable()
export class ExceptionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateExceptionDto) {
    return this.prisma.exceptionReport.create({
      data: {
        userId,
        type: dto.type,
        description: dto.description,
        workSessionId: dto.workSessionId,
        leadId: dto.leadId,
        status: ExceptionStatus.PENDING,
      },
    });
  }

  async getMyExceptions(
    userId: string,
    filters: { take?: number; skip?: number; status?: string },
  ) {
    const where: any = { userId };
    if (filters.status) {
      const status = (filters.status as string).toUpperCase();
      if (['PENDING', 'VALID', 'INVALID'].includes(status)) {
        where.status = status as ExceptionStatus;
      }
    }
    const [data, total] = await Promise.all([
      this.prisma.exceptionReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      this.prisma.exceptionReport.count({ where }),
    ]);
    return { data, total };
  }

  async getStats(userId: string) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const [pending, valid, invalid, today] = await Promise.all([
      this.prisma.exceptionReport.count({
        where: { userId, status: ExceptionStatus.PENDING },
      }),
      this.prisma.exceptionReport.count({
        where: { userId, status: ExceptionStatus.VALID },
      }),
      this.prisma.exceptionReport.count({
        where: { userId, status: ExceptionStatus.INVALID },
      }),
      this.prisma.exceptionReport.count({
        where: { userId, createdAt: { gte: since } },
      }),
    ]);
    return { pending, valid, invalid, today };
  }

  // ---- Admin ----

  async getAll(filters: { take?: number; skip?: number; status?: string; userId?: string }) {
    const where: any = {};
    if (filters.status) {
      const status = (filters.status as string).toUpperCase();
      if (['PENDING', 'VALID', 'INVALID'].includes(status)) {
        where.status = status as ExceptionStatus;
      }
    }
    if (filters.userId) where.userId = filters.userId;

    const [data, total] = await Promise.all([
      this.prisma.exceptionReport.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, role: true } },
          reviewer: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      this.prisma.exceptionReport.count({ where }),
    ]);
    return { data, total };
  }

  async review(id: string, adminId: string, dto: ReviewExceptionDto) {
    const existing = await this.prisma.exceptionReport.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Exception not found');

    return this.prisma.exceptionReport.update({
      where: { id },
      data: {
        status: dto.status === 'VALID' ? ExceptionStatus.VALID : ExceptionStatus.INVALID,
        reviewedBy: adminId,
        reviewComment: dto.reviewComment,
        reviewedAt: new Date(),
      },
    });
  }

  async getStatsOverview() {
    const [pending, valid, invalid, total] = await Promise.all([
      this.prisma.exceptionReport.count({ where: { status: ExceptionStatus.PENDING } }),
      this.prisma.exceptionReport.count({ where: { status: ExceptionStatus.VALID } }),
      this.prisma.exceptionReport.count({ where: { status: ExceptionStatus.INVALID } }),
      this.prisma.exceptionReport.count(),
    ]);
    return { pending, valid, invalid, total };
  }

  async countByType(): Promise<Record<string, number>> {
    const rows = await this.prisma.exceptionReport.groupBy({
      by: ['type'],
      _count: { _all: true },
    });
    return rows.reduce(
      (acc, row) => {
        acc[row.type] = row._count._all;
        return acc;
      },
      {} as Record<string, number>,
    );
  }
}
