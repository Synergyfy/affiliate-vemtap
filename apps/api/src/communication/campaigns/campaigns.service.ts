import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
import { MessageRendererService } from '../common/message-renderer.service';
import {
  CampaignActionDto,
  CreateCampaignDto,
  UpdateCampaignDto,
} from '../dto/campaign.dto';
import { CampaignStatus, CommunicationChannel, CommunicationMessageType } from '@prisma/client';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesService: MessagesService,
    private readonly renderer: MessageRendererService,
  ) {}

  async findAll(filters: { status?: CampaignStatus } = {}) {
    const where = filters.status ? { status: filters.status } : {};
    const [data, total] = await Promise.all([
      this.prisma.communicationCampaign.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: { template: true },
      }),
      this.prisma.communicationCampaign.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    const campaign = await this.prisma.communicationCampaign.findUnique({
      where: { id },
      include: { template: true },
    });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);
    return campaign;
  }

  async create(userId: string, dto: CreateCampaignDto) {
    return this.prisma.communicationCampaign.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        channels: dto.channels,
        templateId: dto.templateId ?? null,
        body: dto.body ?? null,
        audienceFilters: dto.audienceFilters as unknown as object,
        status: CampaignStatus.DRAFT,
        startAt: dto.startAt ? new Date(dto.startAt) : null,
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        createdById: userId,
      },
    });
  }

  async update(id: string, dto: UpdateCampaignDto) {
    await this.findOne(id);
    return this.prisma.communicationCampaign.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.channels !== undefined ? { channels: dto.channels } : {}),
        ...(dto.templateId !== undefined ? { templateId: dto.templateId } : {}),
        ...(dto.body !== undefined ? { body: dto.body } : {}),
        ...(dto.audienceFilters !== undefined ? { audienceFilters: dto.audienceFilters as any } : {}),
        ...(dto.startAt !== undefined ? { startAt: dto.startAt ? new Date(dto.startAt) : null } : {}),
        ...(dto.endAt !== undefined ? { endAt: dto.endAt ? new Date(dto.endAt) : null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });
  }

  async changeStatus(id: string, dto: CampaignActionDto) {
    const campaign = await this.findOne(id);
    const action = dto.action;

    // Only ACTIVE triggers fan-out. Guard against re-activating an already-active
    // campaign, which would otherwise duplicate every message.
    if (action === CampaignStatus.ACTIVE) {
      if (campaign.status === CampaignStatus.ACTIVE) {
        return this.findOne(id);
      }
      await this.activate(campaign.id);
      return this.findOne(id);
    }

    if (
      (action === CampaignStatus.PAUSED || action === CampaignStatus.CANCELLED) &&
      campaign.status === CampaignStatus.ACTIVE
    ) {
      // Cancel any pending/scheduled campaign messages.
      await this.prisma.communicationMessage.updateMany({
        where: {
          campaignId: id,
          status: { in: ['PENDING', 'SCHEDULED'] as any },
        },
        data: { status: 'CANCELLED' as any },
      });
    }

    return this.prisma.communicationCampaign.update({ where: { id }, data: { status: action } });
  }

  /**
   * Activate a campaign: fan out one message per channel per eligible contact.
   * Uses the shared message engine so frequency rules, phone requirements and
   * channel behaviour are respected uniformly.
   */
  private async activate(campaignId: string) {
    const campaign = await this.findOne(campaignId);

    const summary: Record<string, unknown> = {};
    const now = new Date();
    for (const channel of campaign.channels) {
      const body =
        campaign.body ??
        campaign.template?.body ??
        '';

      if (!body) {
        this.logger.warn(`Campaign ${campaignId} has no message body for ${channel}`);
        continue;
      }

      // Respect the campaign window: never fan out after the end date.
      if (campaign.endAt && campaign.endAt <= now) {
        this.logger.warn(
          `Campaign ${campaignId} end date already passed; skipping ${channel}.`,
        );
        continue;
      }

      // A campaign must not be activated with an SMS body that exceeds the
      // 160-character limit (worst-case variable substitution). Refuse instead
      // of silently skipping contacts at dispatch time.
      if (channel === CommunicationChannel.SMS) {
        this.renderer.assertSmsTemplateLength(body);
      }

      // Future start dates are honoured by scheduling: WhatsApp becomes PENDING
      // at start (cron), SMS is dispatched at start (cron).
      const scheduledForAt =
        campaign.startAt && campaign.startAt > now ? campaign.startAt : null;

      const result = await this.messagesService.createMessages({
        audience: campaign.audienceFilters as any,
        channel,
        body,
        templateId: campaign.templateId ?? undefined,
        campaignId,
        type: CommunicationMessageType.CAMPAIGN,
        scheduledForAt,
      });

      summary[channel] = result;
    }

    return {
      campaignId,
      eligibleContacts: Object.values(summary).reduce(
        (total, result: any) => total + (result?.created ?? 0),
        0,
      ),
      dispatch: summary,
    };
  }
}
