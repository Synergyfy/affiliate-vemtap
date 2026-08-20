import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AudienceService } from '../audience/audience.service';
import { phoneToInternational, WHATSAPP_DEEP_LINK_PREFIX } from '../common/communication.constants';
import { CommunicationChannel, CommunicationMessageStatus, Prisma } from '@prisma/client';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audienceService: AudienceService,
  ) {}

  /** Build the WhatsApp deep link for an already-rendered message + phone. */
  buildDeepLink(phone?: string | null, body?: string | null): string | null {
    const international = phoneToInternational(phone);
    if (!international) return null;
    const base = `${WHATSAPP_DEEP_LINK_PREFIX}/${international}`;
    return body ? `${base}?text=${encodeURIComponent(body)}` : base;
  }

  /**
   * List the WhatsApp follow-up queue: PENDING WhatsApp messages ready to send,
   * oldest first, with deep links. Salespeople see their own leads' follow-ups;
   * admins/privileged users see the global queue.
   */
  async getQueue(user?: { id: string; role: string }, filters: { leadId?: string } = {}) {
    const where: Prisma.CommunicationMessageWhereInput = {
      channel: CommunicationChannel.WHATSAPP,
      status: CommunicationMessageStatus.PENDING,
    };
    if (filters.leadId) where.leadId = filters.leadId;

    if (user) {
      const visible = await this.audienceService.resolveVisibleUserIds(user.id, user.role);
      if (visible) {
        // A salesperson works their own (and their team's) leads' follow-ups.
        where.lead = { userId: { in: visible } };
      }
    }

    const messages = await this.prisma.communicationMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        lead: {
          select: {
            id: true,
            businessName: true,
            contactName: true,
            phone: true,
            location: true,
          },
        },
      },
      take: 200,
    });

    return messages.map((m) => ({
      id: m.id,
      leadId: m.leadId,
      businessName: m.lead?.businessName ?? null,
      contactName: m.lead?.contactName ?? null,
      phone: m.phone,
      location: m.lead?.location ?? null,
      body: m.body,
      deepLink: this.buildDeepLink(m.phone, m.body),
      preparedAt: m.preparedAt,
      createdAt: m.createdAt,
      type: m.type,
    }));
  }

  /**
   * Mark a prepared WhatsApp message as SENT. This is the explicit user action
   * after they actually sent the message from WhatsApp — VEMTAP never pretends
   * a message was sent that the user did not send.
   *
   * A salesperson may only mark their own leads' messages; admins may mark any.
   */
  async markAsSent(messageId: string, user: { id: string; role: string }) {
    const message = await this.prisma.communicationMessage.findUnique({
      where: { id: messageId },
      include: { lead: { select: { userId: true } } },
    });
    if (!message) throw new BadRequestException(`Message ${messageId} not found`);
    if (message.channel !== CommunicationChannel.WHATSAPP) {
      throw new BadRequestException('Not a WhatsApp message');
    }
    if (message.status !== CommunicationMessageStatus.PENDING) {
      throw new BadRequestException(`Message is not pending (status: ${message.status})`);
    }

    const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (!isPrivileged && message.lead?.userId !== user.id) {
      // Supervisors/managers may complete follow-ups for their team's leads
      // (the same scope used to surface the queue). Other roles may only mark
      // their own leads.
      const canManageTeam =
        user.role === 'SUPERVISOR' || user.role === 'MANAGER';
      if (canManageTeam) {
        const visible = await this.audienceService.resolveVisibleUserIds(
          user.id,
          user.role,
        );
        const allowed = visible === null || visible.includes(message.lead!.userId);
        if (!allowed) {
          throw new ForbiddenException(
            'You can only mark follow-ups for your own or your team\'s leads as sent',
          );
        }
      } else {
        throw new ForbiddenException(
          'You can only mark follow-ups for your own leads as sent',
        );
      }
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.communicationMessage.update({
        where: { id: messageId },
        data: {
          status: CommunicationMessageStatus.SENT,
          sentAt: now,
          markedSentAt: now,
          sentById: user.id,
        },
      });
      await tx.lead.update({
        where: { id: message.leadId },
        data: { lastContactedAt: now },
      });
    });

    return { success: true, messageId };
  }
}
