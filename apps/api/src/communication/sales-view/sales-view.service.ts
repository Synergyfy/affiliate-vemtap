import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { AudienceService } from '../audience/audience.service';
import { CommunicationChannel, CommunicationMessageStatus } from '@prisma/client';

@Injectable()
export class SalesViewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsAppService,
    private readonly audienceService: AudienceService,
  ) {}

  /**
   * "Today's follow-ups" for a salesperson. Returns their leads (and their team's
   * leads, for supervisors/managers) WhatsApp follow-ups due and SMS scheduled
   * today, so the Sales team has an actionable list without needing to
   * understand Admin configuration.
   */
  async today(user: { id: string; role: string }) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const visible = await this.audienceService.resolveVisibleUserIds(user.id, user.role);
    const scopeUserIds = visible ?? null;

    // Leads owned by this salesperson (or their team).
    const myLeadIds = await this.prisma.lead.findMany({
      where: {
        ...(scopeUserIds ? { userId: { in: scopeUserIds } } : {}),
        deletedAt: null,
        isPlaceholder: false,
      },
      select: { id: true },
    });
    const leadIdSet = new Set(myLeadIds.map((l) => l.id));

    const [whatsappPending, smsScheduled] = await Promise.all([
      this.prisma.communicationMessage.findMany({
        where: {
          channel: CommunicationChannel.WHATSAPP,
          status: CommunicationMessageStatus.PENDING,
          sentById: null,
        },
        include: { lead: { select: { userId: true, businessName: true, status: true } } },
        orderBy: { createdAt: 'asc' },
        take: 200,
      }),
      this.prisma.communicationMessage.findMany({
        where: {
          channel: CommunicationChannel.SMS,
          status: CommunicationMessageStatus.SCHEDULED,
          scheduledForAt: { gte: startOfToday, lte: endOfToday },
        },
        include: { lead: { select: { userId: true, businessName: true, status: true } } },
        orderBy: { scheduledForAt: 'asc' },
        take: 200,
      }),
    ]);

    const whatsappFollowUps = whatsappPending
      .filter((m) => leadIdSet.has(m.leadId))
      .map((m) => ({
        id: m.id,
        leadId: m.leadId,
        businessName: m.lead?.businessName ?? null,
        status: m.lead?.status ?? null,
        phone: m.phone,
        channel: 'WHATSAPP',
        label: 'WhatsApp follow-up due',
        deepLink: this.whatsappService.buildDeepLink(m.phone, m.body),
        body: m.body,
        scheduledForAt: m.scheduledForAt,
        createdAt: m.createdAt,
      }));

    const smsItems = smsScheduled
      .filter((m) => leadIdSet.has(m.leadId))
      .map((m) => ({
        id: m.id,
        leadId: m.leadId,
        businessName: m.lead?.businessName ?? null,
        status: m.lead?.status ?? null,
        phone: m.phone,
        channel: 'SMS',
        label: 'SMS scheduled',
        body: m.body,
        scheduledForAt: m.scheduledForAt,
      }));

    return {
      whatsappFollowUps,
      smsScheduled: smsItems,
      total: whatsappFollowUps.length + smsItems.length,
    };
  }
}
