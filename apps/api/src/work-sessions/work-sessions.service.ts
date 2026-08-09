import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WorkSessionStatus } from '@prisma/client';
import { StartWorkDto, EndWorkDto } from './dto/work-sessions.dto';

@Injectable()
export class WorkSessionsService {
  constructor(private prisma: PrismaService) {}

  private async getConfig() {
    return this.prisma.performanceConfig.findFirst();
  }

  private parseTime(value: string | undefined | null): number {
    if (!value) return 9 * 60;
    const [h, m] = value.split(':').map((n) => parseInt(n, 10));
    if (isNaN(h)) return 9 * 60;
    return h * 60 + (isNaN(m) ? 0 : m);
  }

  async startWork(userId: string, dto: StartWorkDto) {
    const config = await this.getConfig();

    const existing = await this.prisma.workSession.findFirst({
      where: { userId, status: WorkSessionStatus.ACTIVE },
    });
    if (existing) {
      throw new BadRequestException('You already have an active work session');
    }

    const now = new Date();
    const startMinutes = now.getHours() * 60 + now.getMinutes();
    const expected = this.parseTime(config?.expectedWorkStart);
    const grace = config?.lateStartGraceMinutes ?? 15;
    const lateStart = startMinutes > expected + grace;

    const session = await this.prisma.workSession.create({
      data: {
        userId,
        startTime: now,
        gpsStartLat: dto.gpsLat ?? null,
        gpsStartLng: dto.gpsLng ?? null,
        device: dto.device ?? null,
        territoryId: dto.territoryId ?? null,
        status: WorkSessionStatus.ACTIVE,
        lateStart,
        expectedStart: config?.expectedWorkStart ?? '09:00',
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { expectedWorkStart: config?.expectedWorkStart ?? '09:00' },
    });

    return {
      ...session,
      lateStart,
      expectedStart: config?.expectedWorkStart ?? '09:00',
      message: lateStart
        ? 'Late start detected. You can provide an explanation via Exceptions.'
        : 'Work session started',
    };
  }

  async endWork(userId: string, dto: EndWorkDto) {
    const existing = await this.prisma.workSession.findFirst({
      where: { userId, status: WorkSessionStatus.ACTIVE },
    });
    if (!existing) {
      throw new NotFoundException('No active work session found');
    }

    return this.prisma.workSession.update({
      where: { id: existing.id },
      data: {
        status: WorkSessionStatus.ENDED,
        endTime: new Date(),
        gpsEndLat: dto.gpsLat ?? existing.gpsEndLat,
        gpsEndLng: dto.gpsLng ?? existing.gpsEndLng,
        endComment: dto.endComment ?? null,
      },
    });
  }

  async getActiveSession(userId: string) {
    return this.prisma.workSession.findFirst({
      where: { userId, status: WorkSessionStatus.ACTIVE },
    });
  }

  async getMySessions(userId: string, filters: { take?: number; skip?: number }) {
    const [data, total] = await Promise.all([
      this.prisma.workSession.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' },
        take: filters.take,
        skip: filters.skip,
      }),
      this.prisma.workSession.count({ where: { userId } }),
    ]);
    return { data, total };
  }

  async getTodayStatus(userId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const session = await this.prisma.workSession.findFirst({
      where: { userId, startTime: { gte: start, lte: end } },
      orderBy: { startTime: 'desc' },
    });

    return {
      startedWork: !!session,
      active: session?.status === WorkSessionStatus.ACTIVE,
      startedAt: session?.startTime ?? null,
      endedAt: session?.endTime ?? null,
      lateStart: session?.lateStart ?? false,
      expectedStart: session?.expectedStart ?? '09:00',
    };
  }

  // ---- Admin ----

  async getTodaySessions() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const sessions = await this.prisma.workSession.findMany({
      where: { startTime: { gte: start, lte: end } },
      include: { user: { select: { id: true, fullName: true, avatar: true, role: true } } },
      orderBy: { startTime: 'asc' },
    });

    const users = await this.prisma.user.findMany({
      where: { role: 'SALES_EXECUTIVE' },
      select: { id: true, fullName: true, avatar: true },
    });

    const byUser = new Map(sessions.map((s) => [s.userId, s]));
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);

    const config = await this.getConfig();
    const expected = this.parseTime(config?.expectedWorkStart ?? '09:00');

    return {
      date: todayKey,
      config: {
        expectedWorkStart: config?.expectedWorkStart ?? '09:00',
        expectedWorkEnd: config?.expectedWorkEnd ?? '17:00',
      },
      team: users.map((u) => {
        const session = byUser.get(u.id);
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const notStarted =
          !session && nowMinutes > expected + (config?.lateStartGraceMinutes ?? 15);
        return {
          userId: u.id,
          fullName: u.fullName,
          avatar: u.avatar,
          status: session ? (session.status === WorkSessionStatus.ACTIVE ? 'WORKING' : 'ENDED') : 'NOT_STARTED',
          startedAt: session?.startTime ?? null,
          endedAt: session?.endTime ?? null,
          lateStart: session?.lateStart ?? false,
          territoryId: session?.territoryId ?? null,
          notStarted,
        };
      }),
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async autoEndStaleSessions() {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 2);
    await this.prisma.workSession.updateMany({
      where: { status: WorkSessionStatus.ACTIVE, startTime: { lt: cutoff } },
      data: { status: WorkSessionStatus.AUTO_ENDED, endTime: cutoff },
    });
  }
}
