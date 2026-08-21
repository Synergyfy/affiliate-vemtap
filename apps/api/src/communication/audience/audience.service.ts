import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JourneyService } from '../engine/journey.service';
import { AudienceDateFilter, AudienceFilterDto } from '../dto/audience.dto';

@Injectable()
export class AudienceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journeyService: JourneyService,
  ) {}

  /**
   * Resolve audience filters into a Prisma.LeadWhereInput. Handles journey
   * statuses, salesperson, location, date range and phone presence.
   */
  buildWhereClause(filters: AudienceFilterDto = {}): Prisma.LeadWhereInput {
    const conditions: Prisma.LeadWhereInput[] = [
      { deletedAt: null },
      { isPlaceholder: false },
    ];

    // Journey statuses -> full per-status clause (status, OR conditions and
    // pipeline/expiry guards) OR'd together so FOLLOW_UP_REQUIRED, LOST_CLOSED
    // and EXPIRED filter correctly rather than collapsing to a bare status.
    if (filters.statuses && filters.statuses.length > 0) {
      const statusConditions = filters.statuses.map((s) => {
        const clause = this.journeyService.journeyStateWhereClause(s, {});
        // Strip the top-level filters (applied at the AND level) so the full
        // per-status conditions are preserved.
        const { deletedAt: _deletedAt, isPlaceholder: _isPlaceholder, ...rest } = clause;
        return rest;
      });
      conditions.push({ OR: statusConditions });
    }

    // Salesperson filter
    if (filters.salespersonIds && filters.salespersonIds.length > 0) {
      conditions.push({ userId: { in: filters.salespersonIds } });
    }

    // Location / area
    if (filters.location) {
      conditions.push({
        OR: [
          { location: { contains: filters.location, mode: 'insensitive' } },
          { businessAddress: { contains: filters.location, mode: 'insensitive' } },
          { gpsAddress: { contains: filters.location, mode: 'insensitive' } },
        ],
      });
    }

    // Date filter
    const dateClause = this.buildDateClause(filters);
    if (dateClause) {
      conditions.push({ createdAt: dateClause });
    }

    // Phone presence
    if (filters.hasPhone) {
      conditions.push({ phone: { not: null }, NOT: { phone: '' } });
    }

    return { AND: conditions };
  }

  private buildDateClause(filters: AudienceFilterDto): Prisma.DateTimeFilter | undefined {
    if (filters.startDate || filters.endDate) {
      return {
        ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
        ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
      };
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filters.dateFilter) {
      case AudienceDateFilter.TODAY:
        return { gte: startOfToday };
      case AudienceDateFilter.THIS_WEEK: {
        const day = startOfToday.getDay();
        const diff = startOfToday.getDate() - day + (day === 0 ? -6 : 1); // Monday
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(diff);
        return { gte: startOfWeek };
      }
      case AudienceDateFilter.THIS_MONTH:
        return { gte: new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1) };
      default:
        return undefined;
    }
  }

  /**
   * Resolve the set of user ids a non-privileged user may message/read:
   * their own leads, plus their direct reports if they are a supervisor/manager.
   * Returns null for privileged roles (admins see everything).
   */
  async resolveVisibleUserIds(
    userId: string,
    role: string,
  ): Promise<string[] | null> {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return null;

    const ids = [userId];
    if (role === 'SUPERVISOR' || role === 'MANAGER') {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          supervisedUsers: { select: { id: true } },
          managedUsers: { select: { id: true } },
        },
      });
      ids.push(...(user?.supervisedUsers ?? []).map((u) => u.id));
      ids.push(...(user?.managedUsers ?? []).map((u) => u.id));
    }
    return ids;
  }

  /** Scope an audience query to a single owner/team for non-privileged users. */
  async scopeWhere(
    filters: AudienceFilterDto = {},
    user?: { id: string; role: string },
  ): Promise<Prisma.LeadWhereInput> {
    const where = this.buildWhereClause(filters);
    if (user) {
      const visible = await this.resolveVisibleUserIds(user.id, user.role);
      if (visible) {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : []),
          { userId: { in: visible } },
        ];
      }
    }
    return where;
  }

  /**
   * Preview an audience: total matching contacts + how many are eligible to
   * receive a message (have a phone number and are not in a terminal state).
   * Non-privileged users are scoped to their own leads.
   */
  async preview(filters: AudienceFilterDto = {}, user?: { id: string; role: string }) {
    const where = await this.scopeWhere(filters, user);

    const [total, withPhone] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({
        where: {
          ...where,
          phone: { not: null },
          NOT: { phone: '' },
        },
      }),
    ]);

    const terminal = ['CUSTOMER', 'NOT_INTERESTED'];
    const eligible = await this.prisma.lead.count({
      where: {
        ...where,
        phone: { not: null },
        NOT: { phone: '' },
        status: { notIn: terminal },
      },
    });

    return {
      total,
      withPhone,
      eligible,
      filters,
    };
  }

  /**
   * Fetch a paginated list of matching contacts, resolving each to its journey
   * state. Uses a batched include to avoid N+1 queries. Non-privileged users are
   * scoped to their own leads.
   */
  async listContacts(
    filters: AudienceFilterDto = {},
    query: { page?: number; limit?: number; search?: string } = {},
    user?: { id: string; role: string },
  ) {
    const where = await this.scopeWhere(filters, user);

    if (query.search) {
      const q = query.search.trim();
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { businessName: { contains: q, mode: 'insensitive' } },
            { contactName: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
          ],
        },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          salesPipelines: {
            select: { pipelineStage: true, exitState: true, leadQuality: true },
            take: 1,
          },
          user: {
            select: { id: true, fullName: true, phone: true, role: true },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: data.map((lead) => ({
        id: lead.id,
        businessName: lead.businessName,
        contactName: lead.contactName,
        phone: lead.phone,
        location: lead.location,
        agentName: lead.user?.fullName ?? null,
        status: lead.status,
        journeyState: this.journeyService.resolveJourneyState(lead),
        createdAt: lead.createdAt,
        lastContactedAt: lead.lastContactedAt,
        nextFollowUpAt: lead.nextFollowUpAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
