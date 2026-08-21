import { Test, TestingModule } from '@nestjs/testing';
import { AudienceService } from './audience.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JourneyService } from '../engine/journey.service';

describe('AudienceService', () => {
  let service: AudienceService;
  const mockPrisma = {
    user: { findUnique: jest.fn() },
    lead: { count: jest.fn(), findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AudienceService,
        { provide: PrismaService, useValue: mockPrisma },
        JourneyService,
      ],
    }).compile();
    service = module.get<AudienceService>(AudienceService);
  });

  describe('buildWhereClause', () => {
    it('maps a simple status to a Lead.status condition', () => {
      const where = service.buildWhereClause({ statuses: ['INTERESTED'] });
      expect((where.AND as any[]).find((c) => c.OR)).toBeDefined();
      const orClause = (where.AND as any[]).find((c) => c.OR).OR;
      expect(orClause).toEqual([{ status: { in: ['INTERESTED', 'DEMO_SCHEDULED', 'DEMO_DONE'] } }]);
    });

    it('keeps the follow-up OR conditions for FOLLOW_UP_REQUIRED (not just status)', () => {
      const where = service.buildWhereClause({ statuses: ['FOLLOW_UP_REQUIRED'] });
      const orClause = (where.AND as any[]).find((c) => c.OR).OR[0];
      expect(orClause).toMatchObject({
        status: { notIn: ['CUSTOMER', 'NOT_INTERESTED'] },
      });
      expect(orClause.OR).toEqual([
        { nextFollowUpAt: { not: null } },
        { followUpDate: { not: null } },
      ]);
    });

    it('keeps the pipeline exit-state guard for LOST_CLOSED (not bare status)', () => {
      const where = service.buildWhereClause({ statuses: ['LOST_CLOSED'] });
      const orClause = (where.AND as any[]).find((c) => c.OR).OR[0];
      expect(orClause).toMatchObject({
        salesPipelines: { some: { OR: expect.any(Array) } },
      });
      expect(orClause.status).toBeUndefined();
    });

    it('selects EXPIRED leads via their linked Business subscription status', () => {
      const where = service.buildWhereClause({ statuses: ['EXPIRED'] });
      const orClause = (where.AND as any[]).find((c) => c.OR).OR[0];
      expect(orClause).toEqual({ business: { is: { status: 'EXPIRED' } } });
    });

    it('combines statuses with OR and keeps other filters ANDed', () => {
      const where = service.buildWhereClause({
        statuses: ['NEW', 'INTERESTED'],
        salespersonIds: ['u1'],
        location: 'Apo',
      });
      const conditions = where.AND as any[];
      expect(conditions.some((c) => c.userId && c.userId.in)).toBe(true);
      expect(conditions.some((c) => c.OR && Array.isArray(c.OR))).toBe(true);
      expect(conditions.some((c) => c.OR && c.OR.some((o: any) => o.location))).toBe(true);
    });
  });

  describe('resolveVisibleUserIds', () => {
    it('returns null for admins (global visibility)', async () => {
      expect(await service.resolveVisibleUserIds('a', 'ADMIN')).toBeNull();
      expect(await service.resolveVisibleUserIds('a', 'SUPER_ADMIN')).toBeNull();
    });

    it('returns own id for sales roles', async () => {
      expect(await service.resolveVisibleUserIds('u1', 'AGENT')).toEqual(['u1']);
    });

    it('includes direct reports for supervisors and managers', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        supervisedUsers: [{ id: 'report1' }],
        managedUsers: [{ id: 'report2' }],
      });
      expect(await service.resolveVisibleUserIds('u1', 'SUPERVISOR')).toEqual([
        'u1',
        'report1',
        'report2',
      ]);
    });
  });
});