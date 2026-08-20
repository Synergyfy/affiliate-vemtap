import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SMS_MAX_LENGTH, SUPPORTED_VARIABLES } from '../common/communication.constants';
import { MessageRendererService } from '../common/message-renderer.service';
import { CommunicationSettingsService } from '../settings/communication-settings.service';
import {
  CreateCommunicationTemplateDto,
  TemplateQueryDto,
  UpdateCommunicationTemplateDto,
} from '../dto/template.dto';
import { CommunicationChannel, CommunicationTemplateStatus, Prisma } from '@prisma/client';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly renderer: MessageRendererService,
    private readonly settingsService: CommunicationSettingsService,
  ) {}

  /**
   * Validate a template body for SMS length and blacklisted words.
   * Because exact variable values are unknown until send time, we validate against
   * representative values so over-length or prohibited templates are rejected early.
   */
  private async validateSms(body: string, channel: CommunicationChannel): Promise<void> {
    if (channel !== CommunicationChannel.SMS) return;
    this.renderer.assertSmsTemplateLength(body);
    const settings = await this.settingsService.getSettings();
    this.renderer.assertNoBlacklistedWords(body, channel, settings.smsBlacklistedWords);
  }

  async findAll(filters: TemplateQueryDto = {}) {
    const where: Prisma.CommunicationTemplateWhereInput = {};
    if (filters.channel) where.channel = filters.channel;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { body: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total, settings] = await Promise.all([
      this.prisma.communicationTemplate.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.communicationTemplate.count({ where }),
      this.settingsService.getSettings(),
    ]);

    return {
      data,
      total,
      smsMaxLength: SMS_MAX_LENGTH,
      supportedVariables: SUPPORTED_VARIABLES,
      smsBlacklistedWords: settings?.smsBlacklistedWords ?? [],
    };
  }


  async findOne(id: string) {
    const template = await this.prisma.communicationTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException(`Template ${id} not found`);
    return template;
  }

  async create(userId: string, dto: CreateCommunicationTemplateDto) {
    await this.validateSms(dto.body, dto.channel);
    return this.prisma.communicationTemplate.create({
      data: {
        name: dto.name,
        channel: dto.channel,
        body: dto.body,
        description: dto.description ?? null,
        createdById: userId,
      },
    });
  }

  async update(id: string, dto: UpdateCommunicationTemplateDto) {
    const existing = await this.findOne(id);
    if (dto.body) {
      const channel = dto.channel ?? existing.channel;
      await this.validateSms(dto.body, channel);
    }
    return this.prisma.communicationTemplate.update({
      where: { id },
      data: dto,
    });
  }

  async setStatus(id: string, status: CommunicationTemplateStatus) {
    await this.findOne(id);
    return this.prisma.communicationTemplate.update({
      where: { id },
      data: { status },
    });
  }
}
