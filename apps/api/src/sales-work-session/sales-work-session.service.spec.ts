import { Test, TestingModule } from '@nestjs/testing';
import { SalesWorkSessionService } from './sales-work-session.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../prisma/audit.service';
import { Role, WorkSessionStatus, GpsStatus } from '@prisma/client';
import { StartWorkDto } from './dto/start-work.dto';
import { EndWorkDto } from './dto/end-work.dto';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('SalesWorkSessionService', () => {
  let service: SalesWorkSessionService;
  let _prisma: PrismaService;
  let _auditService: AuditService;

  const mockPrisma = {
    salesWorkSession: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    gpsEvent: {
      create: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockUserId = 'user-123';
  const mockSessionId = 'session-456';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesWorkSessionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<SalesWorkSessionService>(SalesWorkSessionService);
    prisma = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  describe('validateSalesExecutiveRole', () => {
    it('should throw ForbiddenException for non-SALES_EXECUTIVE roles', async () => {
      const roles: Role[] = [
        Role.AFFILIATE,
        Role.ADMIN,
        Role.SUPER_ADMIN,
        Role.AGENT,
        Role.SUPERVISOR,
        Role.MANAGER,
      ];

      for (const role of roles) {
        await expect(
          service.startWork(mockUserId, role, { gpsStatus: 'UNKNOWN' }),
        ).rejects.toThrow(ForbiddenException);
      }
    });

    it('should not throw for SALES_EXECUTIVE role', async () => {
      mockPrisma.salesWorkSession.findFirst.mockResolvedValue(null);
      mockPrisma.salesWorkSession.create.mockResolvedValue({
        id: mockSessionId,
        userId: mockUserId,
        startedAt: new Date(),
        startGpsStatus: GpsStatus.UNKNOWN,
        status: WorkSessionStatus.ACTIVE,
      });
      mockAuditService.log.mockResolvedValue({});

      await expect(
        service.startWork(mockUserId, Role.SALES_EXECUTIVE, { gpsStatus: 'UNKNOWN' }),
      ).resolves.not.toThrow();
    });
  });

  describe('startWork', () => {
    const startDto: StartWorkDto = {
      latitude: 6.5244,
      longitude: 3.3792,
      accuracy: 10.5,
      gpsStatus: 'GRANTED',
      notes: 'Starting shift',
    };

    it('should create a new work session for SALES_EXECUTIVE', async () => {
      mockPrisma.salesWorkSession.findFirst.mockResolvedValue(null);
      mockPrisma.salesWorkSession.create.mockResolvedValue({
        id: mockSessionId,
        userId: mockUserId,
        startedAt: new Date('2024-01-15T08:00:00Z'),
        startLatitude: startDto.latitude,
        startLongitude: startDto.longitude,
        startAccuracy: startDto.accuracy,
        startGpsStatus: GpsStatus.GRANTED,
        status: WorkSessionStatus.ACTIVE,
        notes: startDto.notes,
      });
      mockPrisma.gpsEvent.create.mockResolvedValue({});
      mockAuditService.log.mockResolvedValue({});

      const result = await service.startWork(mockUserId, Role.SALES_EXECUTIVE, startDto, '127.0.0.1');

      expect(result).toMatchObject({
        id: mockSessionId,
        status: WorkSessionStatus.ACTIVE,
        gpsStatus: GpsStatus.GRANTED,
        hasGps: true,
      });
      expect(mockPrisma.salesWorkSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUserId,
            startLatitude: startDto.latitude,
            startLongitude: startDto.longitude,
            startAccuracy: startDto.accuracy,
            startGpsStatus: GpsStatus.GRANTED,
            status: WorkSessionStatus.ACTIVE,
            notes: startDto.notes,
          }),
        }),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          action: 'WORK_SESSION_START',
          entity: 'SalesWorkSession',
        }),
      );
    });

    it('should create session without GPS when coordinates not provided', async () => {
      const dtoWithoutGps: StartWorkDto = { gpsStatus: 'UNKNOWN' };
      mockPrisma.salesWorkSession.findFirst.mockResolvedValue(null);
      mockPrisma.salesWorkSession.create.mockResolvedValue({
        id: mockSessionId,
        userId: mockUserId,
        startedAt: new Date(),
        startGpsStatus: GpsStatus.UNKNOWN,
        status: WorkSessionStatus.ACTIVE,
      });
      mockAuditService.log.mockResolvedValue({});

      const result = await service.startWork(mockUserId, Role.SALES_EXECUTIVE, dtoWithoutGps);

      expect(result.hasGps).toBe(false);
      expect(mockPrisma.gpsEvent.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if active session exists', async () => {
      mockPrisma.salesWorkSession.findFirst.mockResolvedValue({
        id: 'existing-session',
        userId: mockUserId,
        status: WorkSessionStatus.ACTIVE,
      });

      await expect(
        service.startWork(mockUserId, Role.SALES_EXECUTIVE, startDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException for non-SALES_EXECUTIVE', async () => {
      await expect(
        service.startWork(mockUserId, Role.AFFILIATE, startDto),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('endWork', () => {
    const endDto: EndWorkDto = {
      latitude: 6.5300,
      longitude: 3.3800,
      accuracy: 8.2,
      gpsStatus: 'GRANTED',
      notes: 'Ending shift',
    };

    const activeSession = {
      id: mockSessionId,
      userId: mockUserId,
      startedAt: new Date('2024-01-15T08:00:00Z'),
      startLatitude: 6.5244,
      startLongitude: 3.3792,
      startAccuracy: 10.5,
      startGpsStatus: GpsStatus.GRANTED,
      status: WorkSessionStatus.ACTIVE,
      notes: 'Starting shift',
    };

    it('should end active work session for SALES_EXECUTIVE', async () => {
      mockPrisma.salesWorkSession.findFirst.mockResolvedValue(activeSession);
      mockPrisma.salesWorkSession.update.mockResolvedValue({
        ...activeSession,
        endedAt: new Date('2024-01-15T17:00:00Z'),
        endLatitude: endDto.latitude,
        endLongitude: endDto.longitude,
        endAccuracy: endDto.accuracy,
        endGpsStatus: GpsStatus.GRANTED,
        status: WorkSessionStatus.COMPLETED,
        notes: `${activeSession.notes}\n---\n${endDto.notes}`,
      });
      mockPrisma.gpsEvent.create.mockResolvedValue({});
      mockAuditService.log.mockResolvedValue({});

      const result = await service.endWork(mockUserId, Role.SALES_EXECUTIVE, endDto, '127.0.0.1');

      expect(result).toMatchObject({
        id: mockSessionId,
        status: WorkSessionStatus.COMPLETED,
        gpsStatus: GpsStatus.GRANTED,
        hasGps: true,
        durationMinutes: expect.any(Number),
      });
      expect(result.durationMinutes).toBeGreaterThan(0);
      expect(mockPrisma.salesWorkSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockSessionId },
          data: expect.objectContaining({
            endedAt: expect.any(Date),
            status: WorkSessionStatus.COMPLETED,
            endLatitude: endDto.latitude,
            endLongitude: endDto.longitude,
            endAccuracy: endDto.accuracy,
            endGpsStatus: GpsStatus.GRANTED,
          }),
        }),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          action: 'WORK_SESSION_END',
          entity: 'SalesWorkSession',
        }),
      );
    });

    it('should end session without GPS when coordinates not provided', async () => {
      const dtoWithoutGps: EndWorkDto = { gpsStatus: 'DENIED' };
      mockPrisma.salesWorkSession.findFirst.mockResolvedValue(activeSession);
      mockPrisma.salesWorkSession.update.mockResolvedValue({
        ...activeSession,
        endedAt: new Date(),
        endGpsStatus: GpsStatus.DENIED,
        status: WorkSessionStatus.COMPLETED,
      });
      mockAuditService.log.mockResolvedValue({});

      const result = await service.endWork(mockUserId, Role.SALES_EXECUTIVE, dtoWithoutGps);

      expect(result.hasGps).toBe(false);
      expect(mockPrisma.gpsEvent.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if no active session', async () => {
      mockPrisma.salesWorkSession.findFirst.mockResolvedValue(null);

      await expect(
        service.endWork(mockUserId, Role.SALES_EXECUTIVE, endDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for non-SALES_EXECUTIVE', async () => {
      await expect(
        service.endWork(mockUserId, Role.AGENT, endDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should use server-generated timestamp for endedAt', async () => {
      mockPrisma.salesWorkSession.findFirst.mockResolvedValue(activeSession);
      mockPrisma.salesWorkSession.update.mockResolvedValue({
        ...activeSession,
        endedAt: new Date('2024-01-15T17:00:00Z'),
        status: WorkSessionStatus.COMPLETED,
      });
      mockAuditService.log.mockResolvedValue({});

      const beforeCall = new Date();
      await service.endWork(mockUserId, Role.SALES_EXECUTIVE, endDto);
      const afterCall = new Date();

      const updateCall = mockPrisma.salesWorkSession.update.mock.calls[0][0];
      const endedAt = updateCall.data.endedAt;
      expect(endedAt).toBeInstanceOf(Date);
      expect(endedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(endedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });
  });

  describe('getActiveSession', () => {
    it('should return active session with duration', async () => {
      const session = {
        id: mockSessionId,
        userId: mockUserId,
        startedAt: new Date('2024-01-15T08:00:00Z'),
        startLatitude: 6.5244,
        startLongitude: 3.3792,
        startGpsStatus: GpsStatus.GRANTED,
        status: WorkSessionStatus.ACTIVE,
        notes: 'Test',
        gpsEvents: [],
      };
      mockPrisma.salesWorkSession.findFirst.mockResolvedValue(session);

      const result = await service.getActiveSession(mockUserId, Role.SALES_EXECUTIVE);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.durationMinutes).toBeGreaterThan(0);
      }
    });

    it('should return null if no active session', async () => {
      mockPrisma.salesWorkSession.findFirst.mockResolvedValue(null);

      const result = await service.getActiveSession(mockUserId, Role.SALES_EXECUTIVE);

      expect(result).toBeNull();
    });

    it('should throw ForbiddenException for non-SALES_EXECUTIVE', async () => {
      await expect(
        service.getActiveSession(mockUserId, Role.AFFILIATE),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getSessionHistory', () => {
    it('should return paginated session history', async () => {
      const sessions = [
        {
          id: 'session-1',
          userId: mockUserId,
          startedAt: new Date('2024-01-15T08:00:00Z'),
          endedAt: new Date('2024-01-15T17:00:00Z'),
          startGpsStatus: GpsStatus.GRANTED,
          endGpsStatus: GpsStatus.GRANTED,
          status: WorkSessionStatus.COMPLETED,
        },
        {
          id: 'session-2',
          userId: mockUserId,
          startedAt: new Date('2024-01-14T08:00:00Z'),
          endedAt: new Date('2024-01-14T16:00:00Z'),
          startGpsStatus: GpsStatus.GRANTED,
          endGpsStatus: GpsStatus.GRANTED,
          status: WorkSessionStatus.COMPLETED,
        },
      ];
      mockPrisma.salesWorkSession.findMany.mockResolvedValue(sessions);
      mockPrisma.salesWorkSession.count.mockResolvedValue(2);

      const result = await service.getSessionHistory(mockUserId, Role.SALES_EXECUTIVE, 1, 20);

      expect(result.sessions).toHaveLength(2);
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
      expect(result.sessions[0].durationMinutes).toBe(540); // 9 hours
    });

    it('should throw ForbiddenException for non-SALES_EXECUTIVE', async () => {
      await expect(
        service.getSessionHistory(mockUserId, Role.AFFILIATE),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});