import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAutomationRuleDto,
  ReorderRulesDto,
  UpdateAutomationRuleDto,
} from '../dto/rule.dto';
import { AutomationTrigger } from '@prisma/client';

@Injectable()
export class RulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rules = await this.prisma.automationRule.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { template: true },
    });
    return { data: rules };
  }

  async findOne(id: string) {
    const rule = await this.prisma.automationRule.findUnique({
      where: { id },
      include: { template: true },
    });
    if (!rule) throw new NotFoundException(`Rule ${id} not found`);
    return rule;
  }

  async findActiveByTrigger(trigger: AutomationTrigger) {
    return this.prisma.automationRule.findMany({
      where: { trigger, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { template: true },
    });
  }

  async create(dto: CreateAutomationRuleDto) {
    return this.prisma.automationRule.create({
      data: {
        name: dto.name,
        trigger: dto.trigger,
        condition: dto.condition as any ?? null,
        waitDays: dto.waitDays ?? 0,
        action: dto.action,
        channel: dto.channel ?? null,
        templateId: dto.templateId ?? null,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateAutomationRuleDto) {
    await this.findOne(id);
    return this.prisma.automationRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.trigger !== undefined ? { trigger: dto.trigger } : {}),
        ...(dto.condition !== undefined ? { condition: dto.condition as any } : {}),
        ...(dto.waitDays !== undefined ? { waitDays: dto.waitDays } : {}),
        ...(dto.action !== undefined ? { action: dto.action } : {}),
        ...(dto.channel !== undefined ? { channel: dto.channel } : {}),
        ...(dto.templateId !== undefined ? { templateId: dto.templateId } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
  }

  async setActive(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.automationRule.update({ where: { id }, data: { isActive } });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.automationRule.delete({ where: { id } });
    return { success: true };
  }

  async reorder(dto: ReorderRulesDto) {
    await this.prisma.$transaction(async (tx) => {
      for (let i = 0; i < dto.order.length; i++) {
        await tx.automationRule.update({
          where: { id: dto.order[i] },
          data: { sortOrder: i },
        });
      }
    });
    return { success: true };
  }
}
