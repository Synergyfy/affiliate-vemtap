import { Test, TestingModule } from '@nestjs/testing';
import { EngineService } from './engine.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JourneyService } from './journey.service';
import { MessagesService } from '../messages/messages.service';
import { RulesService } from '../rules/rules.service';
import { CommunicationSettingsService } from '../settings/communication-settings.service';
import { CommunicationChannel, CommunicationMessageStatus } from '@prisma/client';

describe('EngineService', () => {
  let service: EngineService;

  const mockPrisma: {
    lead: { findUnique: jest.Mock; update: jest.Mock };
    business: { findFirst: jest.Mock };
    communicationMessage: { updateMany: jest.Mock; findFirst: jest.Mock };
    salesFollowUp: { updateMany: jest.Mock };
    communicationTemplate: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  } = {
    lead: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    business: {
      findFirst: jest.fn(),
    },
    communicationMessage: {
      updateMany: jest.fn(),
      findFirst: jest.fn(),
    },
    salesFollowUp: {
      updateMany: jest.fn(),
    },
    communicationTemplate: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  mockPrisma.$transaction.mockImplementation((cb: (t: typeof mockPrisma) => unknown) => cb(mockPrisma));

  const mockJourneyService = {
    resolveJourneyState: jest.fn(),
  };

  const mockMessagesService = {
    createMessages: jest.fn(),
  };

  const mockRulesService = {
    findActiveByTrigger: jest.fn(),
  };

  const mockSettingsService = {
    getSettings: jest.fn().mockResolvedValue({
      welcomeChannel: 'SMS',
      welcomeBody: null,
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EngineService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JourneyService, useValue: mockJourneyService },
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: RulesService, useValue: mockRulesService },
        { provide: CommunicationSettingsService, useValue: mockSettingsService },
      ],
    }).compile();
    service = module.get<EngineService>(EngineService);
  });

  describe('onSubscribed', () => {
    it('stops lead messages and sends the welcome SMS for a subscribed lead', async () => {
      // reconcileJourneyState resolves SUBSCRIBED
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        status: 'CUSTOMER',
        phone: '08012345678',
        journeyState: null,
        deletedAt: null,
        isPlaceholder: false,
        salesPipelines: [],
      });
      mockPrisma.business.findFirst.mockResolvedValue({ status: 'ACTIVE' });
      mockJourneyService.resolveJourneyState.mockReturnValue('SUBSCRIBED');
      mockPrisma.lead.update.mockResolvedValue({});
      mockPrisma.communicationMessage.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.salesFollowUp.updateMany.mockResolvedValue({ count: 1 });
      mockMessagesService.createMessages.mockResolvedValue({ created: 1 });
      mockRulesService.findActiveByTrigger.mockResolvedValue([]);

      await service.onSubscribed('lead-1');

      // Pending lead messages cancelled
      expect(mockPrisma.communicationMessage.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            leadId: 'lead-1',
            status: { in: [CommunicationMessageStatus.PENDING, CommunicationMessageStatus.SCHEDULED] },
          }),
          data: { status: CommunicationMessageStatus.CANCELLED },
        }),
      );

      // Pending sales follow-ups cancelled
      expect(mockPrisma.salesFollowUp.updateMany).toHaveBeenCalled();

      // Welcome message created (exempt from frequency guard)
      expect(mockMessagesService.createMessages).toHaveBeenCalledWith(
        expect.objectContaining({
          leadIds: ['lead-1'],
          channel: CommunicationChannel.SMS,
          type: 'WELCOME',
          skipFrequencyGuard: true,
        }),
      );
    });

    it('does nothing if the resolved state is not SUBSCRIBED', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        status: 'INTERESTED',
        phone: '08012345678',
        journeyState: 'INTERESTED',
        deletedAt: null,
        isPlaceholder: false,
        salesPipelines: [],
      });
      mockPrisma.business.findFirst.mockResolvedValue(null);
      mockJourneyService.resolveJourneyState.mockReturnValue('INTERESTED');
      mockPrisma.lead.update.mockResolvedValue({});

      await service.onSubscribed('lead-1');

      expect(mockPrisma.communicationMessage.updateMany).not.toHaveBeenCalled();
      expect(mockMessagesService.createMessages).not.toHaveBeenCalled();
    });
  });

  describe('onLeadStatusChanged', () => {
    it('fires immediate LEAD_CREATED rules and defers delayed ones to the cron', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        status: 'NOT_YET',
        phone: null,
        journeyState: null,
        deletedAt: null,
        isPlaceholder: false,
        salesPipelines: [],
      });
      mockPrisma.business.findFirst.mockResolvedValue(null);
      mockJourneyService.resolveJourneyState.mockReturnValue('NEW');
      mockPrisma.lead.update.mockResolvedValue({});
      mockRulesService.findActiveByTrigger.mockResolvedValue([
        {
          id: 'rule-immediate',
          action: 'CREATE_WHATSAPP_TASK',
          templateId: 't1',
          waitDays: 0,
        },
        {
          id: 'rule-delayed',
          action: 'CREATE_WHATSAPP_TASK',
          templateId: 't1',
          waitDays: 3,
        },
      ]);
      mockPrisma.communicationMessage.findFirst.mockResolvedValue(null);
      mockPrisma.communicationTemplate.findUnique.mockResolvedValue({ id: 't1', body: 'Hi' });
      mockMessagesService.createMessages.mockResolvedValue({ created: 1 });

      await service.onLeadStatusChanged('lead-1');

      expect(mockMessagesService.createMessages).toHaveBeenCalledWith(
        expect.objectContaining({ ruleId: 'rule-immediate' }),
      );
      expect(mockMessagesService.createMessages).not.toHaveBeenCalledWith(
        expect.objectContaining({ ruleId: 'rule-delayed' }),
      );
    });

    it('fires STATUS_CHANGED_TO_INTERESTED rules for an interested lead', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        status: 'INTERESTED',
        phone: null,
        journeyState: null,
        deletedAt: null,
        isPlaceholder: false,
        salesPipelines: [],
      });
      mockPrisma.business.findFirst.mockResolvedValue(null);
      mockJourneyService.resolveJourneyState.mockReturnValue('INTERESTED');
      mockPrisma.lead.update.mockResolvedValue({});
      mockRulesService.findActiveByTrigger.mockResolvedValue([
        {
          id: 'rule-interested',
          action: 'SEND_SMS',
          templateId: 't2',
          waitDays: 0,
        },
      ]);
      mockPrisma.communicationMessage.findFirst.mockResolvedValue(null);
      mockPrisma.communicationTemplate.findUnique.mockResolvedValue({ id: 't2', body: 'Hi' });
      mockMessagesService.createMessages.mockResolvedValue({ created: 1 });

      await service.onLeadStatusChanged('lead-1');

      expect(mockMessagesService.createMessages).toHaveBeenCalledWith(
        expect.objectContaining({ ruleId: 'rule-interested' }),
      );
    });

    it('sends an AFTER_EXPIRY win-back to a subscribed-then-expired lead (customer journey)', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        status: 'CUSTOMER',
        phone: null,
        journeyState: 'SUBSCRIBED',
        deletedAt: null,
        isPlaceholder: false,
        salesPipelines: [],
      });
      mockPrisma.business.findFirst.mockResolvedValue({ id: 'b1', status: 'EXPIRED' });
      mockJourneyService.resolveJourneyState.mockReturnValue('EXPIRED');
      mockPrisma.lead.update.mockResolvedValue({});
      mockPrisma.communicationMessage.findFirst.mockResolvedValue(null);
      mockPrisma.communicationTemplate.findUnique.mockResolvedValue({ id: 't3', body: 'Come back to VEMTAP' });
      mockMessagesService.createMessages.mockResolvedValue({ created: 1 });

      await service.evaluateRule(
        'AFTER_EXPIRY' as any,
        { id: 'rule-winback', action: 'SEND_SMS', templateId: 't3', waitDays: 0 },
        'lead-1',
      );

      expect(mockMessagesService.createMessages).toHaveBeenCalledWith(
        expect.objectContaining({
          ruleId: 'rule-winback',
          type: 'CUSTOMER_JOURNEY',
        }),
      );
    });

    it('does not send a nurture rule to a terminal (subscribed) lead', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: 'lead-1',
        status: 'CUSTOMER',
        phone: null,
        journeyState: 'SUBSCRIBED',
        deletedAt: null,
        isPlaceholder: false,
        salesPipelines: [],
      });
      mockPrisma.business.findFirst.mockResolvedValue({ id: 'b1', status: 'ACTIVE' });
      mockJourneyService.resolveJourneyState.mockReturnValue('SUBSCRIBED');
      mockPrisma.lead.update.mockResolvedValue({});
      mockPrisma.communicationMessage.findFirst.mockResolvedValue(null);
      mockPrisma.communicationTemplate.findUnique.mockResolvedValue({ id: 't4', body: 'Hi' });

      await service.evaluateRule(
        'STILL_INTERESTED_NOT_SUBSCRIBED' as any,
        { id: 'rule-nurture', action: 'SEND_SMS', templateId: 't4', waitDays: 3 },
        'lead-1',
      );

      expect(mockMessagesService.createMessages).not.toHaveBeenCalled();
    });
  });
});
