import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { EngineService } from './engine.service';
import { MessagesService } from '../messages/messages.service';
import { RulesService } from '../rules/rules.service';
import { SmsService } from '../sms/sms.service';
import { AutomationTrigger, CommunicationMessageStatus } from '@prisma/client';

/**
 * Automation engine cron. Runs periodically to:
 *  - Dispatch SCHEDULED SMS whose time has come.
 *  - Evaluate time-based rules (still-interested-after-N-days, expiry).
 *  - Reconcile subscription override as a safety net for status changes made
 *    through any code path (integration, admin, etc.).
 *
 * Each job is guarded by a short Redis lock so that multiple API replicas do not
 * double-dispatch SMS or double-send the welcome message.
 */
@Injectable()
export class EngineProcessor {
  private readonly logger = new Logger(EngineProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly engineService: EngineService,
    private readonly messagesService: MessagesService,
    private readonly rulesService: RulesService,
    private readonly smsService: SmsService,
    private readonly redisService: RedisService,
  ) {}

  /** Run a job only if we acquire a distributed Redis lock (non-blocking). */
  private async withLock<T>(name: string, ttlSeconds: number, fn: () => Promise<T>): Promise<void> {
    const key = `comm:cron:${name}`;
    try {
      const client = this.redisService.getClient();
      const acquired = (await client.set(key, '1', 'EX', ttlSeconds, 'NX')) === 'OK';
      if (!acquired) {
        this.logger.debug(`Cron job "${name}" skipped: lock held by another instance.`);
        return;
      }
    } catch {
      // Redis unavailable — proceed without a lock (single-instance fallback).
      this.logger.warn(`Cron job "${name}" running without Redis lock.`);
    }
    await fn();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async dispatchDueSms() {
    await this.withLock('dispatch-due-sms', 55, async () => {
      if (await this.smsService.isDailyCapReached()) {
        this.logger.log('Skipping scheduled SMS dispatch: daily cap reached.');
        return;
      }

      const now = new Date();
      const due = await this.prisma.communicationMessage.findMany({
        where: {
          channel: 'SMS',
          status: CommunicationMessageStatus.SCHEDULED,
          scheduledForAt: { lte: now },
        },
        take: 100,
      });

      for (const message of due) {
        try {
          await this.messagesService.sendSms(message.id);
        } catch (error) {
          this.logger.error(`Failed to dispatch scheduled SMS ${message.id}`, error);
        }
      }

      if (due.length > 0) {
        this.logger.log(`Dispatched ${due.length} scheduled SMS messages.`);
      }
    });
  }

  /**
   * Flip WhatsApp campaign/queue messages that were scheduled for a future
   * campaign start into the PENDING state once their start time is reached.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async activateDueWhatsApp() {
    await this.withLock('activate-due-whatsapp', 55, async () => {
      const now = new Date();
      const result = await this.prisma.communicationMessage.updateMany({
        where: {
          channel: 'WHATSAPP',
          status: CommunicationMessageStatus.SCHEDULED,
          scheduledForAt: { lte: now },
        },
        data: { status: CommunicationMessageStatus.PENDING },
      });
      if (result.count > 0) {
        this.logger.log(`Activated ${result.count} scheduled WhatsApp messages.`);
      }
    });
  }

  /** Backfill Lead.businessId links for leads whose phone matches a Business. */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async backfillBusinessLinks() {
    await this.withLock('backfill-business-links', 3500, async () => {
      const leads = await this.prisma.lead.findMany({
        where: {
          businessId: null,
          phone: { not: null },
          NOT: { phone: '' },
          deletedAt: null,
          isPlaceholder: false,
        },
        select: { id: true },
        take: 500,
      });

      for (const lead of leads) {
        try {
          await this.engineService.reconcileJourneyState(lead.id);
        } catch (error) {
          this.logger.error(`Business-link backfill failed for lead ${lead.id}`, error);
        }
      }

      if (leads.length > 0) {
        this.logger.log(`Reconciled business links for ${leads.length} leads.`);
      }
    });
  }

  /** Reconcile subscription override for leads that became customers via any path. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async reconcileSubscriptions() {
    await this.withLock('reconcile-subscriptions', 240, async () => {
      // Leads marked CUSTOMER but whose journeyState is not yet SUBSCRIBED.
      const leads = await this.prisma.lead.findMany({
        where: {
          status: 'CUSTOMER',
          journeyState: { not: 'SUBSCRIBED' },
          deletedAt: null,
          isPlaceholder: false,
        },
        select: { id: true },
        take: 200,
      });

      for (const lead of leads) {
        try {
          await this.engineService.onSubscribed(lead.id);
        } catch (error) {
          this.logger.error(`Subscription reconcile failed for lead ${lead.id}`, error);
        }
      }

      if (leads.length > 0) {
        this.logger.log(`Reconciled ${leads.length} newly-subscribed leads.`);
      }
    });
  }

  /** Evaluate "still interested, not subscribed, after N days" rules. */
  @Cron(CronExpression.EVERY_HOUR)
  async evaluateStillInterested() {
    await this.withLock('evaluate-still-interested', 3500, async () => {
      const rules = await this.rulesService.findActiveByTrigger(
        AutomationTrigger.STILL_INTERESTED_NOT_SUBSCRIBED,
      );
      if (rules.length === 0) return;

      for (const rule of rules) {
        if (rule.waitDays <= 0) continue;
        const cutoff = new Date(Date.now() - rule.waitDays * 24 * 3600 * 1000);

        const leads = await this.prisma.lead.findMany({
          where: {
            journeyState: 'INTERESTED',
            journeyStateUpdatedAt: { lte: cutoff },
            deletedAt: null,
            isPlaceholder: false,
          },
          select: { id: true },
          take: 500,
        });

        for (const lead of leads) {
          // Dedup: only act if this rule has not already produced a message for this lead.
          const existing = await this.prisma.communicationMessage.findFirst({
            where: { ruleId: rule.id, leadId: lead.id },
            select: { id: true },
          });
          if (existing) continue;

          try {
            await this.engineService.evaluateRule(
              AutomationTrigger.STILL_INTERESTED_NOT_SUBSCRIBED,
              rule,
              lead.id,
            );
          } catch (error) {
            this.logger.error(`Still-interested rule ${rule.id} failed for lead ${lead.id}`, error);
          }
        }
      }
    });
  }

  /** Evaluate delayed LEAD_CREATED rules ("still new/contacted/visited after N days"). */
  @Cron(CronExpression.EVERY_HOUR)
  async evaluateLeadCreated() {
    await this.withLock('evaluate-lead-created', 3500, async () => {
      const rules = await this.rulesService.findActiveByTrigger(AutomationTrigger.LEAD_CREATED);
      if (rules.length === 0) return;

      for (const rule of rules) {
        if (rule.waitDays <= 0) continue;
        const cutoff = new Date(Date.now() - rule.waitDays * 24 * 3600 * 1000);

        const leads = await this.prisma.lead.findMany({
          where: {
            journeyState: { in: ['NEW', 'CONTACTED', 'VISITED'] },
            journeyStateUpdatedAt: { lte: cutoff },
            deletedAt: null,
            isPlaceholder: false,
          },
          select: { id: true },
          take: 500,
        });

        for (const lead of leads) {
          const existing = await this.prisma.communicationMessage.findFirst({
            where: { ruleId: rule.id, leadId: lead.id },
            select: { id: true },
          });
          if (existing) continue;

          try {
            await this.engineService.evaluateRule(AutomationTrigger.LEAD_CREATED, rule, lead.id);
          } catch (error) {
            this.logger.error(`LEAD_CREATED rule ${rule.id} failed for lead ${lead.id}`, error);
          }
        }
      }
    });
  }

  /**
   * Evaluate delayed BECAME_NOT_INTERESTED rules (admin-configured
   * re-engagement after N days). Immediate re-engagement rules (waitDays=0)
   * fire synchronously via onLeadStatusChanged.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async evaluateNotInterestedReEngagement() {
    await this.withLock('evaluate-not-interested-reengagement', 3500, async () => {
      const rules = await this.rulesService.findActiveByTrigger(
        AutomationTrigger.BECAME_NOT_INTERESTED,
      );
      if (rules.length === 0) return;

      for (const rule of rules) {
        if (rule.waitDays <= 0) continue;
        const cutoff = new Date(Date.now() - rule.waitDays * 24 * 3600 * 1000);

        const leads = await this.prisma.lead.findMany({
          where: {
            journeyState: 'NOT_INTERESTED',
            journeyStateUpdatedAt: { lte: cutoff },
            deletedAt: null,
            isPlaceholder: false,
          },
          select: { id: true },
          take: 500,
        });

        for (const lead of leads) {
          const existing = await this.prisma.communicationMessage.findFirst({
            where: { ruleId: rule.id, leadId: lead.id },
            select: { id: true },
          });
          if (existing) continue;

          try {
            await this.engineService.evaluateRule(
              AutomationTrigger.BECAME_NOT_INTERESTED,
              rule,
              lead.id,
            );
          } catch (error) {
            this.logger.error(`Re-engagement rule ${rule.id} failed for lead ${lead.id}`, error);
          }
        }
      }
    });
  }

  /** Evaluate before-expiry / after-expiry customer-journey rules daily. */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async evaluateExpiry() {
    await this.withLock('evaluate-expiry', 3500, async () => {
      await this.evaluateExpiryTrigger(AutomationTrigger.BEFORE_EXPIRY);
      await this.evaluateExpiryTrigger(AutomationTrigger.AFTER_EXPIRY);
    });
  }

  private async evaluateExpiryTrigger(trigger: AutomationTrigger) {
    const rules = await this.rulesService.findActiveByTrigger(trigger);
    if (rules.length === 0) return;

    const now = new Date();

    for (const rule of rules) {
      // waitDays=0 for BEFORE_EXPIRY means "expiring today"; otherwise the
      // window is [now, now + waitDays days].
      const days = Math.max(rule.waitDays, 0);
      const windowEnd =
        trigger === AutomationTrigger.BEFORE_EXPIRY && days === 0
          ? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
          : new Date(now.getTime() + days * 24 * 3600 * 1000);

      const businesses = await this.prisma.business.findMany({
        where:
          trigger === AutomationTrigger.BEFORE_EXPIRY
            ? {
                trialEndsAt: { gte: now, lte: windowEnd },
                // Only still-trial businesses should receive a renewal reminder;
                // ACTIVE (already subscribed), EXPIRED or CANCELLED are excluded.
                status: { in: ['TRIAL'] },
              }
            : { trialEndsAt: { lt: now } },
        select: { id: true, phone: true },
        orderBy: { createdAt: 'asc' },
        take: 200,
      });

      for (const business of businesses) {
        const clean = business.phone?.replace(/[^0-9]/g, '');
        const lead = await this.prisma.lead.findFirst({
          where: {
            deletedAt: null,
            isPlaceholder: false,
            OR: [
              // Prefer the persisted Lead<->Business link; fall back to phone.
              { businessId: business.id },
              ...(clean ? [{ phone: { contains: clean } }] : []),
            ],
          },
          select: { id: true },
        });
        if (!lead) continue;

        const existing = await this.prisma.communicationMessage.findFirst({
          where: { ruleId: rule.id, leadId: lead.id },
          select: { id: true },
        });
        if (existing) continue;

        try {
          await this.engineService.evaluateRule(trigger, rule, lead.id);
        } catch (error) {
          this.logger.error(`Expiry rule ${rule.id} failed for lead ${lead.id}`, error);
        }
      }
    }
  }
}
