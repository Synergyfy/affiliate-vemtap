import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../../prisma/prisma.service';
import { MessageRendererService } from '../common/message-renderer.service';
import { CommunicationSettingsService } from '../settings/communication-settings.service';
import { CommunicationChannel } from '@prisma/client';

describe('TemplatesService', () => {
  let service: TemplatesService;

  const mockPrisma = {
    communicationTemplate: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockSettingsService = {
    getSettings: jest.fn().mockResolvedValue({
      smsBlacklistedWords: ['prohibited', 'scam'],
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        MessageRendererService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CommunicationSettingsService, useValue: mockSettingsService },
      ],
    }).compile();
    service = module.get<TemplatesService>(TemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('rejects an SMS template that exceeds 160 chars after variable substitution', async () => {
      const longBody = 'Hi [Business Name], thank you for your continued interest and support! ' + 'y'.repeat(140);
      mockPrisma.communicationTemplate.create.mockResolvedValue({ id: 't1' });

      await expect(
        service.create('user-1', {
          name: 'Too long',
          channel: CommunicationChannel.SMS,
          body: longBody,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.communicationTemplate.create).not.toHaveBeenCalled();
    });

    it('rejects an SMS template that contains a blacklisted word', async () => {
      await expect(
        service.create('user-1', {
          name: 'Scam Offer',
          channel: CommunicationChannel.SMS,
          body: 'Check out this scam deal today',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.communicationTemplate.create).not.toHaveBeenCalled();
    });

    it('creates a valid SMS template', async () => {
      const body = 'Hi, thanks for your interest in VEMTAP.';
      mockPrisma.communicationTemplate.create.mockResolvedValue({ id: 't1' });

      const result = await service.create('user-1', {
        name: 'Interested',
        channel: CommunicationChannel.SMS,
        body,
      });

      expect(mockPrisma.communicationTemplate.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 't1' });
    });

    it('allows long WhatsApp templates (no 160-char limit)', async () => {
      const longBody = 'x'.repeat(500);
      mockPrisma.communicationTemplate.create.mockResolvedValue({ id: 't1' });

      await expect(
        service.create('user-1', {
          name: 'WhatsApp',
          channel: CommunicationChannel.WHATSAPP,
          body: longBody,
        }),
      ).resolves.toEqual({ id: 't1' });
    });
  });


  describe('setStatus', () => {
    it('throws NotFound when template does not exist', async () => {
      mockPrisma.communicationTemplate.findUnique.mockResolvedValue(null);
      await expect(service.setStatus('missing', 'ARCHIVED' as any)).rejects.toThrow(NotFoundException);
    });

    it('updates the status of an existing template', async () => {
      mockPrisma.communicationTemplate.findUnique.mockResolvedValue({ id: 't1' });
      mockPrisma.communicationTemplate.update.mockResolvedValue({ id: 't1', status: 'ARCHIVED' });
      await service.setStatus('t1', 'ARCHIVED' as any);
      expect(mockPrisma.communicationTemplate.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { status: 'ARCHIVED' },
      });
    });
  });
});
