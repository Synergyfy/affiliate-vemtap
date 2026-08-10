import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto, LeadFilterDto } from './dto/leads.dto';
import { LeadStatus } from '@prisma/client';
import { evaluateLeadQuality } from '../performance/lead-quality.util';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any, filters: LeadFilterDto) {
    const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const where: any = {
      deletedAt: null,
      ...(isPrivileged ? {} : { affiliateId: user.id }),
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { businessName: { contains: filters.search, mode: 'insensitive' } },
        { contactName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        take: filters.take,
        skip: filters.skip,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page: filters.page,
        limit: filters.limit || 10,
        totalPages: Math.ceil(total / (filters.limit || 10)),
      },

    };
  }


  async findOne(id: string, user: any) {
    const lead = await this.prisma.lead.findUnique({
      where: { id, deletedAt: null },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (!isPrivileged && lead.affiliateId !== user.id) {
      throw new ForbiddenException('You do not have access to this lead');
    }

    return lead;
  }

  async create(userId: string, dto: CreateLeadDto) {
    const quality = evaluateLeadQuality({
      businessName: dto.businessName,
      businessAddress: dto.businessAddress,
      location: dto.location,
      industry: dto.industry,
      phone: dto.phone,
      email: dto.email,
      contactName: dto.contactName,
      contactRole: dto.contactRole,
      website: dto.website,
    });

    const config = await this.prisma.performanceConfig.findFirst();
    const passThreshold = config?.leadQualityPassThreshold ?? 60;
    const now = new Date();

    const existing = await this.prisma.lead.findFirst({
      where: {
        affiliateId: userId,
        deletedAt: null,
        businessName: { equals: dto.businessName, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
    });

    const isDuplicate = !!existing;
    const qualityScore = isDuplicate ? Math.min(quality.score, passThreshold - 1) : quality.score;

    const lead = await this.prisma.lead.create({
      data: {
        ...dto,
        affiliateId: userId,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        qualityScore,
        isDuplicate,
        duplicateOfId: isDuplicate ? existing!.id : null,
        qualifiedAt: !isDuplicate && qualityScore >= passThreshold ? now : null,
        rejectedAt: !isDuplicate && qualityScore < passThreshold ? now : null,
        rejectionReason: !isDuplicate && qualityScore < passThreshold
          ? `Incomplete data (score ${qualityScore}/100)`
          : null,
      },
    });

    this.detectSubmissionAnomaly(userId, lead, dto).catch(() => undefined);

    return { ...lead, quality: { score: qualityScore, breakdown: quality.breakdown, missing: quality.missing } };
  }

  private async detectSubmissionAnomaly(userId: string, lead: any, dto: CreateLeadDto) {
    const config = await this.prisma.performanceConfig.findFirst();
    const windowMin = config?.burstSubmissionWindowMinutes ?? 10;
    const maxLeads = config?.burstSubmissionMaxLeads ?? 15;
    const since = new Date(Date.now() - windowMin * 60000);

    const [recentCount, sameLocationCount] = await Promise.all([
      this.prisma.lead.count({
        where: { affiliateId: userId, createdAt: { gte: since } },
      }),
      lead.isDuplicate
        ? Promise.resolve(0)
        : this.prisma.lead.count({
            where: {
              affiliateId: userId,
              deletedAt: null,
              location: dto.location ?? undefined,
              id: { not: lead.id },
            },
          }),
    ]);

    const anomalies: { type: any; description: string; evidence?: any }[] = [];

    if (recentCount >= maxLeads) {
      anomalies.push({
        type: 'BURST_SUBMISSION',
        description: `${recentCount} leads submitted within ${windowMin} minutes`,
        evidence: { count: recentCount, windowMinutes: windowMin },
      });
    }

    if (sameLocationCount >= 3) {
      anomalies.push({
        type: 'SAME_LOCATION_MULTIPLE_BUSINESSES',
        description: `${sameLocationCount + 1} businesses recorded at the same location`,
        evidence: { location: dto.location, count: sameLocationCount + 1 },
      });
    }

    for (const a of anomalies) {
      await this.prisma.activityAnomaly.create({
        data: { userId, ...a },
      });
    }
  }

  async update(id: string, user: any, dto: UpdateLeadDto) {
    const lead = await this.findOne(id, user);

    return this.prisma.lead.update({
      where: { id },
      data: {
        ...dto,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : lead.followUpDate,
      },
    });
  }

  async remove(id: string, user: any) {
    await this.findOne(id, user);
    return this.prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getStats(user: any) {
    const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const where: any = isPrivileged ? {} : { affiliateId: user.id };

    const [total, contacted, interested, potential] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({ where: { ...where, status: LeadStatus.CONTACTED } }),
      this.prisma.lead.count({ where: { ...where, status: LeadStatus.INTERESTED } }),
      this.prisma.lead.count({ where: { ...where, status: LeadStatus.POTENTIAL } }),
    ]);

    return {
      total,
      contacted,
      interested,
      potential,
    };
  }

}
