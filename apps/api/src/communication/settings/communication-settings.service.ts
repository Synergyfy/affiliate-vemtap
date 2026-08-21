import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCommunicationSettingsDto } from '../dto/communication-settings.dto';
import { CommunicationChannel } from '@prisma/client';

@Injectable()
export class CommunicationSettingsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const count = await this.prisma.communicationSettings.count();
    if (count === 0) {
      await this.prisma.communicationSettings.create({
        data: {
          smsEnabled: false,
          smsProvider: 'disabled',
          smsSenderId: null,
          smsDailyCap: 1000,
          whatsappEnabled: true,
          minIntervalHours: 24,
          maxMessagesPerContactPerDay: 3,
          maxMessagesPerContactPerWeek: 10,
          notInterestedPolicy: 'NO_MESSAGES',
          reEngagementDelayDays: 30,
        },
      });
    }

    // Seed starter templates once (idempotent) so Sales has something to work
    // with on a fresh install. Automation rules are deliberately NOT seeded —
    // they are admin-driven and can incur SMS costs once a provider is enabled.
    await this.seedStarterTemplates();
  }

  private async seedStarterTemplates() {
    const existing = await this.prisma.communicationTemplate.count();
    if (existing > 0) return;

    await this.prisma.communicationTemplate.createMany({
      data: [
        {
          name: 'Interested Lead - First Follow-up',
          channel: CommunicationChannel.WHATSAPP,
          body: 'Hi [Business Name], thanks again for your interest in VEMTAP. We would love to have you onboard. Let us know if you have any questions.',
          description: 'First WhatsApp follow-up for an interested lead.',
        },
        {
          name: 'Interested Lead - First Follow-up (SMS)',
          channel: CommunicationChannel.SMS,
          body: 'Hi [Business Name], thanks for your interest in VEMTAP. Would you like to get started? Reply YES to subscribe.',
          description: 'First SMS follow-up for an interested lead.',
        },
        {
          name: 'Welcome to VEMTAP',
          channel: CommunicationChannel.SMS,
          body: 'Welcome to VEMTAP! Your subscription is now active. We are excited to have you onboard.',
          description: 'Sent to a business immediately after subscription.',
        },
        {
          name: 'Renewal Reminder',
          channel: CommunicationChannel.SMS,
          body: 'Hi [Business Name], your VEMTAP subscription is due for renewal. Contact your agent to keep your account active.',
          description: 'Sent shortly before a subscription expires.',
        },
      ],
    });
  }

  async getSettings() {
    const settings = await this.prisma.communicationSettings.findFirst();
    if (!settings) {
      return this.prisma.communicationSettings.create({
        data: {},
      });
    }
    return settings;
  }

  async updateSettings(dto: UpdateCommunicationSettingsDto) {
    const settings = await this.prisma.communicationSettings.findFirst();
    if (!settings) {
      throw new NotFoundException('Communication settings not found');
    }
    return this.prisma.communicationSettings.update({
      where: { id: settings.id },
      data: dto,
    });
  }
}
