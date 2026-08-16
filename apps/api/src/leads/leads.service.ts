import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto, UpdateLeadDto, LeadFilterDto, HarvestLeadsFilterDto } from './dto/leads.dto';
import { isVisitedLeadStatus, normalizeLeadStatus } from '../common/lead.constants';
import { Prisma } from '@prisma/client';

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
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              role: true,
              referralCode: true,
              avatar: true,
            },
          },
        },
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

  async findHarvest(filters: HarvestLeadsFilterDto) {
    const where = this.buildHarvestWhereClause(filters);
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const [data, total, totalWithPhone, convertedCount, activePipelineCount, statusGroups] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        take: filters.take,
        skip: filters.skip,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              role: true,
              referralCode: true,
              avatar: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({
        where: {
          ...where,
          phone: { not: null },
          NOT: { phone: '' },
        },
      }),
      this.prisma.lead.count({
        where: {
          ...where,
          status: { in: ['CONVERTED', 'CUSTOMER'] },
        },
      }),
      this.prisma.lead.count({
        where: {
          ...where,
          status: { in: ['NOT_YET', 'VISITED', 'CONTACTED', 'INTERESTED', 'DEMO_SCHEDULED', 'DEMO_DONE'] },
        },
      }),
      this.prisma.lead.groupBy({
        by: ['status'],
        where: {
          deletedAt: null,
          isPlaceholder: false,
        },
        _count: { id: true },
      }),
    ]);

    return {
      data: data.map((lead) => ({ ...lead, visited: lead.visitedAt != null })),
      meta: {
        total,
        page: filters.page,
        limit: filters.limit || 10,
        totalPages: Math.ceil(total / (filters.limit || 10)),
      },
      stats: {
        totalHarvested: total,
        totalWithPhone,
        totalConverted: convertedCount,
        totalPipeline: activePipelineCount,
        statusBreakdown: statusGroups.reduce(
          (acc, curr) => ({ ...acc, [curr.status]: curr._count.id }),
          {} as Record<string, number>,
        ),
      },
    };
  }

  private buildHarvestWhereClause(filters: HarvestLeadsFilterDto): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = {
      deletedAt: null,
      isPlaceholder: false,
    };

    if (filters.role) {
      where.user = {
        role: filters.role as any,
      };
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status && filters.status !== 'ALL') {
      where.status = {
        equals: filters.status,
        mode: 'insensitive',
      };
    }

    if (filters.location) {
      where.OR = [
        { location: { contains: filters.location, mode: 'insensitive' } },
        { businessAddress: { contains: filters.location, mode: 'insensitive' } },
        { gpsAddress: { contains: filters.location, mode: 'insensitive' } },
      ];
    }

    if (filters.hasPhone) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        { phone: { not: null } },
        { phone: { not: '' } },
      ];
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {
        ...(filters.startDate && { gte: new Date(filters.startDate) }),
        ...(filters.endDate && { lte: new Date(filters.endDate) }),
      };
    }

    if (filters.search) {
      const q = filters.search.trim();
      const searchConditions: Prisma.LeadWhereInput[] = [
        { businessName: { contains: q, mode: 'insensitive' } },
        { contactName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { businessAddress: { contains: q, mode: 'insensitive' } },
        { user: { fullName: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { phone: { contains: q } } },
      ];

      if (where.OR) {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
          { OR: searchConditions },
        ];
      } else {
        where.OR = searchConditions;
      }
    }

    return where;
  }

  async exportHarvest(filters: HarvestLeadsFilterDto): Promise<string> {
    const where = this.buildHarvestWhereClause(filters);
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const leads = await this.prisma.lead.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: 10000,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            role: true,
            referralCode: true,
          },
        },
      },
    });

    const headers = [
      'Business Name',
      'Contact Name',
      'Contact Role',
      'Phone Number',
      'Email',
      'Location',
      'Business Address',
      'Industry',
      'Pipeline Status',
      'Source',
      'Added By Name',
      'Added By Role',
      'Added By Phone',
      'Added By Email',
      'Referral Code',
      'Date Added',
    ].join(',');

    const escapeCsv = (str?: string | null) => {
      if (!str) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };

    const rows = leads.map((lead) =>
      [
        escapeCsv(lead.businessName),
        escapeCsv(lead.contactName),
        escapeCsv(lead.contactRole),
        escapeCsv(lead.phone),
        escapeCsv(lead.email),
        escapeCsv(lead.location),
        escapeCsv(lead.businessAddress),
        escapeCsv(lead.industry),
        escapeCsv(lead.status),
        escapeCsv(lead.source),
        escapeCsv(lead.user?.fullName),
        escapeCsv(lead.user?.role),
        escapeCsv(lead.user?.phone),
        escapeCsv(lead.user?.email),
        escapeCsv(lead.user?.referralCode),
        escapeCsv(lead.createdAt.toISOString()),
      ].join(','),
    );

    return [headers, ...rows].join('\n');
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

