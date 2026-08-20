import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AudienceService } from '../audience/audience.service';
import { MessageRendererService } from '../common/message-renderer.service';
import { CommunicationSettingsService } from '../settings/communication-settings.service';
import { SmsService } from '../sms/sms.service';
import { CommunicationChannel } from '@prisma/client';

describe('MessagesService', () => {
  let service: MessagesService;

  const mockPrisma = {
    lead: {
      findMany: jest.fn(),
    },
    communicationMessage: {
      create: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockAudienceService = {
    buildWhereClause: jest.fn((f) => f || {}),
    scopeWhere: jest.fn((f) => f || {}),
    resolveVisibleUserIds: jest.fn().mockResolvedValue(null),
  };

  const mockSettings = {
    getSettings: jest.fn(),
  };

  const mockSmsService = {
    assertLength: jest.fn(),
    sendMessage: jest.fn(),
  };

  const openSettings = {
    whatsappEnabled: true,
    smsEnabled: true,
    minIntervalHours: 0,
    maxMessagesPerContactPerDay: 0,
    maxMessagesPerContactPerWeek: 0,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AudienceService, useValue: mockAudienceService },
        MessageRendererService,
        { provide: CommunicationSettingsService, useValue: mockSettings },
        { provide: SmsService, useValue: mockSmsService },
      ],
    }).compile();
    service = module.get<MessagesService>(MessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMessages', () => {
    const leadWithPhone = {
      id: 'lead-1',
      businessName: 'ABC',
      contactName: 'John',
      phone: '08012345678',
      location: 'Apo',
      userId: 'user-1',
      lastContactedAt: null,
      createdAt: new Date(),
      user: { fullName: 'Agent A' },
    };

    it('creates a WhatsApp PENDING message for a lead with a phone', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([leadWithPhone]);
      mockSettings.getSettings.mockResolvedValue(openSettings);
      mockPrisma.communicationMessage.create.mockResolvedValue({ id: 'm1', status: 'PENDING' });

      const result = await service.createMessages({
        leadIds: ['lead-1'],
        channel: CommunicationChannel.WHATSAPP,
        body: 'Hi [Business Name]',
      });

      expect(result.created).toBe(1);
      expect(mockPrisma.communicationMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadId: 'lead-1',
            channel: 'WHATSAPP',
            status: 'PENDING',
            body: 'Hi ABC',
            preparedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('creates an immediate SMS PENDING message', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([leadWithPhone]);
      mockSettings.getSettings.mockResolvedValue(openSettings);
      mockPrisma.communicationMessage.create.mockResolvedValue({ id: 'm1', status: 'PENDING' });

      const result = await service.createMessages({
        leadIds: ['lead-1'],
        channel: CommunicationChannel.SMS,
        body: 'Hi',
      });

      expect(result.created).toBe(1);
      expect(mockPrisma.communicationMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ channel: 'SMS', status: 'PENDING' }),
        }),
      );
    });

    it('skips leads without a phone number', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([{ ...leadWithPhone, phone: null }]);
      mockSettings.getSettings.mockResolvedValue(openSettings);

      const result = await service.createMessages({
        leadIds: ['lead-1'],
        channel: CommunicationChannel.WHATSAPP,
        body: 'Hi',
      });

      expect(result.created).toBe(0);
      expect(result.noPhone).toBe(1);
      expect(mockPrisma.communicationMessage.create).not.toHaveBeenCalled();
    });

    it('rejects an explicit SMS send if body contains blacklisted words', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([leadWithPhone]);
      mockSettings.getSettings.mockResolvedValue({
        ...openSettings,
        smsBlacklistedWords: ['prohibited'],
      });

      await expect(
        service.createMessages({
          leadIds: ['lead-1'],
          channel: CommunicationChannel.SMS,
          body: 'This is a prohibited message',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('skips a contact in bulk audience if rendered variable contains blacklisted words', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([
        { ...leadWithPhone, businessName: 'Scam Business' },
      ]);
      mockSettings.getSettings.mockResolvedValue({
        ...openSettings,
        smsBlacklistedWords: ['scam'],
      });

      const result = await service.createMessages({
        audience: { statuses: ['INTERESTED'] as any },
        channel: CommunicationChannel.SMS,
        body: 'Hello [Business Name]',
      });

      expect(result.created).toBe(0);
      expect(result.blacklisted).toBe(1);
    });

    it('returns empty result when no leads match', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);
      const result = await service.createMessages({
        audience: { statuses: ['INTERESTED'] as any },
        channel: CommunicationChannel.WHATSAPP,
        body: 'Hi',
      });
      expect(result.created).toBe(0);
    });
  });
});

