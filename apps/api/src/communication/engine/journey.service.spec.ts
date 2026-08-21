import { Test, TestingModule } from '@nestjs/testing';
import { JourneyService } from './journey.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('JourneyService', () => {
  let service: JourneyService;

  const mockPrisma = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JourneyService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<JourneyService>(JourneyService);
  });

  describe('resolveJourneyState', () => {
    const base = {
      id: 'lead-1',
      status: 'NOT_YET',
      deletedAt: null,
      isPlaceholder: false,
      nextFollowUpAt: null,
      followUpDate: null,
    };

    it('returns SUBSCRIBED for a CUSTOMER lead', () => {
      expect(service.resolveJourneyState({ ...base, status: 'CUSTOMER' })).toBe('SUBSCRIBED');
    });

    it('returns SUBSCRIBED when a pipeline stage is CUSTOMER', () => {
      expect(
        service.resolveJourneyState({
          ...base,
          salesPipelines: [{ pipelineStage: 'CUSTOMER' }],
        }),
      ).toBe('SUBSCRIBED');
    });

    it('returns SUBSCRIBED when business status is ACTIVE', () => {
      expect(service.resolveJourneyState(base, 'ACTIVE')).toBe('SUBSCRIBED');
    });

    it('returns EXPIRED when business status is EXPIRED', () => {
      expect(service.resolveJourneyState(base, 'EXPIRED')).toBe('EXPIRED');
    });

    it('returns LOST_CLOSED for deleted or placeholder leads', () => {
      expect(service.resolveJourneyState({ ...base, deletedAt: new Date() })).toBe('LOST_CLOSED');
      expect(service.resolveJourneyState({ ...base, isPlaceholder: true })).toBe('LOST_CLOSED');
    });

    it('returns NOT_INTERESTED for NOT_INTERESTED status', () => {
      expect(service.resolveJourneyState({ ...base, status: 'NOT_INTERESTED' })).toBe('NOT_INTERESTED');
    });

    it('returns INTERESTED for INTERESTED status', () => {
      expect(service.resolveJourneyState({ ...base, status: 'INTERESTED' })).toBe('INTERESTED');
    });

    it('returns FOLLOW_UP_REQUIRED when a follow-up is scheduled', () => {
      expect(
        service.resolveJourneyState({ ...base, nextFollowUpAt: new Date() }),
      ).toBe('FOLLOW_UP_REQUIRED');
    });

    it('returns CONTACTED / VISITED for those statuses', () => {
      expect(service.resolveJourneyState({ ...base, status: 'CONTACTED' })).toBe('CONTACTED');
      expect(service.resolveJourneyState({ ...base, status: 'VISITED' })).toBe('VISITED');
    });

    it('returns EXPIRED for a CUSTOMER lead whose business expired (win-back target)', () => {
      expect(
        service.resolveJourneyState({ ...base, status: 'CUSTOMER' }, 'EXPIRED'),
      ).toBe('EXPIRED');
    });

    it('returns LOST_CLOSED for a customer whose business was cancelled', () => {
      expect(
        service.resolveJourneyState({ ...base, status: 'CUSTOMER' }, 'CANCELLED'),
      ).toBe('LOST_CLOSED');
    });

    it('returns SUBSCRIBED for a CUSTOMER lead with an ACTIVE business', () => {
      expect(
        service.resolveJourneyState({ ...base, status: 'CUSTOMER' }, 'ACTIVE'),
      ).toBe('SUBSCRIBED');
    });

    it('returns NEW by default', () => {
      expect(service.resolveJourneyState(base)).toBe('NEW');
    });
  });
});
