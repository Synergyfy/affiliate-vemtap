import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../prisma/audit.service';
import { StartWorkDto } from './dto/start-work.dto';
import { EndWorkDto } from './dto/end-work.dto';
import { Role, WorkSessionStatus, GpsEventType, GpsStatus } from '@prisma/client';

@Injectable()
export class SalesWorkSessionService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private validateSalesExecutiveRole(userRole: Role): void {
    if (userRole !== Role.SALES_EXECUTIVE) {
      throw new ForbiddenException('Only Sales Executives can access work sessions');
    }
  }

  async startWork(userId: string, userRole: Role, dto: StartWorkDto, ip?: string) {
    this.validateSalesExecutiveRole(userRole);

    const activeSession = await this.prisma.salesWorkSession.findFirst({
      where: {
        userId,
        status: WorkSessionStatus.ACTIVE,
      },
    });

    if (activeSession) {
      throw new ConflictException(
        'You already have an active work session. Please end it before starting a new one.',
      );
    }

    const gpsStatus = (dto.gpsStatus as GpsStatus) || GpsStatus.UNKNOWN;

    const session = await this.prisma.salesWorkSession.create({
      data: {
        userId,
        startLatitude: dto.latitude ?? null,
        startLongitude: dto.longitude ?? null,
        startAccuracy: dto.accuracy ?? null,
        startGpsStatus: gpsStatus,
        notes: dto.notes ?? null,
        status: WorkSessionStatus.ACTIVE,
      },
    });

    if (dto.latitude != null && dto.longitude != null) {
      await this.prisma.gpsEvent.create({
        data: {
          sessionId: session.id,
          latitude: dto.latitude,
          longitude: dto.longitude,
          accuracy: dto.accuracy ?? null,
          eventType: GpsEventType.START,
          source: 'browser',
        },
      });
    }

    await this.auditService.log({
      userId,
      action: 'WORK_SESSION_START',
      entity: 'SalesWorkSession',
      entityId: session.id,
      newValue: {
        startedAt: session.startedAt,
        gpsStatus,
        hasGps: dto.latitude != null,
      },
      ipAddress: ip,
    });

    return {
      id: session.id,
      startedAt: session.startedAt,
      status: session.status,
      gpsStatus,
      hasGps: dto.latitude != null,
    };
  }

  async endWork(userId: string, userRole: Role, dto: EndWorkDto, ip?: string) {
    this.validateSalesExecutiveRole(userRole);

    const activeSession = await this.prisma.salesWorkSession.findFirst({
      where: {
        userId,
        status: WorkSessionStatus.ACTIVE,
      },
    });

    if (!activeSession) {
      throw new NotFoundException('No active work session found. Please start a work session first.');
    }

    const now = new Date();
    const gpsStatus = (dto.gpsStatus as GpsStatus) || GpsStatus.UNKNOWN;

    const session = await this.prisma.salesWorkSession.update({
      where: { id: activeSession.id },
      data: {
        endedAt: now,
        endLatitude: dto.latitude ?? null,
        endLongitude: dto.longitude ?? null,
        endAccuracy: dto.accuracy ?? null,
        endGpsStatus: gpsStatus,
        status: WorkSessionStatus.COMPLETED,
        notes: dto.notes
          ? activeSession.notes
            ? `${activeSession.notes}\n---\n${dto.notes}`
            : dto.notes
          : activeSession.notes,
      },
    });

    if (dto.latitude != null && dto.longitude != null) {
      await this.prisma.gpsEvent.create({
        data: {
          sessionId: session.id,
          latitude: dto.latitude,
          longitude: dto.longitude,
          accuracy: dto.accuracy ?? null,
          eventType: GpsEventType.END,
          source: 'browser',
        },
      });
    }

    const durationMs = now.getTime() - activeSession.startedAt.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    await this.auditService.log({
      userId,
      action: 'WORK_SESSION_END',
      entity: 'SalesWorkSession',
      entityId: session.id,
      oldValue: { startedAt: activeSession.startedAt },
      newValue: {
        endedAt: now,
        durationMinutes,
        gpsStatus,
        hasGps: dto.latitude != null,
      },
      ipAddress: ip,
    });

    return {
      id: session.id,
      startedAt: activeSession.startedAt,
      endedAt: now,
      durationMinutes,
      status: session.status,
      gpsStatus,
      hasGps: dto.latitude != null,
    };
  }

  async getActiveSession(userId: string, userRole: Role) {
    this.validateSalesExecutiveRole(userRole);

    const session = await this.prisma.salesWorkSession.findFirst({
      where: {
        userId,
        status: WorkSessionStatus.ACTIVE,
      },
      include: {
        gpsEvents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!session) {
      return null;
    }

    const now = new Date();
    const durationMs = now.getTime() - session.startedAt.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    return {
      id: session.id,
      startedAt: session.startedAt,
      durationMinutes,
      status: session.status,
      startLatitude: session.startLatitude,
      startLongitude: session.startLongitude,
      startGpsStatus: session.startGpsStatus,
      notes: session.notes,
      gpsEventCount: session.gpsEvents.length,
    };
  }

  async getSessionHistory(userId: string, userRole: Role, page = 1, limit = 20) {
    this.validateSalesExecutiveRole(userRole);

    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.salesWorkSession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.salesWorkSession.count({
        where: { userId },
      }),
    ]);

    return {
      sessions: sessions.map((s) => {
        const durationMs = s.endedAt
          ? s.endedAt.getTime() - s.startedAt.getTime()
          : null;
        return {
          id: s.id,
          startedAt: s.startedAt,
          endedAt: s.endedAt,
          durationMinutes: durationMs != null ? Math.round(durationMs / 60000) : null,
          status: s.status,
          startGpsStatus: s.startGpsStatus,
          endGpsStatus: s.endGpsStatus,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
