import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CommunicationChannel, CommunicationMessageStatus } from '@prisma/client';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Admin Communication Overview dashboard. */
  async overview() {
    const [
      totalContacts,
      whatsappEligible,
      whatsappPending,
      whatsappSent,
      smsSent,
      smsPending,
      smsFailed,
      scheduled,
      activeCampaigns,
      totalTemplates,
      activeRules,
    ] = await Promise.all([
      this.prisma.lead.count({ where: { deletedAt: null, isPlaceholder: false } }),
      this.prisma.lead.count({
        where: {
          deletedAt: null,
          isPlaceholder: false,
          phone: { not: null },
          NOT: { phone: '' },
          status: { notIn: ['CUSTOMER', 'NOT_INTERESTED'] },
        },
      }),
      this.prisma.communicationMessage.count({
        where: { channel: CommunicationChannel.WHATSAPP, status: CommunicationMessageStatus.PENDING },
      }),
      this.prisma.communicationMessage.count({
        where: { channel: CommunicationChannel.WHATSAPP, status: CommunicationMessageStatus.SENT },
      }),
      this.prisma.communicationMessage.count({
        where: { channel: CommunicationChannel.SMS, status: CommunicationMessageStatus.SENT },
      }),
      this.prisma.communicationMessage.count({
        where: { channel: CommunicationChannel.SMS, status: CommunicationMessageStatus.PENDING },
      }),
      this.prisma.communicationMessage.count({
        where: { channel: CommunicationChannel.SMS, status: CommunicationMessageStatus.FAILED },
      }),
      this.prisma.communicationMessage.count({
        where: { status: CommunicationMessageStatus.SCHEDULED },
      }),
      this.prisma.communicationCampaign.count({ where: { status: 'ACTIVE' } }),
      this.prisma.communicationTemplate.count(),
      this.prisma.automationRule.count({ where: { isActive: true } }),
    ]);

    return {
      overview: {
        totalContacts,
        contactsEligibleForWhatsApp: whatsappEligible,
        whatsappFollowUpsPending: whatsappPending,
        whatsappMessagesSent: whatsappSent,
        smsSent,
        smsPending,
        smsFailed,
        scheduledMessages: scheduled,
        activeCampaigns,
      },
      config: {
        totalTemplates,
        activeRules,
      },
    };
  }

  /** Communication Performance report. */
  async reporting(filters: { channel?: CommunicationChannel; from?: string; to?: string } = {}) {
    const where =
      filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {};

    const channel = filters.channel;

    const whatsapp =
      !channel || channel === CommunicationChannel.WHATSAPP
        ? await this.prisma.communicationMessage.groupBy({
            by: ['status'],
            where: { ...where, channel: CommunicationChannel.WHATSAPP },
            _count: { id: true },
          })
        : [];

    const sms =
      !channel || channel === CommunicationChannel.SMS
        ? await this.prisma.communicationMessage.groupBy({
            by: ['status'],
            where: { ...where, channel: CommunicationChannel.SMS },
            _count: { id: true },
          })
        : [];

    const reduce = (rows: { status: string; _count: { id: number } }[]) =>
      rows.reduce((acc, r) => ({ ...acc, [r.status]: r._count.id }), {});

    // Conversion: contacts contacted vs subscribed.
    const [leadsContacted, leadsSubscribed] = await Promise.all([
      this.prisma.lead.count({
        where: {
          deletedAt: null,
          isPlaceholder: false,
          lastContactedAt: { not: null },
        },
      }),
      this.prisma.lead.count({
        where: { deletedAt: null, isPlaceholder: false, journeyState: 'SUBSCRIBED' },
      }),
    ]);

    return {
      whatsapp: reduce(whatsapp as any),
      sms: reduce(sms as any),
      conversion: {
        leadsContacted,
        leadsSubscribed,
        conversionRate:
          leadsContacted > 0 ? Math.round((leadsSubscribed / leadsContacted) * 100) / 100 : 0,
      },
    };
  }
}
