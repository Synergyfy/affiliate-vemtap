import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JourneyState, phoneSearchTail } from '../common/communication.constants';

/**
 * Lead shape (plus optional relations) needed to resolve a journey state.
 * Kept loose to accept both raw Lead rows and Lead rows with nested relations.
 */
export type JourneyLead = {
  id: string;
  status: string;
  deletedAt: Date | null;
  isPlaceholder: boolean;
  nextFollowUpAt?: Date | null;
  followUpDate?: Date | null;
  salesPipelines?: Array<{
    pipelineStage?: string;
    exitState?: string | null;
    leadQuality?: string;
  }>;
};

@Injectable()
export class JourneyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve the canonical journey state for a Lead given its sales signals.
   * Business (subscription/expiry) signals are passed in optionally to avoid an
   * extra query when the caller already has them.
   */
  resolveJourneyState(lead: JourneyLead, businessStatus?: string | null): JourneyState {
    if (lead.deletedAt || lead.isPlaceholder) {
      return 'LOST_CLOSED';
    }

    const status = (lead.status || '').toUpperCase();
    const pipeline = lead.salesPipelines?.[0];
    const stage = (pipeline?.pipelineStage || '').toUpperCase();
    const exit = (pipeline?.exitState || '').toUpperCase();

    // Expiry/loss from the business subscription takes priority: a customer
    // whose subscription lapsed is no longer an active subscriber, so the
    // customer journey can run win-back/expiry messaging against them.
    if (businessStatus === 'EXPIRED') return 'EXPIRED';
    if (businessStatus === 'CANCELLED') return 'LOST_CLOSED';

    // Subscribed / customer — business ACTIVE also means subscribed.
    if (
      status === 'CUSTOMER' ||
      stage === 'CUSTOMER' ||
      (pipeline?.leadQuality || '').toUpperCase() === 'CONVERTED' ||
      businessStatus === 'ACTIVE'
    ) {
      return 'SUBSCRIBED';
    }

    // Lost via pipeline exit
    if (exit === 'LOST') return 'LOST_CLOSED';
    if (exit === 'INVALID' || exit === 'DUPLICATE') return 'LOST_CLOSED';

    // Not interested
    if (status === 'NOT_INTERESTED' || exit === 'NOT_INTERESTED') {
      return 'NOT_INTERESTED';
    }

    // Interested
    if (status === 'INTERESTED' || stage === 'INTERESTED') {
      return 'INTERESTED';
    }

    // Follow-up required (a future-dated follow-up exists)
    if (lead.nextFollowUpAt || lead.followUpDate) {
      return 'FOLLOW_UP_REQUIRED';
    }

    // Contacted / visited
    if (status === 'CONTACTED' || stage === 'CONTACTED') return 'CONTACTED';
    if (status === 'VISITED' || stage === 'VISITED') return 'VISITED';

    // New / default
    return 'NEW';
  }

  /**
   * Resolve the journey state for a lead id by loading the lead + its relations
   * and the business subscription status (via the lead's pipelines -> business,
   * falling back to a business row that references this lead's phone).
   */
  async resolveJourneyStateForLead(leadId: string): Promise<JourneyState> {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        salesPipelines: {
          select: {
            pipelineStage: true,
            exitState: true,
            leadQuality: true,
          },
          take: 1,
        },
      },
    });

    if (!lead) return 'LOST_CLOSED';

    const business = lead.businessId
      ? await this.prisma.business.findUnique({
          where: { id: lead.businessId },
          select: { status: true },
        })
      : await this.resolveBusinessStatus(lead.phone);
    return this.resolveJourneyState(lead, business?.status ?? null);
  }

  private async resolveBusinessStatus(phone?: string | null): Promise<{ status: string } | null> {
    // Fallback phone matching for leads not yet linked to a Business row.
    const tail = phoneSearchTail(phone);
    if (!tail) return null;

    const business = await this.prisma.business.findFirst({
      where: { phone: { contains: tail } },
      select: { status: true },
      orderBy: { updatedAt: 'desc' },
    });
    return business ?? null;
  }

  /** Build a Prisma Lead where-clause that selects leads matching a journey state. */
  journeyStateWhereClause(
    state: JourneyState,
    where: Prisma.LeadWhereInput = {},
  ): Prisma.LeadWhereInput {
    const base: Prisma.LeadWhereInput = {
      ...where,
      deletedAt: null,
      isPlaceholder: false,
    };

    switch (state) {
      case 'NEW':
        return { ...base, status: { in: ['NOT_YET', 'POTENTIAL'] } };
      case 'CONTACTED':
        return { ...base, status: 'CONTACTED' };
      case 'VISITED':
        return { ...base, status: 'VISITED' };
      case 'INTERESTED':
        return {
          ...base,
          status: {
            in: ['INTERESTED', 'DEMO_SCHEDULED', 'DEMO_DONE'],
          },
        };
      case 'FOLLOW_UP_REQUIRED':
        return {
          ...base,
          status: { notIn: ['CUSTOMER', 'NOT_INTERESTED'] },
          OR: [
            { nextFollowUpAt: { not: null } },
            { followUpDate: { not: null } },
          ],
        };
      case 'NOT_INTERESTED':
        return { ...base, status: 'NOT_INTERESTED' };
      case 'SUBSCRIBED':
        return { ...base, status: 'CUSTOMER' };
      case 'LOST_CLOSED':
        // Lost/closed leads are identified by pipeline exit state (the 
        // Lead.status alone cannot express "lost").
        return {
          ...base,
          salesPipelines: {
            some: {
              OR: [
                { exitState: { in: ['LOST', 'INVALID', 'DUPLICATE'] } },
                { leadQuality: { in: ['INVALID', 'DUPLICATE'] } },
              ],
            },
          },
        };
      case 'EXPIRED':
        // EXPIRED is a business-subscription state. When a Lead is linked to a
        // Business row (via `businessId`, backfilled by the daily cron or the
        // notification hooks) it can be selected directly. Leads that are not
        // yet linked cannot be expressed by a Lead-only query and are excluded
        // rather than matching the entire contact DB.
        return {
          ...base,
          business: { is: { status: 'EXPIRED' } },
        };
      default:
        return base;
    }
  }
}
