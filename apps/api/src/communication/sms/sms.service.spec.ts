import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SmsService } from './sms.service';
import { PrismaWorkerService } from '../../prisma/prisma-worker.service';
import { CommunicationSettingsService } from '../settings/communication-settings.service';
import { MessageRendererService } from '../common/message-renderer.service';
import { DisabledSmsProvider } from './providers/disabled-sms.provider';

describe('SmsService', () => {
  let service: SmsService;

  const mockPrisma = {
    communicationMessage: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockSettings = {
    getSettings: jest.fn(),
  };

  const disabledProvider = new DisabledSmsProvider();

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        { provide: PrismaWorkerService, useValue: mockPrisma },
        { provide: CommunicationSettingsService, useValue: mockSettings },
        MessageRendererService,
        { provide: DisabledSmsProvider, useValue: disabledProvider },
      ],
    }).compile();
    service = module.get<SmsService>(SmsService);
  });

  describe('assertLength', () => {
    it('throws when body exceeds 160 characters', () => {
      expect(() => service.assertLength('x'.repeat(161))).toThrow(BadRequestException);
    });
    it('accepts 160 characters', () => {
      expect(() => service.assertLength('x'.repeat(160))).not.toThrow();
    });
  });

  describe('sendMessage', () => {
    it('throws when the message does not exist', async () => {
      mockPrisma.communicationMessage.findUnique.mockResolvedValue(null);
      await expect(service.sendMessage('m1')).rejects.toThrow(BadRequestException);
    });

    it('throws for a non-SMS message', async () => {
      mockPrisma.communicationMessage.findUnique.mockResolvedValue({
        id: 'm1',
        channel: 'WHATSAPP',
      });
      await expect(service.sendMessage('m1')).rejects.toThrow(BadRequestException);
    });

    it('marks the message FAILED when there is no phone number', async () => {
      mockPrisma.communicationMessage.findUnique.mockResolvedValue({
        id: 'm1',
        channel: 'SMS',
        status: 'PENDING',
        phone: null,
      });
      mockPrisma.communicationMessage.update.mockResolvedValue({ status: 'FAILED' });
      await service.sendMessage('m1');
      expect(mockPrisma.communicationMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
      );
    });

    it('sends via the provider and marks SENT with a provider id', async () => {
      mockPrisma.communicationMessage.findUnique.mockResolvedValue({
        id: 'm1',
        channel: 'SMS',
        status: 'PENDING',
        phone: '08012345678',
        body: 'Hi there',
      });
      mockSettings.getSettings.mockResolvedValue({
        smsEnabled: true,
        smsProvider: 'disabled',
        smsSenderId: null,
        smsDailyCap: 1000,
      });
      mockPrisma.communicationMessage.count.mockResolvedValue(0);
      mockPrisma.communicationMessage.update.mockResolvedValue({ status: 'SENT', providerMessageId: 'sim_1' });

      const result = await service.sendMessage('m1');
      expect(result).toEqual({ status: 'SENT', providerMessageId: 'sim_1' });
      expect(mockPrisma.communicationMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'SENT' }) }),
      );
    });

    it('leaves the message untouched when the daily cap is reached (cron skips dispatch)', async () => {
      mockPrisma.communicationMessage.findUnique.mockResolvedValue({
        id: 'm1',
        channel: 'SMS',
        status: 'PENDING',
        phone: '08012345678',
        body: 'Hi',
      });
      mockSettings.getSettings.mockResolvedValue({
        smsEnabled: true,
        smsProvider: 'disabled',
        smsSenderId: null,
        smsDailyCap: 5,
      });
      mockPrisma.communicationMessage.count.mockResolvedValue(5);

      const result = await service.sendMessage('m1');
      expect(result).toEqual({
        id: 'm1',
        channel: 'SMS',
        status: 'PENDING',
        phone: '08012345678',
        body: 'Hi',
      });
      expect(mockPrisma.communicationMessage.update).not.toHaveBeenCalled();
    });

    it('marks a message with blacklisted words as FAILED', async () => {
      mockPrisma.communicationMessage.findUnique.mockResolvedValue({
        id: 'm1',
        channel: 'SMS',
        status: 'PENDING',
        phone: '08012345678',
        body: 'Click here to claim your scam reward',
      });
      mockSettings.getSettings.mockResolvedValue({
        smsEnabled: true,
        smsProvider: 'disabled',
        smsSenderId: null,
        smsDailyCap: 1000,
        smsBlacklistedWords: ['scam'],
      });
      mockPrisma.communicationMessage.update.mockResolvedValue({ status: 'FAILED' });

      await service.sendMessage('m1');
      expect(mockPrisma.communicationMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILED',
            failureReason: expect.stringContaining('scam'),
          }),
        }),
      );
    });
  });
});

