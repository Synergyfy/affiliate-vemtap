import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateMissionPlanDto,
  UpdateMissionPlanDto,
  CreateMarketMappingNoteDto,
  CreateMarketMappingVisitDto,
  UpdateMarketMappingVisitDto,
  UpdateMarketMappingAdminConfigDto,
} from "./dto/market-mapping.dto";

@Injectable()
export class MarketMappingService {
  constructor(private readonly prisma: PrismaService) {}

  private async fetchVemtapPlanTypes(): Promise<{ value: string; label: string }[] | null> {
    const vemtapUrl = process.env.VEMTAP_API_URL || process.env.VEMTAP_BASE_URL;
    if (!vemtapUrl) return null;
    try {
      const apiKey = process.env.VEMTAP_API_KEY || "vem_3774d66ba1ac7392c877d121bb3c919b65df2c9d11b66555f2e4efe6";
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

  async getVisits(userId: string) {
    return this.prisma.marketMappingVisit.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }],
    });
  }

  async createVisit(userId: string, dto: CreateMarketMappingVisitDto) {
    const { openingDays, ...data } = dto;
    return this.prisma.marketMappingVisit.create({
      data: {
        ...data,
        userId,
        openingDays,
        visitedAt: data.status && data.status !== "NOT_YET" ? new Date() : undefined,
      },
    });
  }

  async updateVisit(id: string, userId: string, dto: UpdateMarketMappingVisitDto) {
    const existing = await this.prisma.marketMappingVisit.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException("Market mapping visit not found");
    const { openingDays, ...data } = dto;
    const becameVisited = data.status && data.status !== "NOT_YET" && !existing.visitedAt;
    return this.prisma.marketMappingVisit.update({
      where: { id },
      data: { ...data, openingDays, visitedAt: becameVisited ? new Date() : undefined },
    });
  }

  async getHistory(userId: string) {
    return this.prisma.marketMappingPlan.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: { visits: { select: { status: true } } },
    });
  }

  async getTerritoryStats(userId: string) {
    const configData = await this.getConfig(userId);
    const territory = configData.territory;

    const [leadCount, businessCount] = await Promise.all([
      this.prisma.lead.count({ where: { affiliateId: userId } }),
      this.prisma.business.count({ where: { affiliateId: userId } }),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const visitedTodayCount = await this.prisma.lead.count({
      where: {
        affiliateId: userId,
        updatedAt: { gte: todayStart },
      },
    });

    return {
      country: territory.country,
      state: territory.state,
      city: territory.city,
      area: territory.area,
      cluster: territory.cluster,
      totalAssigned: territory.totalAssigned,
      plannedToday: configData.userTargets.dailyLeadTarget,
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

    return this.prisma.marketMappingPlan.update({
      where: { id },
      data: dto,
    });
  }

  async getAnchors(userId: string) {
    return this.prisma.marketMappingVisit.findMany({
      where: { userId, isAnchor: true, status: "NOT_YET" },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getPriorityVisits(userId: string) {
    return this.prisma.marketMappingVisit.findMany({
      where: { userId, status: { in: ["NOT_YET", "INTERESTED"] } },
      orderBy: [{ isAnchor: "desc" }, { updatedAt: "desc" }],
      take: 50,
    });
  }

  async getPartnerships(userId: string) {
    return this.prisma.marketMappingVisit.findMany({
      where: { userId, interested: "YES", status: { not: "CUSTOMER" } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
  }

  async getInsights(userId: string) {
    const configData = await this.getConfig(userId);
    const territory = configData.territory;

    const visits = await this.getVisits(userId);
    const total = visits.length;
    const visited = visits.filter((visit) => visit.status !== "NOT_YET").length;
    const interested = visits.filter((visit) => visit.status === "INTERESTED" || visit.interested === "YES").length;
    const anchors = visits.filter((visit) => visit.isAnchor).length;
    const maturity = {
      discovery: Math.min(100, total * 5), verification: total ? Math.round((visited / total) * 100) : 0,
      sales: total ? Math.round((interested / total) * 100) : 0, customers: total ? Math.round((visits.filter((v) => v.status === "CUSTOMER").length / total) * 100) : 0,
      partnerships: total ? Math.round((visits.filter((v) => v.interested === "YES").length / total) * 100) : 0,
      overall: total ? Math.round(((visited + interested + anchors) / (total * 3)) * 100) : 0,
    };
    const recommendations = [
      ...(visits.filter((visit) => visit.isAnchor && visit.status === "NOT_YET").slice(0, 3).map((visit) => ({ id: visit.id, type: "UNTOUCHED_ANCHOR", title: visit.name, description: "Anchor business still requires a first visit.", rating: 5 }))),
      ...(visits.filter((visit) => visit.status === "INTERESTED").slice(0, 3).map((visit) => ({ id: visit.id, type: "PRIORITY_VISIT", title: visit.name, description: "Interested business requires follow-up.", rating: 4 }))),
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
    const [visits, user, monthBusinesses] = await Promise.all([
      this.prisma.marketMappingVisit.findMany({ where: { userId } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { dailyLeadTarget: true, monthlyConversionTarget: true } }),
      this.prisma.business.findMany({ where: { affiliateId: userId, createdAt: { gte: month } }, select: { commissionAmount: true } }),
    ]);
    const countSince = (date: Date) => visits.filter((visit) => (visit.visitedAt || visit.updatedAt) >= date).length;
    const completed = visits.filter((visit) => visit.status !== "NOT_YET").length;
    const customers = visits.filter((visit) => visit.status === "CUSTOMER").length;
    const proposalsSent = visits.filter((visit) => ["CONTACTED", "INTERESTED", "CUSTOMER"].includes(visit.status)).length;
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
      reportingScore: visits.length ? Math.round((completed / visits.length) * 100) : 0,
      attendanceRate: visits.length ? Math.round((completed / visits.length) * 100) : 0,
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
    const [leads, businesses, notes] = await Promise.all([
      this.prisma.lead.findMany({ where: { affiliateId: userId, createdAt: { gte: start } }, orderBy: { createdAt: "desc" } }),
      this.prisma.business.findMany({ where: { affiliateId: userId, createdAt: { gte: start } }, orderBy: { createdAt: "desc" } }),
      this.prisma.marketMappingNote.findMany({ where: { userId, createdAt: { gte: start } }, orderBy: { createdAt: "desc" } }),
    ]);
    const visits = await this.prisma.marketMappingVisit.findMany({ where: { userId, OR: [{ visitedAt: { gte: start } }, { visitedAt: null, updatedAt: { gte: start } }] }, orderBy: { updatedAt: "desc" } });

    return {
      period,
      summary: {
        totalLeads: leads.length,
        totalConversions: businesses.length,
        totalVisits: visits.length,
        totalEarnings: businesses.reduce((acc, b) => acc + Number(b.commissionAmount || 0), 0),
      },
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
      visits: visits.map((visit) => ({ id: visit.id, businessName: visit.name, category: visit.category, status: visit.status, date: visit.visitedAt || visit.updatedAt, notes: visit.visitNotes })),
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

    return {
      cluster,
      businesses: assignedBusinesses,
    };
  }

  async getAssignments() {
    return this.prisma.marketMappingAssignment.findMany({
      include: {
        user: { select: { id: true, fullName: true, role: true, email: true } },
        cluster: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createAssignment(dto: { userId: string; clusterId: string; dailyLeadTarget: number; weeklyLeadTarget: number; monthlyConversionTarget: number; allowUserEdit?: boolean }) {
    return this.prisma.marketMappingAssignment.create({
      data: {
        userId: dto.userId,
        clusterId: dto.clusterId,
        dailyLeadTarget: dto.dailyLeadTarget,
        weeklyLeadTarget: dto.weeklyLeadTarget,
        monthlyConversionTarget: dto.monthlyConversionTarget,
        allowUserEdit: dto.allowUserEdit ?? true,
      },
    });
  }

  async updateAssignment(id: string, dto: { dailyLeadTarget?: number; weeklyLeadTarget?: number; monthlyConversionTarget?: number; allowUserEdit?: boolean }) {
    const assignment = await this.prisma.marketMappingAssignment.findUnique({ where: { id } });
    if (!assignment) throw new NotFoundException("Assignment not found");

    return this.prisma.marketMappingAssignment.update({
      where: { id },
      data: dto,
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
        where: { affiliateId: { in: assignedAffiliateIds } },
        take: 15,
        orderBy: { createdAt: "desc" },
        include: { affiliate: { select: { fullName: true } } },
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
        ...leads.map((l) => ({ type: "LEAD", id: l.id, name: l.businessName, submittedBy: l.affiliate?.fullName, date: l.createdAt })),
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
