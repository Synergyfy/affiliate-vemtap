import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AudienceService } from '../audience/audience.service';
import { MessageRendererService } from '../common/message-renderer.service';
import { CommunicationSettingsService } from '../settings/communication-settings.service';
import { SmsService } from '../sms/sms.service';
import { MessageQueryDto } from '../dto/message.dto';
import { AudienceFilterDto } from '../dto/audience.dto';
import { SMS_MAX_LENGTH } from '../common/communication.constants';
import {
  CommunicationChannel,
  CommunicationMessageStatus,
  CommunicationMessageType,
} from '@prisma/client';

export type CreateMessagesInput = {
  leadIds?: string[];
  audience?: AudienceFilterDto;
  channel: CommunicationChannel;
  body: string;
  templateId?: string;
  campaignId?: string;
  ruleId?: string;
  type?: CommunicationMessageType;
  scheduledForAt?: Date | null;
  sentById?: string;
  skipFrequencyGuard?: boolean;
};

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audienceService: AudienceService,
    private readonly renderer: MessageRendererService,
    private readonly settingsService: CommunicationSettingsService,
    private readonly smsService: SmsService,
  ) {}

  /** Resolve the set of leads to message: explicit ids OR audience filters. */
  private async resolveTargetLeads(
    input: CreateMessagesInput,
    user?: { id: string; role: string },
  ) {
    let where: Prisma.LeadWhereInput;
    if (input.leadIds && input.leadIds.length > 0) {
      where = {
        id: { in: input.leadIds },
        deletedAt: null,
        isPlaceholder: false,
      };
    } else {
      where = await this.audienceService.scopeWhere(input.audience, user);
    }

    // Explicit lead ids must also be scoped to the user's own/team leads.
    if (user && input.leadIds && input.leadIds.length > 0) {
      const visible = await this.audienceService.resolveVisibleUserIds(user.id, user.role);
      if (visible) {
        where.userId = { in: visible };
      }
    }

    return this.prisma.lead.findMany({
      where,
      select: {
        id: true,
        businessName: true,
        contactName: true,
        phone: true,
        location: true,
        userId: true,
        lastContactedAt: true,
        createdAt: true,
        user: { select: { fullName: true } },
      },
    });
  }

  /** Load the frequency guard settings. */
  private async frequencySettings() {
    const s = await this.settingsService.getSettings();
    return {
      minIntervalHours: s.minIntervalHours,
      maxPerDay: s.maxMessagesPerContactPerDay,
      maxPerWeek: s.maxMessagesPerContactPerWeek,
    };
  }

  /**
   * Apply the frequency guard: refuse a message if the contact was messaged too
   * recently, or has hit the daily/weekly cap. Customer-journey and welcome
   * messages are exempt from the cooldown but still tracked.
   */
  private async checkFrequency(leadId: string, type: CommunicationMessageType): Promise<boolean> {
    if (type === CommunicationMessageType.WELCOME || type === CommunicationMessageType.CUSTOMER_JOURNEY) {
      return true;
    }
    const f = await this.frequencySettings();

    const now = new Date();

    if (f.minIntervalHours > 0) {
      const cutoff = new Date(now.getTime() - f.minIntervalHours * 3600 * 1000);
      const recent = await this.prisma.communicationMessage.findFirst({
        where: {
          leadId,
          status: { in: [CommunicationMessageStatus.SENT, CommunicationMessageStatus.SCHEDULED] },
          sentAt: { gte: cutoff },
        },
      });
      if (recent) return false;
    }

    if (f.maxPerDay > 0) {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const dayCount = await this.prisma.communicationMessage.count({
        where: {
          leadId,
          status: { in: [CommunicationMessageStatus.SENT, CommunicationMessageStatus.SCHEDULED] },
          createdAt: { gte: startOfDay },
        },
      });
      if (dayCount >= f.maxPerDay) return false;
    }

    if (f.maxPerWeek > 0) {
      const startOfWeek = new Date(now);
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      const weekCount = await this.prisma.communicationMessage.count({
        where: {
          leadId,
          status: { in: [CommunicationMessageStatus.SENT, CommunicationMessageStatus.SCHEDULED] },
          createdAt: { gte: startOfWeek },
        },
      });
      if (weekCount >= f.maxPerWeek) return false;
    }

    return true;
  }

  /**
   * Create messages for one or more leads. Returns the created messages and
   * per-lead outcomes (created / skipped by frequency / missing phone).
   *
   * Dispatch is centralized here: immediate SMS (no scheduledForAt) is sent via
   * the provider synchronously; scheduled SMS is left SCHEDULED for the cron;
   * WhatsApp is left PENDING for assisted sending.
   */
  async createMessages(input: CreateMessagesInput, user?: { id: string; role: string }) {
    const settings = await this.settingsService.getSettings();

    // An over-long SMS body or body with blacklisted words must be rejected at creation time
    // (before it is ever queued/activated), not silently skipped per-contact at dispatch.
    if (input.channel === CommunicationChannel.SMS) {
      this.renderer.assertSmsTemplateLength(input.body);
      this.renderer.assertNoBlacklistedWords(input.body, input.channel, settings.smsBlacklistedWords);
    }

    const leads = await this.resolveTargetLeads(input, user);
    if (leads.length === 0) {
      return { created: 0, skipped: 0, noPhone: 0, messages: [], dispatched: [] };
    }

    const channelEnabled =
      input.channel === CommunicationChannel.WHATSAPP
        ? settings.whatsappEnabled
        : true; // SMS is queueable regardless of send-enabled state

    const type = input.type ?? CommunicationMessageType.MANUAL;
    const now = new Date();
    const results: unknown[] = [];

    const createdMessages: string[] = [];
    const dispatched: unknown[] = [];

    for (const lead of leads) {
      // Resolve agent name (the owner of the lead)
      const agentName = lead.user?.fullName ?? null;

      const rendered = this.renderer.render(input.body, {
        businessName: lead.businessName,
        contactName: lead.contactName,
        location: lead.location,
        agentName,
      });

      // Per-lead SMS length enforcement: a single over-length render (e.g. a long
      // business name after variable substitution) must not abort a bulk
      // audience dispatch. For explicit single sends we reject outright so the
      // sender knows the message is invalid (spec: must shorten before sending).
      if (input.channel === CommunicationChannel.SMS && rendered.length > SMS_MAX_LENGTH) {
        if (input.leadIds && input.leadIds.length > 0) {
          throw new BadRequestException(
            `Message exceeds the ${SMS_MAX_LENGTH}-character limit (${rendered.length}/${SMS_MAX_LENGTH}).`,
          );
        }
        results.push({ leadId: lead.id, outcome: 'too_long', length: rendered.length });
        continue;
      }

      // Per-lead SMS blacklisted words enforcement
      if (input.channel === CommunicationChannel.SMS) {
        const blacklistedWord = this.renderer.findBlacklistedWord(rendered, settings.smsBlacklistedWords);
        if (blacklistedWord) {
          if (input.leadIds && input.leadIds.length > 0) {
            throw new BadRequestException(
              `Message contains prohibited word/phrase: "${blacklistedWord}".`,
            );
          }
          results.push({ leadId: lead.id, outcome: 'blacklisted_word', word: blacklistedWord });
          continue;
        }
      }

      // Require a phone number for outbound messages
      if (!lead.phone) {
        results.push({ leadId: lead.id, outcome: 'no_phone' });
        continue;
      }

      if (!input.skipFrequencyGuard && !(await this.checkFrequency(lead.id, type))) {
        results.push({ leadId: lead.id, outcome: 'frequency_skipped' });
        continue;
      }

      if (input.channel === CommunicationChannel.WHATSAPP && !channelEnabled) {
        results.push({ leadId: lead.id, outcome: 'channel_disabled' });
        continue;
      }

      // Campaign dedup: never create a second non-cancelled message for the
      // same campaign + lead + channel (protects against re-activation races).
      if (input.campaignId) {
        const existingCampaign = await this.prisma.communicationMessage.findFirst({
          where: {
            campaignId: input.campaignId,
            leadId: lead.id,
            channel: input.channel,
            status: { notIn: [CommunicationMessageStatus.CANCELLED] },
          },
          select: { id: true },
        });
        if (existingCampaign) {
          results.push({ leadId: lead.id, outcome: 'campaign_duplicate' });
          continue;
        }
      }

      const isImmediateSms =
        input.channel === CommunicationChannel.SMS && !input.scheduledForAt;

      const message = await this.prisma.communicationMessage.create({
        data: {
          leadId: lead.id,
          phone: lead.phone,
          channel: input.channel,
          type,
          status: isImmediateSms
            ? CommunicationMessageStatus.PENDING
            : input.scheduledForAt
              ? CommunicationMessageStatus.SCHEDULED
              : CommunicationMessageStatus.PENDING,
          body: rendered,
          variables: {
            businessName: lead.businessName,
            contactName: lead.contactName,
            location: lead.location,
            agentName,
          },
          templateId: input.templateId ?? null,
          campaignId: input.campaignId ?? null,
          ruleId: input.ruleId ?? null,
          scheduledForAt: isImmediateSms ? now : input.scheduledForAt ?? null,
          preparedAt: input.channel === CommunicationChannel.WHATSAPP ? now : null,
          sentById: isImmediateSms ? (input.sentById ?? null) : null,
          createdById: input.sentById ?? null,
        },
      });

      createdMessages.push(message.id);
      results.push({ leadId: lead.id, outcome: 'created', messageId: message.id });

      // Dispatch immediate SMS synchronously via the provider.
      if (isImmediateSms) {
        const sent = await this.smsService.sendMessage(message.id);
        if ((sent as any)?.status === CommunicationMessageStatus.SENT) {
          await this.prisma.lead.update({
            where: { id: lead.id },
            data: { lastContactedAt: new Date() },
          });
        }
        dispatched.push({ leadId: lead.id, messageId: message.id, status: (sent as any)?.status });
      }
    }

    return {
      created: createdMessages.length,
      skipped: results.filter((r) => (r as any).outcome === 'frequency_skipped').length,
      noPhone: results.filter((r) => (r as any).outcome === 'no_phone').length,
      channelDisabled: results.filter((r) => (r as any).outcome === 'channel_disabled').length,
      tooLong: results.filter((r) => (r as any).outcome === 'too_long').length,
      blacklisted: results.filter((r) => (r as any).outcome === 'blacklisted_word').length,
      messages: createdMessages,
      dispatched,
      outcomes: results,
    };

  }

  /**
   * Send an SMS message now (only SCHEDULED or PENDING SMS messages). Returns
   * the dispatched result via the SMS provider.
   */
  async sendSms(messageId: string) {
    const message = await this.prisma.communicationMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException(`Message ${messageId} not found`);
    if (message.channel !== CommunicationChannel.SMS) {
      throw new BadRequestException('Not an SMS message');
    }

    const updated = (await this.smsService.sendMessage(messageId)) as any;

    // Track last contacted for sent SMS
    if (updated?.status === CommunicationMessageStatus.SENT) {
      await this.prisma.lead.update({
        where: { id: message.leadId },
        data: { lastContactedAt: new Date() },
      });
    }
    return updated;
  }

  /** Cancel a pending/scheduled message. */
  async cancelMessage(messageId: string) {
    const message = await this.prisma.communicationMessage.findUnique({
      where: { id: messageId },
    });
    if (!message) throw new NotFoundException(`Message ${messageId} not found`);
    if (
      message.status === CommunicationMessageStatus.SENT ||
      message.status === CommunicationMessageStatus.CANCELLED
    ) {
      throw new BadRequestException(`Message cannot be cancelled (status: ${message.status})`);
    }
    return this.prisma.communicationMessage.update({
      where: { id: messageId },
      data: { status: CommunicationMessageStatus.CANCELLED },
    });
  }

  /**
   * Query messages/history with filters + pagination. Non-privileged users are
   * scoped to their own leads to prevent IDOR across the contact database.
   */
  async findMessages(filters: MessageQueryDto = {}, user?: { id: string; role: string }) {
    const where: Prisma.CommunicationMessageWhereInput = {};
    if (filters.channel) where.channel = filters.channel;
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.campaignId) where.campaignId = filters.campaignId;
    if (filters.leadId) where.leadId = filters.leadId;

    if (user) {
      const visible = await this.audienceService.resolveVisibleUserIds(user.id, user.role);
      if (visible) {
        where.lead = { userId: { in: visible } };
      }
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    const [data, total] = await Promise.all([
      this.prisma.communicationMessage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          lead: { select: { id: true, businessName: true, contactName: true, phone: true } },
        },
      }),
      this.prisma.communicationMessage.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /** Full communication profile + history for a single contact (Lead). */
  async contactProfile(leadId: string, user?: { id: string; role: string }) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        salesPipelines: { take: 1 },
        user: { select: { id: true, fullName: true, phone: true, role: true } },
      },
    });
    if (!lead || lead.deletedAt || lead.isPlaceholder) {
      throw new NotFoundException(`Lead ${leadId} not found`);
    }

    const isPrivileged = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    if (!isPrivileged && user?.id) {
      const visible = await this.audienceService.resolveVisibleUserIds(user.id, user.role);
      if (visible && !visible.includes(lead.userId)) {
        throw new ForbiddenException('You do not have access to this contact');
      }
    }

    const [whatsappHistory, smsHistory, history] = await Promise.all([
      this.prisma.communicationMessage.findMany({
        where: { leadId, channel: CommunicationChannel.WHATSAPP },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.communicationMessage.findMany({
        where: { leadId, channel: CommunicationChannel.SMS },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.communicationMessage.findMany({
        where: { leadId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    const summary = (messages: typeof whatsappHistory) => {
      const sent = messages.filter((m) => m.status === CommunicationMessageStatus.SENT).length;
      const pending = messages.filter((m) => m.status === CommunicationMessageStatus.PENDING).length;
      const scheduled = messages.filter((m) => m.status === CommunicationMessageStatus.SCHEDULED).length;
      const failed = messages.filter((m) => m.status === CommunicationMessageStatus.FAILED).length;
      const lastSent = messages.find((m) => m.status === CommunicationMessageStatus.SENT)?.sentAt ?? null;
      const nextScheduled = messages.find((m) => m.status === CommunicationMessageStatus.SCHEDULED)?.scheduledForAt ?? null;
      return { sent, pending, scheduled, failed, lastSent, nextScheduled };
    };

    return {
      lead: {
        id: lead.id,
        businessName: lead.businessName,
        contactName: lead.contactName,
        phone: lead.phone,
        location: lead.location,
        status: lead.status,
        agentName: lead.user?.fullName ?? null,
        lastContactedAt: lead.lastContactedAt,
        nextFollowUpAt: lead.nextFollowUpAt,
      },
      communication: {
        whatsapp: summary(whatsappHistory),
        sms: summary(smsHistory),
      },
      history: history.map((m) => ({
        id: m.id,
        channel: m.channel,
        status: m.status,
        type: m.type,
        body: m.body,
        scheduledForAt: m.scheduledForAt,
        sentAt: m.sentAt,
        preparedAt: m.preparedAt,
        markedSentAt: m.markedSentAt,
        failureReason: m.failureReason,
        providerMessageId: m.providerMessageId,
        createdAt: m.createdAt,
      })),
    };
  }
}
