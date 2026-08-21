import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateJourneyDto } from './dto/update-journey.dto';

@Injectable()
export class JourneyService {
  constructor(private readonly prisma: PrismaService) {}

  /** List the configured customer-journey stages in execution order. */
  async getStages() {
    return this.prisma.customerJourneyStage.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        template: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Replace all journey stages with the submitted (ordered) array. Runs inside
   * a transaction so the swap is atomic. Every referenced template is validated
   * up-front so a bad templateId surfaces as a 404 instead of a Prisma FK error.
   */
  async replaceStages(dto: UpdateJourneyDto) {
    const templateIds = dto.stages
      .map((s) => s.templateId)
      .filter((id): id is string => Boolean(id));

    if (templateIds.length > 0) {
      const found = await this.prisma.communicationTemplate.findMany({
        where: { id: { in: templateIds } },
        select: { id: true },
      });
      const foundIds = new Set(found.map((t) => t.id));
      const missing = templateIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new NotFoundException(`Template(s) not found: ${missing.join(', ')}`);
      }
    }

    const created = await this.prisma.$transaction(async (tx) => {
      await tx.customerJourneyStage.deleteMany({});
      if (dto.stages.length === 0) return [];

      const createdStages = await tx.customerJourneyStage.createManyAndReturn({
        data: dto.stages.map((stage, index) => ({
          name: stage.name,
          waitDays: stage.waitDays,
          channel: stage.channel,
          templateId: stage.templateId ?? null,
          enabled: stage.enabled,
          sortOrder: index,
        })),
      });
      return createdStages.sort((a, b) => a.sortOrder - b.sortOrder);
    });

    return created;
  }
}