import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto, LeadFilterDto } from './dto/leads.dto';
import { isVisitedLeadStatus, normalizeLeadStatus } from '../common/lead.constants';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any, filters: LeadFilterDto) {
    const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const where: any = {
      deletedAt: null,
      isPlaceholder: false,
      ...(isPrivileged ? {} : { userId: user.id }),
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.visited === true) {
      where.visitedAt = { not: null };
    } else if (filters.visited === false) {
      where.visitedAt = null;
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
      data: data.map((lead) => ({ ...lead, visited: lead.visitedAt != null })),
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
      where: { id },
    });

    if (!lead || lead.deletedAt || lead.isPlaceholder) {
      throw new NotFoundException('Lead not found');
    }

    const isPrivileged = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (!isPrivileged && lead.userId !== user.id) {
      throw new ForbiddenException('You do not have access to this lead');
    }

    return { ...lead, visited: lead.visitedAt != null };
  }

  async create(userId: string, dto: CreateLeadDto) {
    const status = normalizeLeadStatus(dto.status);
    const now = new Date();

    const lead = await this.prisma.lead.create({
      data: {
        businessName: dto.businessName,
        industry: dto.industry || '',
        businessAddress: dto.businessAddress || null,
        location: dto.location || null,
        phone: dto.phone || null,
        email: dto.email || null,
        contactName: dto.contactName || null,
        contactRole: dto.contactRole || null,
        source: dto.source || 'Market Mapping',
        status,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : null,
        comments: dto.comments || null,
        priority: dto.priority || 'MEDIUM',
        assignedAgentId: dto.assignedAgentId || null,
        gpsLat: dto.gpsLat || null,
        gpsLng: dto.gpsLng || null,
        gpsAddress: dto.gpsAddress || null,
        userId,
        visitedAt: isVisitedLeadStatus(status) ? now : null,
      },
    });

    return { ...lead, visited: lead.visitedAt != null };
  }

  async update(id: string, user: any, dto: UpdateLeadDto) {
    const lead = await this.findOne(id, user);

    const status = normalizeLeadStatus(dto.status ?? lead.status);

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        ...(dto.businessName !== undefined ? { businessName: dto.businessName } : {}),
        ...(dto.industry !== undefined ? { industry: dto.industry } : {}),
        ...(dto.businessAddress !== undefined ? { businessAddress: dto.businessAddress } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.contactName !== undefined ? { contactName: dto.contactName } : {}),
        ...(dto.contactRole !== undefined ? { contactRole: dto.contactRole } : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.comments !== undefined ? { comments: dto.comments } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.gpsLat !== undefined ? { gpsLat: dto.gpsLat } : {}),
        ...(dto.gpsLng !== undefined ? { gpsLng: dto.gpsLng } : {}),
        ...(dto.gpsAddress !== undefined ? { gpsAddress: dto.gpsAddress } : {}),
        ...(dto.assignedAgentId !== undefined ? { assignedAgentId: dto.assignedAgentId } : {}),
        status,
        visitedAt: isVisitedLeadStatus(status) && !lead.visitedAt
          ? new Date()
          : lead.visitedAt,
        followUpDate:
          dto.followUpDate !== undefined
            ? dto.followUpDate
              ? new Date(dto.followUpDate)
              : null
            : lead.followUpDate,
      },
    });

    return { ...updated, visited: updated.visitedAt != null };
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
    const where: any = {
      deletedAt: null,
      isPlaceholder: false,
      ...(isPrivileged ? {} : { userId: user.id }),
    };

    const [total, visited, notVisited, byStatus] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({ where: { ...where, visitedAt: { not: null } } }),
      this.prisma.lead.count({ where: { ...where, visitedAt: null } }),
      this.prisma.lead.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
    ]);

    return {
      total,
      visited,
      notVisited,
      byStatus: byStatus.reduce(
        (acc, row) => ({ ...acc, [row.status]: row._count.status }),
        {} as Record<string, number>,
      ),
    };
  }
}
