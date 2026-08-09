import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSalesPipelineDto,
  DuplicateCheckRequestDto,
  QualifyLeadDto,
  UpdateStageDto,
  SetExitStateDto,
  ScheduleFollowUpDto,
  CompleteFollowUpDto,
  ScheduleDemoDto,
  CompleteDemoDto,
  SalesFilterDto,
} from './dto/sales.dto';
import {
  SalesPipelineStage,
  SalesLeadQuality,
  SalesExitState,
  SalesFollowUpStatus,
  SalesDemoStatus,
} from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private prisma: PrismaService) {}

  async getPipeline(userId: string, filters?: SalesFilterDto) {
    const whereClause: any = { affiliateId: userId };

    if (filters?.stage) {
      whereClause.OR = [
        { pipelineStage: filters.stage as SalesPipelineStage },
        { exitState: filters.stage as SalesExitState },
      ];
    }

    if (filters?.search) {
      const q = filters.search.trim();
      whereClause.AND = [
        {
          OR: [
            { businessName: { contains: q, mode: 'insensitive' } },
            { contactName: { contains: q, mode: 'insensitive' } },
            { location: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
          ],
        },
      ];
    }

    const entries = await this.prisma.salesPipeline.findMany({
      where: whereClause,
      take: filters?.limit ? Number(filters.limit) : 100,
      orderBy: { updatedAt: 'desc' },
      include: {
        followUps: { orderBy: { createdAt: 'desc' }, take: 5 },
        demos: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    return {
      data: entries.map((e) => this.formatPipelineEntry(e)),
      meta: { total: entries.length },
    };
  }

  async createPipeline(userId: string, dto: CreateSalesPipelineDto) {
    const entry = await this.prisma.$transaction(async (tx) => {
      const created = await tx.salesPipeline.create({
        data: {
          affiliateId: userId,
          businessName: dto.businessName,
          industry: dto.industry || null,
          location: dto.location || null,
          contactName: dto.contactName || null,
          phone: dto.phone || null,
          email: dto.email || null,
          source: dto.source || 'Direct Referral',
          priority: dto.priority || 'MEDIUM',
          subscriptionInterest: dto.subscriptionInterest || false,
          notes: dto.notes || null,
          pipelineStage: SalesPipelineStage.NEW_LEAD,
          leadQuality: SalesLeadQuality.NEW,
        },
      });

      await tx.lead.create({
        data: {
          affiliateId: userId,
          businessName: dto.businessName,
          industry: dto.industry || 'General',
          location: dto.location || null,
          contactName: dto.contactName || null,
          phone: dto.phone || '08000000000',
          email: dto.email || null,
          source: dto.source || 'Direct Referral',
        },
      });

      return created;
    });

    return this.formatPipelineEntry(entry);
  }

  async getLeadDetail(userId: string, leadId: string) {
    const entry = await this.prisma.salesPipeline.findFirst({
      where: { id: leadId, affiliateId: userId },
      include: {
        followUps: { orderBy: { createdAt: 'desc' } },
        demos: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Sales lead ${leadId} not found`);
    }

    return this.formatPipelineEntry(entry);
  }

  async checkDuplicate(userId: string, dto: DuplicateCheckRequestDto) {
    if (!dto.businessName && !dto.phone) {
      return { isMatch: false, confidence: 'LOW' };
    }

    const cleanPhone = dto.phone ? dto.phone.replace(/[^0-9]/g, '') : null;

    const existing = await this.prisma.salesPipeline.findFirst({
      where: {
        affiliateId: userId,
        OR: [
          dto.businessName
            ? { businessName: { equals: dto.businessName.trim(), mode: 'insensitive' } }
            : {},
          cleanPhone ? { phone: { contains: cleanPhone } } : {},
        ],
      },
    });

    if (existing) {
      return {
        isMatch: true,
        existingBusiness: {
          id: existing.id,
          businessName: existing.businessName,
          status: existing.pipelineStage,
          leadQuality: existing.leadQuality,
          contactName: existing.contactName,
          phone: existing.phone,
        },
        confidence: 'HIGH',
        reason: 'Business name or phone number matches an existing lead in your pipeline.',
      };
    }

    return { isMatch: false, confidence: 'LOW' };
  }

  async qualifyLead(userId: string, leadId: string, dto: QualifyLeadDto) {
    const entry = await this.prisma.salesPipeline.findFirst({
      where: { id: leadId, affiliateId: userId },
    });

    if (!entry) throw new NotFoundException(`Sales lead ${leadId} not found`);

    let qualityEnum: SalesLeadQuality = SalesLeadQuality.QUALIFIED;
    if (dto.quality === 'UNQUALIFIED') qualityEnum = SalesLeadQuality.UNQUALIFIED;
    else if (dto.quality === 'INTERESTED') qualityEnum = SalesLeadQuality.INTERESTED;
    else if (dto.quality === 'CONVERTED') qualityEnum = SalesLeadQuality.CONVERTED;
    else if (dto.quality === 'INVALID') qualityEnum = SalesLeadQuality.INVALID;

    const updated = await this.prisma.salesPipeline.update({
      where: { id: leadId },
      data: {
        leadQuality: qualityEnum,
        notes: dto.reason ? `${entry.notes || ''}\n[Qualify Note]: ${dto.reason}` : entry.notes,
      },
    });

    return this.formatPipelineEntry(updated);
  }

  async updateStage(userId: string, leadId: string, dto: UpdateStageDto) {
    const entry = await this.prisma.salesPipeline.findFirst({
      where: { id: leadId, affiliateId: userId },
    });

    if (!entry) throw new NotFoundException(`Sales lead ${leadId} not found`);

    const updated = await this.prisma.salesPipeline.update({
      where: { id: leadId },
      data: {
        pipelineStage: dto.stage,
        leadQuality: dto.stage === SalesPipelineStage.CUSTOMER ? SalesLeadQuality.CONVERTED : entry.leadQuality,
      },
    });

    return this.formatPipelineEntry(updated);
  }

  async setExitState(userId: string, leadId: string, dto: SetExitStateDto) {
    const entry = await this.prisma.salesPipeline.findFirst({
      where: { id: leadId, affiliateId: userId },
    });

    if (!entry) throw new NotFoundException(`Sales lead ${leadId} not found`);

    let quality = entry.leadQuality;
    if (dto.exitState === SalesExitState.NOT_INTERESTED) quality = SalesLeadQuality.UNQUALIFIED;
    else if (dto.exitState === SalesExitState.INVALID) quality = SalesLeadQuality.INVALID;
    else if (dto.exitState === SalesExitState.DUPLICATE) quality = SalesLeadQuality.DUPLICATE;

    const updated = await this.prisma.salesPipeline.update({
      where: { id: leadId },
      data: {
        exitState: dto.exitState,
        leadQuality: quality,
      },
    });

    return this.formatPipelineEntry(updated);
  }

  async scheduleFollowUp(userId: string, leadId: string, dto: ScheduleFollowUpDto) {
    const entry = await this.prisma.salesPipeline.findFirst({
      where: { id: leadId, affiliateId: userId },
    });

    if (!entry) throw new NotFoundException(`Sales lead ${leadId} not found`);

    const followUpDate = new Date(dto.scheduledDate);

    await this.prisma.salesFollowUp.create({
      data: {
        pipelineId: leadId,
        userId,
        scheduledDate: followUpDate,
        scheduledTime: dto.scheduledTime || null,
        notes: dto.notes || null,
        status: SalesFollowUpStatus.PENDING,
      },
    });

    const updated = await this.prisma.salesPipeline.update({
      where: { id: leadId },
      data: {
        followUpDate,
      },
    });

    return this.formatPipelineEntry(updated);
  }

  async completeFollowUp(userId: string, leadId: string, dto: CompleteFollowUpDto) {
    const pending = await this.prisma.salesFollowUp.findFirst({
      where: { pipelineId: leadId, userId, status: SalesFollowUpStatus.PENDING },
      orderBy: { scheduledDate: 'asc' },
    });

    if (pending) {
      await this.prisma.salesFollowUp.update({
        where: { id: pending.id },
        data: {
          status: SalesFollowUpStatus.COMPLETED,
          outcome: dto.outcome,
          notes: dto.notes || pending.notes,
        },
      });
    }

    return { success: true };
  }

  async scheduleDemo(userId: string, leadId: string, dto: ScheduleDemoDto) {
    const entry = await this.prisma.salesPipeline.findFirst({
      where: { id: leadId, affiliateId: userId },
    });

    if (!entry) throw new NotFoundException(`Sales lead ${leadId} not found`);

    const demoDate = new Date(dto.scheduledDate);

    await this.prisma.salesDemo.create({
      data: {
        pipelineId: leadId,
        userId,
        scheduledDate: demoDate,
        scheduledTime: dto.scheduledTime || null,
        type: dto.type,
        meetingUrl: dto.meetingUrl || null,
        notes: dto.notes || null,
        status: SalesDemoStatus.SCHEDULED,
      },
    });

    const updated = await this.prisma.salesPipeline.update({
      where: { id: leadId },
      data: {
        demoScheduledDate: demoDate,
        demoType: dto.type,
        demoMeetingUrl: dto.meetingUrl || null,
        pipelineStage: SalesPipelineStage.DEMO_SCHEDULED,
      },
    });

    return this.formatPipelineEntry(updated);
  }

  async completeDemo(userId: string, leadId: string, dto: CompleteDemoDto) {
    const pendingDemo = await this.prisma.salesDemo.findFirst({
      where: { pipelineId: leadId, userId, status: SalesDemoStatus.SCHEDULED },
      orderBy: { scheduledDate: 'asc' },
    });

    if (pendingDemo) {
      await this.prisma.salesDemo.update({
        where: { id: pendingDemo.id },
        data: {
          status: SalesDemoStatus.COMPLETED,
          outcome: dto.outcome,
          notes: dto.notes || pendingDemo.notes,
        },
      });
    }

    const updated = await this.prisma.salesPipeline.update({
      where: { id: leadId },
      data: {
        pipelineStage: SalesPipelineStage.CUSTOMER,
        leadQuality: SalesLeadQuality.CONVERTED,
      },
    });

    return this.formatPipelineEntry(updated);
  }

  async getMetrics(userId: string) {
    const entries = await this.prisma.salesPipeline.findMany({
      where: { affiliateId: userId },
    });

    const metrics = {
      leadsSubmitted: entries.length,
      validLeads: entries.filter((e) => e.leadQuality && !['INVALID', 'DUPLICATE'].includes(e.leadQuality)).length,
      qualifiedLeads: entries.filter((e) => e.leadQuality === 'QUALIFIED' || e.leadQuality === 'CONVERTED').length,
      interestedLeads: entries.filter((e) => e.leadQuality === 'INTERESTED').length,
      followUps: entries.filter((e) => e.followUpDate != null).length,
      demos: entries.filter((e) => e.demoScheduledDate != null).length,
      conversions: entries.filter((e) => e.pipelineStage === 'CUSTOMER').length,
      notInterested: entries.filter((e) => e.exitState === 'NOT_INTERESTED').length,
      lost: entries.filter((e) => e.exitState === 'LOST').length,
      invalid: entries.filter((e) => e.leadQuality === 'INVALID' || e.exitState === 'INVALID').length,
      duplicate: entries.filter((e) => e.leadQuality === 'DUPLICATE' || e.exitState === 'DUPLICATE').length,
    };

    return {
      metrics,
      date: new Date().toISOString(),
    };
  }

  async getFollowUps(userId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const followUps = await this.prisma.salesFollowUp.findMany({
      where: { userId },
      include: { pipeline: true },
      orderBy: { scheduledDate: 'asc' },
    });

    const formatted = followUps.map((f) => ({
      id: f.id,
      leadId: f.pipelineId,
      scheduledDate: f.scheduledDate.toISOString(),
      scheduledTime: f.scheduledTime,
      status: f.status,
      notes: f.notes,
      businessName: f.pipeline.businessName,
      contactName: f.pipeline.contactName,
      phone: f.pipeline.phone,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
    }));

    return {
      dueToday: formatted.filter((f) => {
        const d = new Date(f.scheduledDate);
        return d >= startOfToday && d <= endOfToday && f.status === 'PENDING';
      }),
      overdue: formatted.filter((f) => {
        const d = new Date(f.scheduledDate);
        return d < startOfToday && f.status === 'PENDING';
      }),
      upcoming: formatted.filter((f) => {
        const d = new Date(f.scheduledDate);
        return d > endOfToday && f.status === 'PENDING';
      }),
    };
  }

  private formatPipelineEntry(e: any) {
    return {
      id: e.id,
      businessName: e.businessName,
      industry: e.industry,
      location: e.location,
      contactName: e.contactName,
      phone: e.phone,
      email: e.email,
      source: e.source,
      pipelineStage: e.pipelineStage,
      leadQuality: e.leadQuality,
      exitState: e.exitState,
      priority: e.priority,
      subscriptionInterest: e.subscriptionInterest,
      followUpDate: e.followUpDate ? new Date(e.followUpDate).toISOString().split('T')[0] : undefined,
      demoScheduledDate: e.demoScheduledDate ? new Date(e.demoScheduledDate).toISOString() : undefined,
      demoType: e.demoType,
      demoMeetingUrl: e.demoMeetingUrl,
      notes: e.notes,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      activities: (e.followUps || []).map((fu: any) => ({
        id: fu.id,
        type: 'FOLLOW_UP',
        title: `Follow up: ${fu.status}`,
        createdAt: fu.createdAt.toISOString(),
      })),
    };
  }
}
