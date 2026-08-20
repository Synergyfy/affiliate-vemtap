import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AudienceService } from '../audience/audience.service';

describe('WhatsAppService', () => {
  let service: WhatsAppService;

  const mockPrisma: {
    communicationMessage: { findUnique: jest.Mock; update: jest.Mock };
    lead: { update: jest.Mock };
    $transaction: jest.Mock;
  } = {
    communicationMessage: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    lead: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  mockPrisma.$transaction.mockImplementation((cb: (t: typeof mockPrisma) => unknown) => cb(mockPrisma));

  const mockAudienceService = {
    resolveVisibleUserIds: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AudienceService, useValue: mockAudienceService },
      ],
    }).compile();
    service = module.get<WhatsAppService>(WhatsAppService);
  });

  describe('buildDeepLink', () => {
    it('builds a wa.me link with international phone and encoded text', () => {
      const link = service.buildDeepLink('08012345678', 'Hi there!');
      expect(link).toBe('https://wa.me/2348012345678?text=Hi%20there!');
    });

    it('returns null for a missing phone', () => {
      expect(service.buildDeepLink(null, 'Hi')).toBeNull();
    });

    it('handles a phone already in international format', () => {
      expect(service.buildDeepLink('2348012345678', '')).toBe('https://wa.me/2348012345678');
    });
  });

  describe('markAsSent', () => {
    const agent = { id: 'user-1', role: 'AGENT' };
    const admin = { id: 'user-2', role: 'ADMIN' };

    it('throws when the message is not found', async () => {
      mockPrisma.communicationMessage.findUnique.mockResolvedValue(null);
      await expect(service.markAsSent('m1', agent)).rejects.toThrow(BadRequestException);
    });

    it('throws for a non-WhatsApp message', async () => {
      mockPrisma.communicationMessage.findUnique.mockResolvedValue({
        id: 'm1',
        channel: 'SMS',
        status: 'PENDING',
      });
      await expect(service.markAsSent('m1', agent)).rejects.toThrow(BadRequestException);
    });

    it('throws if the message is not pending', async () => {
      mockPrisma.communicationMessage.findUnique.mockResolvedValue({
        id: 'm1',
        channel: 'WHATSAPP',
        status: 'SENT',
      });
      await expect(service.markAsSent('m1', agent)).rejects.toThrow(BadRequestException);
    });

    it('forbids a salesperson from marking another agent\'s message as sent (IDOR)', async () => {
      mockPrisma.communicationMessage.findUnique.mockResolvedValue({
        id: 'm1',
        channel: 'WHATSAPP',
        status: 'PENDING',
        leadId: 'lead-1',
        lead: { userId: 'other-agent' },
      });
      await expect(service.markAsSent('m1', agent)).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.communicationMessage.update).not.toHaveBeenCalled();
    });

    it('marks a pending WhatsApp message as sent and updates the lead', async () => {
      mockPrisma.communicationMessage.findUnique.mockResolvedValue({
        id: 'm1',
        channel: 'WHATSAPP',
        status: 'PENDING',
        leadId: 'lead-1',
        lead: { userId: 'user-1' },
      });
      mockPrisma.communicationMessage.update.mockResolvedValue({ id: 'm1', status: 'SENT' });
      mockPrisma.lead.update.mockResolvedValue({});

      const result = await service.markAsSent('m1', agent);
      expect(result.success).toBe(true);
      expect(mockPrisma.communicationMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'm1' },
          data: expect.objectContaining({ status: 'SENT', markedSentAt: expect.any(Date), sentById: 'user-1' }),
        }),
      );
      expect(mockPrisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'lead-1' }, data: expect.objectContaining({ lastContactedAt: expect.any(Date) }) }),
      );
    });

    it('allows an admin to mark any message as sent', async () => {
      mockPrisma.communicationMessage.findUnique.mockResolvedValue({
        id: 'm1',
        channel: 'WHATSAPP',
        status: 'PENDING',
        leadId: 'lead-1',
        lead: { userId: 'other-agent' },
      });
      mockPrisma.communicationMessage.update.mockResolvedValue({ id: 'm1', status: 'SENT' });
      mockPrisma.lead.update.mockResolvedValue({});

      const result = await service.markAsSent('m1', admin);
      expect(result.success).toBe(true);
    });
  });
});
