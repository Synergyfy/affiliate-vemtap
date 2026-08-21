import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CommunicationSettingsService } from '../settings/communication-settings.service';
import { MessageRendererService } from '../common/message-renderer.service';
import { SMS_MAX_LENGTH } from '../common/communication.constants';
import { SmsProvider, SmsSendResult } from './sms-provider.interface';
import { DisabledSmsProvider } from './providers/disabled-sms.provider';
import { CommunicationChannel, CommunicationMessageStatus } from '@prisma/client';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly providers: Map<string, SmsProvider> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: CommunicationSettingsService,
    private readonly renderer: MessageRendererService,
    private readonly disabledProvider: DisabledSmsProvider,
  ) {
    // Register built-in providers. Add concrete providers here as they ship.
    this.providers.set('disabled', this.disabledProvider);
  }

  /**
   * Resolve the configured provider. Falls back to the disabled provider if the
   * configured provider is not registered (e.g. env points to a provider not yet
   * implemented) or SMS is disabled.
   */
  private async resolveProvider(): Promise<SmsProvider> {
    const settings = await this.settingsService.getSettings();
    if (!settings.smsEnabled) {
      return this.providers.get('disabled')!;
    }
    const configured = this.providers.get(settings.smsProvider);
    if (!configured) {
      this.logger.warn(
        `SMS provider "${settings.smsProvider}" not registered; falling back to disabled provider.`,
      );
      return this.providers.get('disabled')!;
    }
    return configured;
  }

  /** Enforce the 160-character limit on a rendered SMS body. */
  assertLength(renderedBody: string): void {
    if (renderedBody.length > SMS_MAX_LENGTH) {
      throw new BadRequestException(
        `Message exceeds the ${SMS_MAX_LENGTH}-character limit (${renderedBody.length}/${SMS_MAX_LENGTH}).`,
      );
    }
  }

  /** Enforce the configured daily SMS cap (global platform cap). */
  async isDailyCapReached(): Promise<boolean> {
    const settings = await this.settingsService.getSettings();
    if (!settings.smsEnabled || settings.smsDailyCap <= 0) return false;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sentToday = await this.prisma.communicationMessage.count({
      where: {
        channel: CommunicationChannel.SMS,
        status: { in: [CommunicationMessageStatus.SENT, CommunicationMessageStatus.SCHEDULED] },
        createdAt: { gte: startOfDay },
      },
    });

    return sentToday >= settings.smsDailyCap;
  }

  /**
   * Send an SMS message immediately. The message must already be persisted with
   * a rendered body and a phone number. Returns the updated message.
   */
  async sendMessage(messageId: string): Promise<unknown> {
    const message = await this.prisma.communicationMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new BadRequestException(`Message ${messageId} not found`);
    if (message.channel !== CommunicationChannel.SMS) {
      throw new BadRequestException('Not an SMS message');
    }
    if (message.status === CommunicationMessageStatus.SENT) {
      return message;
    }
    if (!message.phone) {
      return this.prisma.communicationMessage.update({
        where: { id: messageId },
        data: { status: CommunicationMessageStatus.FAILED, failureReason: 'No phone number' },
      });
    }

    if (message.body.length > SMS_MAX_LENGTH) {
      return this.prisma.communicationMessage.update({
        where: { id: messageId },
        data: {
          status: CommunicationMessageStatus.FAILED,
          failureReason: `Message exceeds the ${SMS_MAX_LENGTH}-character limit`,
        },
      });
    }

    const settings = await this.settingsService.getSettings();

    const blacklistedWord = this.renderer.findBlacklistedWord(
      message.body,
      settings.smsBlacklistedWords,
    );
    if (blacklistedWord) {
      return this.prisma.communicationMessage.update({
        where: { id: messageId },
        data: {
          status: CommunicationMessageStatus.FAILED,
          failureReason: `Message contains prohibited word/phrase: "${blacklistedWord}"`,
        },
      });
    }

    // SMS is admin-controlled and costs money: when it is disabled we must not
    // pretend a message was transmitted. Record a truthful failure so the admin
    // knows nothing was sent and can enable SMS + retry.
    if (!settings.smsEnabled) {
      return this.prisma.communicationMessage.update({
        where: { id: messageId },
        data: {
          status: CommunicationMessageStatus.FAILED,
          failureReason: 'SMS is disabled',
        },
      });
    }

    if (await this.isDailyCapReached()) {
      // Cap reached: leave the message as-is (SCHEDULED/PENDING) so it can be
      // dispatched once the cap resets. The cron skips dispatch while capped.
      return message;
    }


    const provider = await this.resolveProvider();
    let result: SmsSendResult;
    try {
      result = await provider.send(message.phone, message.body, settings.smsSenderId);
    } catch (error) {
      // A throwing provider must never leave the message stuck PENDING or abort
      // a batch mid-way — record the failure and continue.
      this.logger.error(`SMS provider error for message ${messageId}`, error);
      result = {
        success: false,
        error: error instanceof Error ? error.message : 'SMS provider error',
      };
    }

    return this.prisma.communicationMessage.update({
      where: { id: messageId },
      data: result.success
        ? {
            status: CommunicationMessageStatus.SENT,
            sentAt: new Date(),
            providerMessageId: result.providerMessageId ?? null,
            failureReason: null,
          }
        : {
            status: CommunicationMessageStatus.FAILED,
            failureReason: result.error ?? 'SMS delivery failed',
          },
    });
  }
}
