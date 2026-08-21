import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JourneyService, JourneyLead } from './journey.service';
import { MessagesService } from '../messages/messages.service';
import { RulesService } from '../rules/rules.service';
import { CommunicationSettingsService } from '../settings/communication-settings.service';
import { JourneyState, LEAD_NURTURE_STATES, TERMINAL_STATES, phoneSearchTail } from '../common/communication.constants';
import {
  AutomationAction,
  AutomationTrigger,
  CommunicationChannel,
  CommunicationMessageStatus,
  CommunicationMessageType,
} from '@prisma/client';

const DEFAULT_WELCOME_BODY =
  'Welcome to VEMTAP! Your subscription is now active. We are excited to have you onboard.';

/** Message types that belong to the customer journey and must never be cancelled by lead-nurture overrides. */
const PROTECTED_MESSAGE_TYPES = [
  CommunicationMessageType.WELCOME,
  CommunicationMessageType.CUSTOMER_JOURNEY,
];

/** Triggers that intentionally target terminal journey states (customer journey
 *  and re-engagement). Messages produced by these are exempt from the
 *  lead-nurture terminal-state block and are typed CUSTOMER_JOURNEY. */
const CUSTOMER_JOURNEY_TRIGGERS: AutomationTrigger[] = [
  AutomationTrigger.BECAME_SUBSCRIBED,
  AutomationTrigger.BECAME_NOT_INTERESTED,
  AutomationTrigger.BEFORE_EXPIRY,
  AutomationTrigger.AFTER_EXPIRY,
];

/** Minimal rule shape used by crons after delay filtering. */
type RuleLike = {
  id: string;
  action: AutomationAction;
  templateId: string | null;
  waitDays: number;
};

@Injectable()
export class EngineService {
  private readonly logger = new Logger(EngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly journeyService: JourneyService,
    private readonly messagesService: MessagesService,
    private readonly rulesService: RulesService,
    private readonly settingsService: CommunicationSettingsService,
  ) {}

  /**
   * Recompute + persist the denormalized journey state for a lead. Returns true
   * if the state changed.
   */
  async reconcileJourneyState(leadId: string): Promise<{ changed: boolean; state: JourneyState }> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        salesPipelines: {
          select: { pipelineStage: true, exitState: true, leadQuality: true },
          take: 1,
        },
      },
    });
    if (!lead) return { changed: false, state: 'LOST_CLOSED' };

    // Prefer an already-linked business; otherwise resolve + persist the
    // linkage via a normalized phone match.
    const business = lead.businessId
      ? await this.prisma.business.findUnique({
          where: { id: lead.businessId },
          select: { id: true, status: true },
        })
      : await this.matchBusinessByPhone(lead.phone);
    const newState = this.journeyService.resolveJourneyState(lead as JourneyLead, business?.status);

    const stateChanged = lead.journeyState !== newState;
    const businessChanged = lead.businessId !== (business?.id ?? null);
    if (stateChanged || businessChanged) {
      await this.prisma.lead.update({
        where: { id: leadId },
        data: {
          ...(stateChanged
            ? { journeyState: newState, journeyStateUpdatedAt: new Date() }
            : {}),
          ...(businessChanged ? { businessId: business?.id ?? null } : {}),
        },
      });
    }
    return { changed: stateChanged, state: newState };
  }

  /**
   * Handle a lead becoming SUBSCRIBED. This is a critical override:
   * 1. Stop all pending lead sales messages (except customer-journey types).
   * 2. Cancel pending lead follow-ups.
   * 3. Send the welcome message.
   * 4. Switch to the customer journey.
   */
  async onSubscribed(leadId: string): Promise<void> {
    const { state } = await this.reconcileJourneyState(leadId);
    if (state !== 'SUBSCRIBED') return;

    await this.prisma.$transaction(async (tx) => {
      // 1. Cancel pending lead messages, preserving customer-journey types.
      await tx.communicationMessage.updateMany({
        where: {
          leadId,
          status: { in: [CommunicationMessageStatus.PENDING, CommunicationMessageStatus.SCHEDULED] },
          type: { notIn: PROTECTED_MESSAGE_TYPES },
        },
        data: { status: CommunicationMessageStatus.CANCELLED },
      });

      // 2. Cancel pending sales follow-ups.
      await tx.salesFollowUp.updateMany({
        where: { pipeline: { leadId }, status: 'PENDING' as any },
        data: { status: 'CANCELLED' as any },
      });
    });

    // 3. Send the welcome message (exempt from frequency guard) on the
    //    configured channel, using the configured body or the default.
    //    Idempotent: only create it if no live welcome exists (protects against
    //    concurrent status-change hooks / cron overlap).
    const settings = await this.settingsService.getSettings();
    const welcomeChannel = settings.welcomeChannel ?? CommunicationChannel.SMS;
    const welcomeBody = settings.welcomeBody?.trim() || DEFAULT_WELCOME_BODY;

    const existingWelcome = await this.prisma.communicationMessage.findFirst({
      where: {
        leadId,
        type: CommunicationMessageType.WELCOME,
        status: {
          in: [
            CommunicationMessageStatus.PENDING,
            CommunicationMessageStatus.SCHEDULED,
            CommunicationMessageStatus.SENT,
          ],
        },
      },
      select: { id: true },
    });

    if (!existingWelcome) {
      await this.messagesService.createMessages({
        leadIds: [leadId],
        channel: welcomeChannel,
        body: welcomeBody,
        type: CommunicationMessageType.WELCOME,
        skipFrequencyGuard: true,
      });
    }

    // 4. Trigger customer-journey welcome rules (if admin configured one).
    //    STOP_LEAD_MESSAGES rules on this trigger are type-aware and will not
    //    cancel the welcome message just created.
    await this.evaluateRules(AutomationTrigger.BECAME_SUBSCRIBED, leadId, 0);

    this.logger.log(`Lead ${leadId} subscribed — lead messaging stopped, welcome (${welcomeChannel}) queued.`);
  }

  /** Handle a lead changing journey state (called from sales/leads/business flows). */
  async onLeadStatusChanged(leadId: string): Promise<void> {
    const { state } = await this.reconcileJourneyState(leadId);

    if (state === 'SUBSCRIBED') {
      await this.onSubscribed(leadId);
      return;
    }

    if (state === 'NOT_INTERESTED') {
      await this.handleNotInterested(leadId);
      return;
    }

    // A new contact enters the nurture journey. Immediate (waitDays=0)
    // LEAD_CREATED rules fire here; delayed ones are dispatched by the cron.
    // Only nurture states are eligible — an expired/lost lead must not receive
    // a "new contact" message.
    if (LEAD_NURTURE_STATES.includes(state)) {
      await this.evaluateRules(AutomationTrigger.LEAD_CREATED, leadId, 0);
    }

    if (state === 'INTERESTED') {
      await this.evaluateRules(AutomationTrigger.STATUS_CHANGED_TO_INTERESTED, leadId, 0);
    }
  }

  /** Evaluate the not-interested policy for a lead. */
  private async handleNotInterested(leadId: string): Promise<void> {
    const settings = await this.settingsService.getSettings();

    // Cancel any pending lead messages, preserving customer-journey types.
    await this.prisma.communicationMessage.updateMany({
      where: {
        leadId,
        status: { in: [CommunicationMessageStatus.PENDING, CommunicationMessageStatus.SCHEDULED] },
        type: { notIn: PROTECTED_MESSAGE_TYPES },
      },
      data: { status: CommunicationMessageStatus.CANCELLED },
    });

    if (settings.notInterestedPolicy === 'NO_MESSAGES') {
      return;
    }

    // RE_ENGAGEMENT: schedule a low-frequency re-engagement message later.
    await this.evaluateRules(AutomationTrigger.BECAME_NOT_INTERESTED, leadId, 0);
  }

  /**
   * Evaluate all active rules for a given trigger against a lead, performing
   * the configured action. Used for event-driven triggers; the crons dispatch
   * individual delayed rules via evaluateRule.
   *
   * When `maxWaitDays` is provided, rules that wait longer than that are
   * skipped so synchronous status-change paths never fire delayed rules early.
   */
  async evaluateRules(
    trigger: AutomationTrigger,
    leadId: string,
    maxWaitDays?: number,
  ): Promise<void> {
    const rules = await this.rulesService.findActiveByTrigger(trigger);
    if (rules.length === 0) return;

    const { state } = await this.reconcileJourneyState(leadId);

    for (const rule of rules) {
      if (maxWaitDays !== undefined && rule.waitDays > maxWaitDays) continue;
      await this.executeRule(rule, trigger, leadId, state);
    }
  }

  /** Evaluate a single rule against a lead (used by the cron after delay filtering). */
  async evaluateRule(trigger: AutomationTrigger, rule: RuleLike, leadId: string): Promise<void> {
    const { state } = await this.reconcileJourneyState(leadId);
    await this.executeRule(rule, trigger, leadId, state);
  }

  private async executeRule(
    rule: RuleLike,
    trigger: AutomationTrigger,
    leadId: string,
    state: JourneyState,
  ): Promise<void> {
    const customerJourney = CUSTOMER_JOURNEY_TRIGGERS.includes(trigger);

    switch (rule.action) {
      case AutomationAction.STOP_LEAD_MESSAGES:
        await this.prisma.communicationMessage.updateMany({
          where: {
            leadId,
            status: { in: [CommunicationMessageStatus.PENDING, CommunicationMessageStatus.SCHEDULED] },
            type: { notIn: PROTECTED_MESSAGE_TYPES },
          },
          data: { status: CommunicationMessageStatus.CANCELLED },
        });
        break;

      case AutomationAction.SEND_SMS:
        await this.sendFromRule(
          rule.id,
          rule.templateId,
          leadId,
          CommunicationChannel.SMS,
          state,
          customerJourney,
        );
        break;

      case AutomationAction.CREATE_WHATSAPP_TASK:
        await this.sendFromRule(
          rule.id,
          rule.templateId,
          leadId,
          CommunicationChannel.WHATSAPP,
          state,
          customerJourney,
        );
        break;

      case AutomationAction.START_CUSTOMER_JOURNEY:
        // Customer journey messages are scheduled by the cron for
        // BEFORE_EXPIRY / AFTER_EXPIRY triggers; nothing to do synchronously.
        break;

      default:
        break;
    }
  }

  private async sendFromRule(
    ruleId: string,
    templateId: string | null,
    leadId: string,
    channel: CommunicationChannel,
    state: JourneyState,
    customerJourney = false,
  ): Promise<void> {
    // Lead-nurture rules must not message terminal contacts. Customer-journey
    // rules (welcome/re-engagement/expiry) are allowed to reach them.
    if (!customerJourney && TERMINAL_STATES.includes(state)) {
      // Do not send lead-nurture messages to terminal contacts.
      return;
    }

    // Dedup: this rule must not produce more than one message per lead (protects
    // against repeated status-change triggers and cron overlap).
    const existing = await this.prisma.communicationMessage.findFirst({
      where: { ruleId, leadId },
      select: { id: true },
    });
    if (existing) return;

    const template = templateId
      ? await this.prisma.communicationTemplate.findUnique({ where: { id: templateId } })
      : null;
    const body = template?.body ?? '';
    if (!body) return;

    await this.messagesService.createMessages({
      leadIds: [leadId],
      channel,
      body,
      templateId: templateId ?? undefined,
      ruleId,
      type: customerJourney
        ? CommunicationMessageType.CUSTOMER_JOURNEY
        : CommunicationMessageType.AUTOMATION,
    });
  }

  private async matchBusinessByPhone(
    phone?: string | null,
  ): Promise<{ id: string; status: string } | null> {
    const tail = phoneSearchTail(phone);
    if (!tail) return null;
    const business = await this.prisma.business.findFirst({
      where: { phone: { contains: tail } },
      select: { id: true, status: true },
      orderBy: { updatedAt: 'desc' },
    });
    return business ?? null;
  }
}
