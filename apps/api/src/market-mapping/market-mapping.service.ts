import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { normalizeLeadStatus } from "../common/lead.constants";
import {
  CreateMissionPlanDto,
  UpdateMissionPlanDto,
  CreateMarketMappingNoteDto,
  CreateMarketMappingVisitDto,
  UpdateMarketMappingVisitDto,
  UpdateMarketMappingAdminConfigDto,
  CreateAssignmentDto,
  AssignLineManagerDto,
  UpdateAssignmentDto,
  ReassignAssignmentDto,
} from "./dto/market-mapping.dto";

type LeadWithUser = Prisma.LeadGetPayload<{
  include: { user: { select: { id: true; fullName: true } } };
}>;

@Injectable()
export class MarketMappingService {
  private readonly logger = new Logger(MarketMappingService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async fetchVemtapPlanTypes(): Promise<{ value: string; label: string }[] | null> {
    const vemtapUrl = process.env.VEMTAP_API_URL || process.env.VEMTAP_BASE_URL;
    if (!vemtapUrl) return null;
    try {
      const apiKey = process.env.VEMTAP_API_KEY;
      if (!apiKey) return null;
      const res = await fetch(`${vemtapUrl}/plans`, {
        headers: { "x-api-key": apiKey, Accept: "application/json" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((item: any) => ({
          value: item.code || item.value || String(item.name).toUpperCase(),
          label: item.name || item.label || item.code,
        }));
      } else if (data?.plans && Array.isArray(data.plans)) {
        return data.plans.map((item: any) => ({
          value: item.code || item.value || String(item.name).toUpperCase(),
          label: item.name || item.label || item.code,
        }));
      }
      return null;
    } catch {
      return null;
    }
  }

  async getConfig(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { territoryId: true, dailyLeadTarget: true, monthlyConversionTarget: true },
    });

    const territoryCode = user?.territoryId || "NG-LAG-IKJ-01";
    let config = await this.prisma.marketMappingTerritoryConfig.findUnique({
      where: { territoryCode },
    });

    if (!config) {
      config = await this.prisma.marketMappingTerritoryConfig.create({
        data: {
          territoryCode,
          name: territoryCode,
          country: "Nigeria",
          state: "Lagos",
          city: "Ikeja",
          area: "Allen / Opebi",
          cluster: "Tech & Retail Cluster 1",
          totalAssigned: 120,
          anchorCount: 15,
          prospectCount: 85,
          maturityJson: {
            anchorDensity: 82,
            coverageRate: 68,
            conversionRate: 45,
            followUpScore: 90,
            retentionRate: 85,
            overallMaturity: 74,
          },
        },
      });
    }

    const adminConfig = await this.getAdminConfig();
    const dailyTarget = user?.dailyLeadTarget || adminConfig.dailyTarget || 5;
    const monthlyTarget = user?.monthlyConversionTarget || adminConfig.monthlyTarget || 20;

    const assignment = await this.prisma.marketMappingAssignment.findFirst({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: { cluster: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return {
      businessCategories: adminConfig.businessCategories,
      openingDays: adminConfig.openingDays,
      customerRanges: adminConfig.customerRanges,
      businessSizes: adminConfig.businessSizes,
      contactPositions: adminConfig.contactPositions,
      pipelineStatuses: adminConfig.pipelineStatuses,
      interestOptions: adminConfig.interestOptions,
      planTypes: adminConfig.planTypes,
      faqs: adminConfig.faqs,
      ticketStatuses: adminConfig.ticketStatuses,
      businessStatuses: adminConfig.businessStatuses,
      paymentStatuses: adminConfig.paymentStatuses,
      dailyTarget,
      weeklyTarget: dailyTarget * 5,
      monthlyTarget,
      assignment: assignment
        ? {
            clusterId: assignment.clusterId,
            clusterName: assignment.cluster?.name || "",
            allowUserEdit: assignment.allowUserEdit,
          }
        : null,
      assignedCluster: assignment?.cluster?.name || config.cluster,
      territory: config,
      userTargets: {
        dailyLeadTarget: dailyTarget,
        monthlyConversionTarget: monthlyTarget,
      },
      settings: {
        autoRefreshVisits: true,
        enableGpsTracking: true,
        aiRecommendationsEnabled: true,
      },
    };
  }

  /**
   * All leads (captured pipeline businesses) for the user. Each item is marked
   * with a `visited` flag — a lead is a "visit" once it has been marked visited.
   */
  async getVisits(userId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ createdAt: "desc" }],
    });
    return leads.map((lead) => ({ ...lead, visited: lead.visitedAt != null }));
  }

  private normalizeDatePart(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  /**
   * A next-visit schedule must not be in the past. On updates, an unchanged
   * (legacy) past date is allowed so existing records stay editable; only a
   * newly chosen past date/time is rejected.
   */
  private assertValidNextVisit(
    submittedDate?: string,
    submittedTime?: string,
    existingDate?: string | null,
    existingTime?: string | null,
  ) {
    const date = String(submittedDate || "").slice(0, 10).trim();
    const time = String(submittedTime || "").slice(0, 5).trim();
    if (!date) return;

    const unchanged =
      date === String(existingDate || "").slice(0, 10).trim() &&
      time === String(existingTime || "").slice(0, 5).trim();
    if (unchanged) return;

    const today = this.normalizeDatePart(new Date());
    if (date < today) {
      throw new BadRequestException("Next visit schedule cannot be in the past");
    }
    if (date === today && time) {
      const now = new Date();
      const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      if (time < nowTime) {
        throw new BadRequestException("Next visit schedule cannot be in the past");
      }
    }
  }

  async createVisit(userId: string, dto: CreateMarketMappingVisitDto) {
    this.assertValidNextVisit(dto.nextVisitDate, dto.nextVisitTime);
    const { openingDays, ...data } = dto;
    const status = normalizeLeadStatus(data.status);
    const lead = await this.prisma.lead.create({
      data: {
        ...data,
        status,
        userId,
        openingDays,
        visitedAt: status !== "NOT_YET" ? new Date() : undefined,
      },
    });
    return { ...lead, visited: lead.visitedAt != null };
  }

  async updateVisit(id: string, userId: string, dto: UpdateMarketMappingVisitDto) {
    const existing = await this.prisma.lead.findFirst({ where: { id, userId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Market mapping visit not found");
    this.assertValidNextVisit(dto.nextVisitDate, dto.nextVisitTime, existing.nextVisitDate, existing.nextVisitTime);
    const { openingDays, ...data } = dto;
    const status = data.status !== undefined ? normalizeLeadStatus(data.status) : undefined;
    const becameVisited = !!status && status !== "NOT_YET" && !existing.visitedAt;
    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        ...data,
        ...(status !== undefined ? { status } : {}),
        openingDays,
        visitedAt: becameVisited ? new Date() : undefined,
      },
    });
    return { ...updated, visited: updated.visitedAt != null };
  }

  async getHistory(userId: string) {
    return this.prisma.marketMappingPlan.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { leads: { select: { status: true, visitedAt: true } } },
    });
  }

  async getTerritoryStats(userId: string) {
    const configData = await this.getConfig(userId);
    const territory = configData.territory;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [leadCount, businessCount, todayPlan, visitedTodayCount] = await Promise.all([
      this.prisma.lead.count({
        where: { userId, deletedAt: null, isPlaceholder: false },
      }),
      this.prisma.business.count({ where: { affiliateId: userId } }),
      this.prisma.marketMappingPlan.findFirst({
        where: {
          userId,
          OR: [
            { startDate: { gte: todayStart, lte: todayEnd } },
            { createdAt: { gte: todayStart, lte: todayEnd } },
          ],
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.lead.count({
        where: {
          userId,
          deletedAt: null,
          isPlaceholder: false,
          visitedAt: { gte: todayStart, lte: todayEnd },
        },
      }),
    ]);

    return {
      country: territory.country,
      state: territory.state,
      city: territory.city,
      area: territory.area,
      cluster: territory.cluster,
      totalAssigned: territory.totalAssigned,
      plannedToday: todayPlan?.targetVisits ?? configData.userTargets.dailyLeadTarget,
      visitedToday: visitedTodayCount,
      customersAcquired: businessCount,
      prospects: Math.max(0, territory.prospectCount - businessCount),
      anchors: territory.anchorCount,
      remainingInCluster: Math.max(0, territory.totalAssigned - businessCount - leadCount),
      marketPenetration: Math.round(((businessCount + leadCount) / (territory.totalAssigned || 1)) * 100),
      clusterCompletion: Math.round((businessCount / (territory.totalAssigned || 1)) * 100),
    };
  }

  async getPlans(userId: string) {
    return this.prisma.marketMappingPlan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createPlan(userId: string, dto: CreateMissionPlanDto) {
    return this.prisma.marketMappingPlan.create({
      data: {
        userId,
        targetVisits: dto.targetVisits,
        targetLeads: dto.targetLeads,
        targetConversions: dto.targetConversions,
        locationCluster: dto.locationCluster || "Assigned Cluster",
        notes: dto.notes,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async updatePlan(id: string, userId: string, dto: UpdateMissionPlanDto) {
    const plan = await this.prisma.marketMappingPlan.findFirst({
      where: { id, userId },
    });
    if (!plan) throw new NotFoundException("Mission plan not found");

    const data: Prisma.MarketMappingPlanUpdateInput = { ...dto } as any;
    if (dto.startDate) {
      data.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      data.endDate = new Date(dto.endDate);
    }

    return this.prisma.marketMappingPlan.update({
      where: { id },
      data,
    });
  }

  async getAnchors(userId: string) {
    return this.prisma.lead.findMany({
      where: { userId, deletedAt: null, isAnchor: true, status: "NOT_YET" },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getPriorityVisits(userId: string) {
    return this.prisma.lead.findMany({
      where: { userId, deletedAt: null, status: { in: ["NOT_YET", "INTERESTED"] } },
      orderBy: [{ isAnchor: "desc" }, { updatedAt: "desc" }],
      take: 50,
    });
  }

  async getPartnerships(userId: string) {
    return this.prisma.lead.findMany({
      where: { userId, deletedAt: null, interested: "YES", status: { not: "CUSTOMER" } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
  }

  async getInsights(userId: string) {
    const configData = await this.getConfig(userId);
    const territory = configData.territory;

    const leads = await this.prisma.lead.findMany({
      where: { userId, deletedAt: null, isPlaceholder: false },
    });
    const total = leads.length;
    const visited = leads.filter((lead) => lead.status !== "NOT_YET").length;
    const interested = leads.filter((lead) => lead.status === "INTERESTED" || lead.interested === "YES").length;
    const anchors = leads.filter((lead) => lead.isAnchor).length;
    const maturity = {
      discovery: Math.min(100, total * 5), verification: total ? Math.round((visited / total) * 100) : 0,
      sales: total ? Math.round((interested / total) * 100) : 0, customers: total ? Math.round((leads.filter((v) => v.status === "CUSTOMER").length / total) * 100) : 0,
      partnerships: total ? Math.round((leads.filter((v) => v.interested === "YES").length / total) * 100) : 0,
      overall: total ? Math.round(((visited + interested + anchors) / (total * 3)) * 100) : 0,
    };
    const recommendations = [
      ...(leads.filter((lead) => lead.isAnchor && lead.status === "NOT_YET").slice(0, 3).map((lead) => ({ id: lead.id, type: "UNTOUCHED_ANCHOR", title: lead.businessName, description: "Anchor business still requires a first visit.", rating: 5 }))),
      ...(leads.filter((lead) => lead.status === "INTERESTED").slice(0, 3).map((lead) => ({ id: lead.id, type: "PRIORITY_VISIT", title: lead.businessName, description: "Interested business requires follow-up.", rating: 4 }))),
    ];
    return {
      maturity,
      recommendations,
      clusterMaturity: maturity,
      aiRecommendations: recommendations,
      territory,
    };
  }

  async getNotes(userId: string, businessId?: string, reportKey?: string) {
    const where: any = { userId };
    if (businessId) where.businessId = businessId;
    if (reportKey) where.reportKey = reportKey;

    return this.prisma.marketMappingNote.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async createNote(userId: string, dto: CreateMarketMappingNoteDto) {
    return this.prisma.marketMappingNote.create({
      data: {
        userId,
        businessId: dto.businessId,
        leadId: dto.leadId,
        businessName: dto.businessName,
        reportKey: dto.reportKey,
        content: dto.content,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
      },
    });
  }

  async getPerformance(userId: string) {
    const now = new Date();
    const day = new Date(now); day.setHours(0, 0, 0, 0);
    const week = new Date(day); week.setDate(day.getDate() - 6);
    const month = new Date(day); month.setDate(day.getDate() - 29);
    const [leads, user, monthBusinesses] = await Promise.all([
      this.prisma.lead.findMany({ where: { userId, deletedAt: null, isPlaceholder: false } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { dailyLeadTarget: true, monthlyConversionTarget: true } }),
      this.prisma.business.findMany({ where: { affiliateId: userId, status: "ACTIVE", subscriptionAmount: { gt: 0 }, createdAt: { gte: month } }, select: { commissionAmount: true } }),
    ]);
    const countSince = (date: Date) =>
      leads.filter((lead) => lead.visitedAt && lead.visitedAt >= date).length;
    const completed = leads.filter((lead) => lead.status !== "NOT_YET").length;
    const customers = leads.filter((lead) => lead.status === "CUSTOMER").length;
    const proposalsSent = leads.filter((lead) => ["CONTACTED", "INTERESTED", "CUSTOMER"].includes(lead.status)).length;
    const dayVisits = countSince(day);
    const weekVisits = countSince(week);
    const monthVisits = countSince(month);

    const dailyTarget = user?.dailyLeadTarget || 0;
    const weeklyTarget = dailyTarget * 5;
    const monthlyTarget = user?.monthlyConversionTarget || 0;

    const monthRevenue = monthBusinesses.reduce((sum, business) => sum + Number(business.commissionAmount || 0), 0);
    const pct = (value: number, target: number) => target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;

    return {
      dailyVisits: dayVisits,
      weeklyVisits: weekVisits,
      monthlyVisits: monthVisits,
      meetingsCompleted: completed,
      customersAcquired: customers,
      proposalsSent,
      conversionRatePercent: completed ? Math.round((customers / completed) * 100) : 0,
      reportingScore: leads.length ? Math.round((completed / leads.length) * 100) : 0,
      attendanceRate: Math.min(100, Math.round((completed / Math.max(1, dailyTarget)) * 100)),
      monthRevenue,
      dailyTarget,
      weeklyTarget,
      monthlyTarget,
      dailyProgress: pct(dayVisits, dailyTarget),
      weeklyProgress: pct(weekVisits, weeklyTarget),
      monthlyProgress: pct(monthVisits, monthlyTarget),
    };
  }

  async getReports(userId: string, period: string = "monthly") {
    const now = new Date();
    const start = new Date(now);
    if (period === "daily") start.setHours(0, 0, 0, 0);
    else if (period === "weekly") start.setDate(start.getDate() - 6);
    else start.setDate(start.getDate() - 29);

    const [leads, businesses, notes, visits, user, adminConfig] = await Promise.all([
      this.prisma.lead.findMany({ where: { userId, deletedAt: null, isPlaceholder: false, createdAt: { gte: start } }, orderBy: { createdAt: "desc" } }),
      this.prisma.business.findMany({ where: { affiliateId: userId, status: "ACTIVE", subscriptionAmount: { gt: 0 }, createdAt: { gte: start } }, orderBy: { createdAt: "desc" } }),
      this.prisma.marketMappingNote.findMany({ where: { userId, createdAt: { gte: start } }, orderBy: { createdAt: "desc" } }),
      this.prisma.lead.findMany({ where: { userId, deletedAt: null, isPlaceholder: false, visitedAt: { gte: start } }, orderBy: { visitedAt: "desc" } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { dailyLeadTarget: true } }),
      this.prisma.marketMappingAdminConfig.findFirst(),
    ]);

    const daysCount = period === "daily" ? 1 : period === "weekly" ? 7 : 30;
    const leadTarget = user?.dailyLeadTarget || adminConfig?.dailyTarget || 0;
    const conversionReference = 0.4;
    const riskThreshold = 90;
    const WEIGHTS = {
      leads: 0.35,
      conversion: 0.30,
      businessInfo: 0.20,
      visits: 0.10,
      completion: 0.05,
    } as const;

    const pctOfTarget = (value: number, target: number) => {
      if (target <= 0) return 0;
      return Math.min(100, Math.round((value / target) * 100));
    };
    const gpsPoints = (v: (typeof visits)[number]) => v.gpsLat != null && v.gpsLng != null && String(v.gpsLat).trim() !== "" && String(v.gpsLng).trim() !== "";
    const INFO_FIELDS = (v: (typeof visits)[number]) => [v.industry, v.phone, v.contactName, v.businessAddress || v.location, v.businessSize, v.openingHours, v.contactRole];
    const totalEarnings = businesses.reduce((acc, b) => acc + Number(b.commissionAmount || 0), 0);
    const avgLeadsPerDay = Math.round((leads.length / Math.max(1, daysCount)) * 10) / 10;
    const avgConversionRate = leads.length > 0 ? Math.round((businesses.length / leads.length) * 100) : 0;
    const completionRate = Math.min(100, Math.round((visits.filter(v => v.status !== "NOT_YET").length / Math.max(1, visits.length)) * 100));

    // Calculate 30-day daily score ledger
    const ledger = [];
    for (let i = 0; i < 30; i++) {
      const dayDate = new Date(now);
      dayDate.setDate(dayDate.getDate() - i);
      const dayStart = new Date(dayDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayLeads = leads.filter((l) => new Date(l.createdAt) >= dayStart && new Date(l.createdAt) <= dayEnd).length;
      const dayConversions = businesses.filter((b) => new Date(b.createdAt) >= dayStart && new Date(b.createdAt) <= dayEnd).length;

      const dayVisitsArr = visits.filter((v) => {
        const d = v.visitedAt;
        return d && new Date(d) >= dayStart && new Date(d) <= dayEnd;
      });
      const dayVisits = dayVisitsArr.length;

      const infoPct = dayVisitsArr.length > 0
        ? Math.round(dayVisitsArr.reduce((sum, v) => sum + INFO_FIELDS(v).filter((f) => f != null && String(f).trim() !== "").length, 0) / (dayVisitsArr.length * INFO_FIELDS(dayVisitsArr[0]).length) * 100)
        : 0;
      const gpsPct = dayVisitsArr.length > 0 ? Math.round((dayVisitsArr.filter(gpsPoints).length / dayVisitsArr.length) * 100) : 0;
      const completionPct = pctOfTarget(dayVisitsArr.length, leadTarget);

      const leadPct = pctOfTarget(dayLeads, leadTarget);
      const infoComposite = 0.6 * infoPct + 0.4 * gpsPct;
      const convPct = Math.min(100, (dayConversions / Math.max(1, dayLeads) / conversionReference) * 100);
      const visitPct = pctOfTarget(dayVisitsArr.length, leadTarget);

      const score = Math.round(
        WEIGHTS.leads * leadPct +
        WEIGHTS.conversion * convPct +
        WEIGHTS.businessInfo * infoComposite +
        WEIGHTS.visits * visitPct +
        WEIGHTS.completion * completionPct,
      );

      ledger.push({
        id: `day-${i}`,
        date: dayStart.toISOString().split("T")[0],
        leads: dayLeads,
        target: leadTarget,
        conversions: dayConversions,
        visits: dayVisits,
        infoPct,
        gpsPct,
        infoComposite: Math.round(infoComposite),
        completionPct,
        isToday: i === 0,
        score,
        met: score >= riskThreshold,
      });
    }

    return {
      period,
      summary: {
        totalLeads: leads.length,
        totalConversions: businesses.length,
        totalVisits: visits.length,
        totalEarnings,
        completionRate,
        businessesReferred: businesses.length,
        avgLeadsPerDay,
        avgConversionRate,
      },
      weights: {
        leads: WEIGHTS.leads,
        conversion: WEIGHTS.conversion,
        businessInfo: WEIGHTS.businessInfo,
        visits: WEIGHTS.visits,
        completion: WEIGHTS.completion,
        riskThreshold,
        conversionReference,
        leadTarget,
      },
      ledger,
      leads: leads.map((l) => ({
        id: l.id,
        businessName: l.businessName,
        phone: l.phone,
        status: l.status,
        date: l.createdAt,
      })),
      visitedBusinesses: businesses.map((b) => ({
        id: b.id,
        businessName: b.businessName,
        ownerName: b.ownerName,
        planType: b.planType,
        status: b.status,
        date: b.createdAt,
      })),
      notes: notes.map((n) => ({
        id: n.id,
        businessName: n.businessName,
        content: n.content,
        followUpDate: n.followUpDate,
        createdAt: n.createdAt,
      })),
      visits: visits.map((lead) => ({
        id: lead.id,
        businessName: lead.businessName,
        category: lead.industry,
        status: lead.status,
        gpsAddress: lead.gpsAddress,
        date: lead.visitedAt,
        notes: lead.comments,
      })),
    };
  }

  async downloadReportCsv(userId: string, period: string = "monthly") {
    const report = await this.getReports(userId, period);
    const escapeCsv = (val?: string) => `"${(val || "").replace(/"/g, '""')}"`;
    const header = "Type,ID,Business Name,Status,Date\n";
    const leadRows = report.leads.map((l) => `Lead,${l.id},${escapeCsv(l.businessName)},${l.status},${l.date}`).join("\n");
    const businessRows = report.visitedBusinesses.map((b) => `Business,${b.id},${escapeCsv(b.businessName)},${b.status},${b.date}`).join("\n");
    const visitRows = report.visits.map((v) => `Visit,${v.id},${escapeCsv(v.businessName)},${v.status},${v.date}`).join("\n");
    return header + [leadRows, businessRows, visitRows].filter(Boolean).join("\n");
  }

  // --- ADMIN MARKET MAPPING ---
  async getHierarchyTree() {
    return this.prisma.marketMappingHierarchy.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: {
                  include: {
                    children: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async createHierarchyNode(dto: { name: string; type: "COUNTRY" | "STATE" | "CITY" | "AREA" | "CLUSTER"; parentId?: string }) {
    return this.prisma.marketMappingHierarchy.create({
      data: {
        name: dto.name,
        type: dto.type,
        parentId: dto.parentId || null,
      },
    });
  }

  async updateHierarchyNode(id: string, dto: { name?: string; parentId?: string }) {
    const node = await this.prisma.marketMappingHierarchy.findUnique({ where: { id } });
    if (!node) throw new NotFoundException("Hierarchy node not found");

    return this.prisma.marketMappingHierarchy.update({
      where: { id },
      data: dto,
    });
  }

  async deleteHierarchyNode(id: string) {
    const node = await this.prisma.marketMappingHierarchy.findUnique({ where: { id } });
    if (!node) throw new NotFoundException("Hierarchy node not found");

    return this.prisma.marketMappingHierarchy.delete({ where: { id } });
  }

  async getLocationsList() {
    return this.prisma.marketMappingHierarchy.findMany({
      where: { type: { in: ["AREA", "CLUSTER"] } },
      select: {
        id: true,
        name: true,
        type: true,
        totalBusinesses: true,
        penetration: true,
        parent: { select: { id: true, name: true } },
      },
    });
  }

  async getClusterDetail(clusterId: string) {
    const cluster = await this.prisma.marketMappingHierarchy.findUnique({
      where: { id: clusterId },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, role: true, avatar: true } },
          },
        },
      },
    });

    if (!cluster) {
      throw new NotFoundException("Cluster not found");
    }

    const assignedAffiliateIds = cluster.assignments.map((assignment) => assignment.userId);
    const assignedBusinesses = assignedAffiliateIds.length === 0
      ? []
      : await this.prisma.business.findMany({
          where: { affiliateId: { in: assignedAffiliateIds } },
          take: 20,
          orderBy: { createdAt: "desc" },
          select: { id: true, businessName: true, planType: true, status: true, ownerName: true, phone: true, affiliateId: true },
        });

    const capturedLeads = assignedAffiliateIds.length === 0
      ? []
      : await this.prisma.lead.findMany({
          where: {
            userId: { in: assignedAffiliateIds },
            isPlaceholder: false,
            deletedAt: null,
          },
          take: 100,
          orderBy: { updatedAt: "desc" },
          include: { user: { select: { id: true, fullName: true } } },
        });

    const capturedBusinesses = this.mapCapturedLeads(capturedLeads, assignedBusinesses, cluster);

    return {
      cluster,
      businesses: [...assignedBusinesses, ...capturedBusinesses],
    };
  }

  async getAdminCapturedVisits() {
    const leads = await this.prisma.lead.findMany({
      where: { isPlaceholder: false, deletedAt: null },
      take: 200,
      orderBy: { updatedAt: "desc" },
      include: { user: { select: { id: true, fullName: true } } },
    });

    return this.mapCapturedLeads(leads, [], { id: "", name: "" });
  }

  private mapVisitStatus(status?: string | null): string {
    switch (status) {
      case "CUSTOMER": return "CUSTOMER";
      case "INTERESTED":
      case "NEGOTIATING": return "NEGOTIATING";
      case "CONTACTED":
      case "MEETING": return "MEETING";
      case "NOT_INTERESTED":
      case "LOST": return "LOST";
      default: return "PROSPECT";
    }
  }

  private mapCustomerRangeToNumber(range?: string | null): number {
    switch (range) {
      case "LOW": return 25;
      case "MEDIUM": return 65;
      case "HIGH": return 200;
      case "VERY_HIGH": return 400;
      default: return 0;
    }
  }

  private mapCapturedLeads(
    leads: LeadWithUser[],
    existingBusinesses: Array<{ phone?: string | null }>,
    cluster: { id: string; name: string },
  ) {
    const existingPhones = new Set(
      existingBusinesses.map((business) => business.phone).filter((phone): phone is string => Boolean(phone)),
    );
    const seenPhones = new Set<string>();

    return leads
      .filter((lead) => {
        const lat = Number(lead.gpsLat);
        const lng = Number(lead.gpsLng);
        if (!lead.gpsLat || !lead.gpsLng || !Number.isFinite(lat) || !Number.isFinite(lng)) return false;
        if (lead.phone && existingPhones.has(lead.phone)) return false;
        if (lead.phone && seenPhones.has(lead.phone)) return false;
        if (lead.phone) seenPhones.add(lead.phone);
        return true;
      })
      .map((lead) => {
        const status = this.mapVisitStatus(lead.status);
        const nextVisit = lead.nextVisitDate || lead.nextVisitTime
          ? `${lead.nextVisitDate || ""} ${lead.nextVisitTime || ""}`.trim()
          : undefined;
        return {
          id: lead.id,
          name: lead.businessName,
          businessName: lead.businessName,
          category: lead.industry || "Business",
          industry: lead.industry || "",
          size: lead.businessSize || "SMALL",
          status,
          isAnchor: lead.isAnchor || false,
          anchorScore: 0,
          influenceScore: 0,
          isVerified: status === "CUSTOMER",
          ownerName: lead.contactName || "",
          decisionMaker: lead.contactName || "",
          phone: lead.phone || "",
          email: lead.email || "",
          address: lead.location || lead.businessAddress || "",
          clusterId: cluster.id,
          clusterName: cluster.name,
          latitude: Number(lead.gpsLat),
          longitude: Number(lead.gpsLng),
          dailyCustomers: this.mapCustomerRangeToNumber(lead.dailyCustomers),
          monthlyCustomers: 0,
          openingHours: lead.openingHours || undefined,
          assignedAffiliateId: lead.userId,
          assignedAffiliateName: lead.user?.fullName || "",
          priority: "LOW",
          lastVisit: lead.visitedAt ? new Date(lead.visitedAt).toLocaleDateString() : undefined,
          nextVisit,
          notes: lead.comments || undefined,
          source: "CAPTURE",
        };
      });
  }

  private calculateExpiration(duration?: string, customExpiresAt?: string, customDays?: number, baseDate = new Date()): Date | null {
    if (!duration || duration === "FOREVER") return null;
    if (duration === "ONE_DAY") {
      return new Date(baseDate.getTime() + 24 * 60 * 60 * 1000);
    }
    if (duration === "ONE_WEEK") {
      return new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    if (duration === "ONE_MONTH") {
      const d = new Date(baseDate.getTime());
      d.setMonth(d.getMonth() + 1);
      return d;
    }
    if (duration === "CUSTOM") {
      if (customExpiresAt) return new Date(customExpiresAt);
      if (customDays && customDays > 0) return new Date(baseDate.getTime() + customDays * 24 * 60 * 60 * 1000);
    }
    return null;
  }

  async getAssignments(query?: { clusterId?: string; userId?: string; includeExpired?: boolean }) {
    const where: any = {};
    if (query?.clusterId) where.clusterId = query.clusterId;
    if (query?.userId) where.userId = query.userId;
    if (!query?.includeExpired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];
    }
    return this.prisma.marketMappingAssignment.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, role: true, email: true, phone: true } },
        cluster: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createAssignment(dto: CreateAssignmentDto, assignedByUserId?: string) {
    const duration = dto.duration ?? "FOREVER";
    const expiresAt = this.calculateExpiration(duration, dto.customExpiresAt, dto.customDays);

    if (dto.reassignExisting) {
      await this.prisma.marketMappingAssignment.deleteMany({
        where: { userId: dto.userId },
      });
    }

    return this.prisma.marketMappingAssignment.create({
      data: {
        userId: dto.userId,
        clusterId: dto.clusterId,
        dailyLeadTarget: dto.dailyLeadTarget ?? 0,
        weeklyLeadTarget: dto.weeklyLeadTarget ?? 0,
        monthlyConversionTarget: dto.monthlyConversionTarget ?? 0,
        allowUserEdit: dto.allowUserEdit ?? true,
        duration: duration as any,
        expiresAt,
        assignedBy: assignedByUserId,
      },
      include: {
        user: { select: { id: true, fullName: true, role: true, email: true } },
        cluster: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async assignLineManager(dto: AssignLineManagerDto, assignedByUserId?: string) {
    const manager = await this.prisma.user.findUnique({
      where: { id: dto.managerId },
      select: { id: true, role: true, fullName: true },
    });
    if (!manager) throw new NotFoundException("Line manager not found");

    let memberIds: string[] = [];
    if (dto.includeTeamMembers !== false) {
      const teamMembers = await this.prisma.user.findMany({
        where: {
          OR: [
            { managerId: dto.managerId },
            { supervisorId: dto.managerId },
          ],
        },
        select: { id: true },
      });
      memberIds = teamMembers.map((m) => m.id);
    }

    const allUserIds = Array.from(new Set([dto.managerId, ...memberIds]));
    const duration = dto.duration ?? "FOREVER";
    const expiresAt = this.calculateExpiration(duration, dto.customExpiresAt, dto.customDays);

    return this.prisma.$transaction(async (tx) => {
      if (dto.reassignExisting !== false) {
        await tx.marketMappingAssignment.deleteMany({
          where: { userId: { in: allUserIds } },
        });
      }

      const assignmentsData = allUserIds.map((userId) => ({
        userId,
        clusterId: dto.clusterId,
        dailyLeadTarget: dto.dailyLeadTarget ?? 0,
        weeklyLeadTarget: dto.weeklyLeadTarget ?? 0,
        monthlyConversionTarget: dto.monthlyConversionTarget ?? 0,
        allowUserEdit: dto.allowUserEdit ?? true,
        duration: duration as any,
        expiresAt,
        assignedBy: assignedByUserId,
      }));

      await tx.marketMappingAssignment.createMany({
        data: assignmentsData,
      });

      return tx.marketMappingAssignment.findMany({
        where: { userId: { in: allUserIds }, clusterId: dto.clusterId },
        include: {
          user: { select: { id: true, fullName: true, role: true, email: true } },
          cluster: { select: { id: true, name: true, type: true } },
        },
      });
    });
  }

  async updateAssignment(id: string, dto: UpdateAssignmentDto) {
    const assignment = await this.prisma.marketMappingAssignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException("Assignment not found");

    const updateData: any = {};
    if (dto.dailyLeadTarget !== undefined) updateData.dailyLeadTarget = dto.dailyLeadTarget;
    if (dto.weeklyLeadTarget !== undefined) updateData.weeklyLeadTarget = dto.weeklyLeadTarget;
    if (dto.monthlyConversionTarget !== undefined) updateData.monthlyConversionTarget = dto.monthlyConversionTarget;
    if (dto.allowUserEdit !== undefined) updateData.allowUserEdit = dto.allowUserEdit;
    if (dto.clusterId !== undefined) updateData.clusterId = dto.clusterId;
    if (dto.duration !== undefined) {
      updateData.duration = dto.duration;
      updateData.expiresAt = this.calculateExpiration(dto.duration, dto.customExpiresAt, dto.customDays);
    }

    return this.prisma.marketMappingAssignment.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, fullName: true, role: true, email: true } },
        cluster: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async reassignAssignment(id: string, dto: ReassignAssignmentDto, assignedByUserId?: string) {
    const assignment = await this.prisma.marketMappingAssignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException("Assignment not found");

    const duration = dto.duration ?? assignment.duration;
    const expiresAt = dto.duration
      ? this.calculateExpiration(dto.duration, dto.customExpiresAt, dto.customDays)
      : assignment.expiresAt;

    return this.prisma.marketMappingAssignment.update({
      where: { id },
      data: {
        clusterId: dto.clusterId,
        duration: duration as any,
        expiresAt,
        dailyLeadTarget: dto.dailyLeadTarget ?? assignment.dailyLeadTarget,
        weeklyLeadTarget: dto.weeklyLeadTarget ?? assignment.weeklyLeadTarget,
        monthlyConversionTarget: dto.monthlyConversionTarget ?? assignment.monthlyConversionTarget,
        allowUserEdit: dto.allowUserEdit ?? assignment.allowUserEdit,
        assignedBy: assignedByUserId,
      },
      include: {
        user: { select: { id: true, fullName: true, role: true, email: true } },
        cluster: { select: { id: true, name: true, type: true } },
      },
    });
  }

  async deleteAssignment(id: string) {
    const assignment = await this.prisma.marketMappingAssignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException("Assignment not found");

    return this.prisma.marketMappingAssignment.delete({ where: { id } });
  }

  async getClusterSubmissions(clusterId: string) {
    const assignments = await this.prisma.marketMappingAssignment.findMany({
      where: { clusterId },
      select: { userId: true },
    });
    const assignedAffiliateIds = assignments.map((assignment) => assignment.userId);

    if (assignedAffiliateIds.length === 0) {
      return { clusterId, submissions: [] };
    }

    const [leads, businesses] = await Promise.all([
      this.prisma.lead.findMany({
        where: { userId: { in: assignedAffiliateIds }, deletedAt: null, isPlaceholder: false },
        take: 15,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { fullName: true } } },
      }),
      this.prisma.business.findMany({
        where: { affiliateId: { in: assignedAffiliateIds } },
        take: 15,
        orderBy: { createdAt: "desc" },
        include: { affiliate: { select: { fullName: true } } },
      }),
    ]);

    return {
      clusterId,
      submissions: [
        ...leads.map((l) => ({ type: "LEAD", id: l.id, name: l.businessName, submittedBy: l.user?.fullName, date: l.createdAt })),
        ...businesses.map((b) => ({ type: "BUSINESS", id: b.id, name: b.businessName, submittedBy: b.affiliate?.fullName, date: b.createdAt })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }

  async getGlobalStats() {
    const [totalTerritories, totalBusinesses, activeClusters] = await Promise.all([
      this.prisma.marketMappingHierarchy.count(),
      this.prisma.business.count(),
      this.prisma.marketMappingHierarchy.count({ where: { type: "CLUSTER" } }),
    ]);

    return {
      totalTerritories,
      totalBusinessesCaptured: totalBusinesses,
      activeClusters,
      overallPenetrationPercent: totalTerritories > 0 ? Math.round((totalBusinesses / (totalTerritories * 50)) * 100) : 0,
    };
  }

  async getAdminConfig() {
    const DEFAULT_BUSINESS_CATEGORIES = [
      "Supermarket / Grocery", "Pharmacy", "Restaurant / Fast Food", "Retail / Clothing",
      "Electronics / Phone Accessories", "Beauty / Salon / Barbing", "Fuel / Gas Station",
      "Hotel / Lodge", "School / Training Center", "Hospital / Clinic", "Bakery / Confectionery",
      "Professional Services", "Other",
    ];
    const DEFAULT_OPENING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const DEFAULT_CUSTOMER_RANGES = [
      { value: "LOW", label: "Low (1-30)", min: 1, max: 30 },
      { value: "MEDIUM", label: "Medium (31-100)", min: 31, max: 100 },
      { value: "HIGH", label: "High (101-300)", min: 101, max: 300 },
      { value: "VERY_HIGH", label: "Very High (300+)", min: 300, max: 999999 },
    ];
    const DEFAULT_BUSINESS_SIZES = [
      { value: "SMALL", label: "Small (1-5 staff)", minStaff: 1, maxStaff: 5 },
      { value: "MEDIUM", label: "Medium (6-20 staff)", minStaff: 6, maxStaff: 20 },
      { value: "LARGE", label: "Large (21+ staff)", minStaff: 21, maxStaff: 999999 },
    ];
    const DEFAULT_CONTACT_POSITIONS = ["Owner", "Manager", "HR Manager", "Sales Manager", "Custom"];
    const DEFAULT_PIPELINE_STATUSES = [
      { id: "NOT_YET", name: "Not yet", color: "bg-slate-500", bg: "bg-slate-50", text: "text-slate-600" },
      { id: "VISITED", name: "Visited", color: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-600" },
      { id: "CONTACTED", name: "Contacted", color: "bg-purple-500", bg: "bg-purple-50", text: "text-purple-600" },
      { id: "INTERESTED", name: "Interested", color: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600" },
      { id: "NOT_INTERESTED", name: "Not Interested", color: "bg-red-500", bg: "bg-red-50", text: "text-red-600" },
      { id: "CUSTOMER", name: "Customer", color: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-600" },
    ];
    const DEFAULT_INTEREST_OPTIONS = [
      { value: "YES", label: "Interested" },
      { value: "NO", label: "Not Interested" },
      { value: "MAYBE", label: "Maybe / Not decided" },
    ];
    const DEFAULT_PLAN_TYPES = [
      { value: "BASIC", label: "Basic" },
      { value: "STARTER", label: "Starter" },
      { value: "PROFESSIONAL", label: "Professional" },
      { value: "ENTERPRISE", label: "Enterprise" },
    ];

    let config = await this.prisma.marketMappingAdminConfig.findFirst();
    if (!config) {
      config = await this.prisma.marketMappingAdminConfig.create({
        data: {
          categories: DEFAULT_BUSINESS_CATEGORIES,
          openingDays: DEFAULT_OPENING_DAYS,
          customerRanges: DEFAULT_CUSTOMER_RANGES,
          businessSizes: DEFAULT_BUSINESS_SIZES,
          contactPositions: DEFAULT_CONTACT_POSITIONS,
          pipelineStatuses: DEFAULT_PIPELINE_STATUSES,
          interestOptions: DEFAULT_INTEREST_OPTIONS,
          planTypes: DEFAULT_PLAN_TYPES,
          faqs: [],
          ticketStatuses: [],
          businessStatuses: [],
          paymentStatuses: [],
          dailyTarget: 5,
          weeklyTarget: 25,
          monthlyTarget: 20,
          fieldDefaults: { autoAssignLead: true, requireGps: true },
        },
      });
    }

    const vemtapPlans = await this.fetchVemtapPlanTypes();

    const categories = (config.categories as any) || DEFAULT_BUSINESS_CATEGORIES;
    const pipelineStatusesRaw = (config.pipelineStatuses as any) || DEFAULT_PIPELINE_STATUSES;

    const pipelineStatuses = Array.isArray(pipelineStatusesRaw)
      ? pipelineStatusesRaw.map((item: any) => {
          if (typeof item === "string") {
            const match = DEFAULT_PIPELINE_STATUSES.find((s) => s.id === item);
            return match || { id: item, name: item, color: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-600" };
          }
          return item;
        })
      : DEFAULT_PIPELINE_STATUSES;

    return {
      id: config.id,
      categories,
      businessCategories: categories,
      openingDays: (config.openingDays as any) || DEFAULT_OPENING_DAYS,
      customerRanges: (config.customerRanges as any) || DEFAULT_CUSTOMER_RANGES,
      businessSizes: (config.businessSizes as any) || DEFAULT_BUSINESS_SIZES,
      contactPositions: (config.contactPositions as any) || DEFAULT_CONTACT_POSITIONS,
      pipelineStatuses,
      interestOptions: (config.interestOptions as any) || DEFAULT_INTEREST_OPTIONS,
      planTypes: vemtapPlans || (config.planTypes as any) || DEFAULT_PLAN_TYPES,
      faqs: (config.faqs as any) || [],
      ticketStatuses: (config.ticketStatuses as any) || [],
      businessStatuses: (config.businessStatuses as any) || [],
      paymentStatuses: (config.paymentStatuses as any) || [],
      dailyTarget: config.dailyTarget || 5,
      weeklyTarget: config.weeklyTarget || 25,
      monthlyTarget: config.monthlyTarget || 20,
      fieldDefaults: (config.fieldDefaults as any) || { autoAssignLead: true, requireGps: true },
      updatedAt: config.updatedAt,
    };
  }

  async updateAdminConfig(dto: UpdateMarketMappingAdminConfigDto) {
    const config = await this.prisma.marketMappingAdminConfig.findFirst();
    const updateData: any = {};
    if (dto.categories !== undefined) updateData.categories = dto.categories;
    if (dto.pipelineStatuses !== undefined) updateData.pipelineStatuses = dto.pipelineStatuses;
    if (dto.fieldDefaults !== undefined) updateData.fieldDefaults = dto.fieldDefaults;
    if (dto.openingDays !== undefined) updateData.openingDays = dto.openingDays;
    if (dto.customerRanges !== undefined) updateData.customerRanges = dto.customerRanges;
    if (dto.businessSizes !== undefined) updateData.businessSizes = dto.businessSizes;
    if (dto.contactPositions !== undefined) updateData.contactPositions = dto.contactPositions;
    if (dto.interestOptions !== undefined) updateData.interestOptions = dto.interestOptions;
    if (dto.planTypes !== undefined) updateData.planTypes = dto.planTypes;
    if (dto.faqs !== undefined) updateData.faqs = dto.faqs;
    if (dto.ticketStatuses !== undefined) updateData.ticketStatuses = dto.ticketStatuses;
    if (dto.businessStatuses !== undefined) updateData.businessStatuses = dto.businessStatuses;
    if (dto.paymentStatuses !== undefined) updateData.paymentStatuses = dto.paymentStatuses;
    if (dto.dailyTarget !== undefined) updateData.dailyTarget = dto.dailyTarget;
    if (dto.weeklyTarget !== undefined) updateData.weeklyTarget = dto.weeklyTarget;
    if (dto.monthlyTarget !== undefined) updateData.monthlyTarget = dto.monthlyTarget;

    if (!config) {
      return this.prisma.marketMappingAdminConfig.create({
        data: {
          categories: updateData.categories || ["Supermarket / Grocery"],
          pipelineStatuses: updateData.pipelineStatuses || ["NOT_YET"],
          fieldDefaults: updateData.fieldDefaults || { autoAssignLead: true, requireGps: true },
          ...updateData,
        },
      });
    }

    return this.prisma.marketMappingAdminConfig.update({
      where: { id: config.id },
      data: updateData,
    });
  }
}
