import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateMissionPlanDto,
  UpdateMissionPlanDto,
  CreateMarketMappingNoteDto,
} from "./dto/market-mapping.dto";

@Injectable()
export class MarketMappingService {
  constructor(private readonly prisma: PrismaService) {}

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
          name: "Ikeja Central Business District",
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

    return {
      territory: config,
      userTargets: {
        dailyLeadTarget: user?.dailyLeadTarget || 5,
        monthlyConversionTarget: user?.monthlyConversionTarget || 20,
      },
      settings: {
        autoRefreshVisits: true,
        enableGpsTracking: true,
        aiRecommendationsEnabled: true,
      },
    };
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
    const configData = await this.getConfig(userId);
    const anchors = (configData.territory.anchorsJson as any[]) || [
      {
        id: "anchor-1",
        name: "Mega Retail Mall",
        category: "Supermarket & Retail",
        address: "12 Allen Avenue, Ikeja",
        contactPerson: "Chief Operations Officer",
        phone: "+2348011112222",
        status: "ANCHOR_PARTNER",
        tier: "Platinum",
        potentialVolume: "High",
      },
      {
        id: "anchor-2",
        name: "Lagos Tech Hub Plaza",
        category: "Corporate & Tech",
        address: "45 Opebi Road, Ikeja",
        contactPerson: "Facilities Manager",
        phone: "+2348033334444",
        status: "TARGET_ANCHOR",
        tier: "Gold",
        potentialVolume: "High",
      },
    ];
    return anchors;
  }

  async getPriorityVisits(userId: string) {
    return [
      {
        id: "prio-1",
        businessName: "Prime Logistics Ltd",
        category: "Logistics & Transport",
        address: "7 Toyin Street, Ikeja",
        opportunityScore: 94,
        recommendedAction: "Pitch Enterprise Subscription Plan",
        distanceKm: 0.8,
        priority: "HIGH",
      },
      {
        id: "prio-2",
        businessName: "Greenfield Pharmacy Chain",
        category: "Healthcare & Retail",
        address: "22 Isaac John Street, Ikeja",
        opportunityScore: 88,
        recommendedAction: "Schedule In-Person POS Demo",
        distanceKm: 1.4,
        priority: "HIGH",
      },
      {
        id: "prio-3",
        businessName: "Apex Restaurant & Lounge",
        category: "Hospitality",
        address: "15 Adeniyi Jones Avenue, Ikeja",
        opportunityScore: 82,
        recommendedAction: "Follow up on trial setup",
        distanceKm: 2.1,
        priority: "MEDIUM",
      },
    ];
  }

  async getPartnerships(userId: string) {
    return [
      {
        id: "partner-1",
        name: "Lagos Chamber of Commerce Network",
        type: "Association",
        memberCount: 450,
        opportunity: "Bulk Onboarding Discount Program",
        status: "EXPLORING",
      },
      {
        id: "partner-2",
        name: "Ikeja Traders Co-operative",
        type: "Cooperative Union",
        memberCount: 280,
        opportunity: "Sub-Affiliate Partnership Model",
        status: "PROPOSAL_SENT",
      },
    ];
  }

  async getInsights(userId: string) {
    const configData = await this.getConfig(userId);
    const territory = configData.territory;

    return {
      aiRecommendations: [
        {
          id: "rec-1",
          title: "High Conversion Window",
          description: "Retail businesses along Allen Avenue have an 85% conversion rate on Tuesday mornings.",
          impact: "High",
          category: "Timing",
        },
        {
          id: "rec-2",
          title: "Upsell Opportunity",
          description: "3 trial businesses in your cluster are reaching 80% transaction limits — ideal for Professional tier upgrade.",
          impact: "High",
          category: "Growth",
        },
      ],
      clusterMaturity: territory.maturityJson || {
        anchorDensity: 82,
        coverageRate: 68,
        conversionRate: 45,
        followUpScore: 90,
        retentionRate: 85,
        overallMaturity: 74,
      },
    };
  }

  async getNotes(userId: string, businessId?: string) {
    const where: any = { userId };
    if (businessId) where.businessId = businessId;

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
        content: dto.content,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
      },
    });
  }

  async getPerformance(userId: string) {
    const [leads, businesses] = await Promise.all([
      this.prisma.lead.findMany({ where: { affiliateId: userId } }),
      this.prisma.business.findMany({ where: { affiliateId: userId } }),
    ]);

    const totalLeads = leads.length;
    const totalConversions = businesses.length;

    return {
      dailyVisits: 6,
      weeklyVisits: 32,
      monthlyVisits: 128,
      meetingsCompleted: totalLeads,
      customersAcquired: totalConversions,
      conversionRatePercent: totalLeads > 0 ? Math.round((totalConversions / totalLeads) * 100) : 0,
      reportingScore: 96,
      attendanceRate: 98,
    };
  }

  async getReports(userId: string, period: string = "monthly") {
    const [leads, businesses, notes] = await Promise.all([
      this.prisma.lead.findMany({ where: { affiliateId: userId }, orderBy: { createdAt: "desc" } }),
      this.prisma.business.findMany({ where: { affiliateId: userId }, orderBy: { createdAt: "desc" } }),
      this.prisma.marketMappingNote.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    ]);

    return {
      period,
      summary: {
        totalLeads: leads.length,
        totalConversions: businesses.length,
        totalVisits: leads.length + businesses.length + 15,
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
    };
  }

  async downloadReportCsv(userId: string, period: string = "monthly") {
    const report = await this.getReports(userId, period);
    const escapeCsv = (val?: string) => `"${(val || "").replace(/"/g, '""')}"`;
    const header = "Type,ID,Business Name,Status,Date\n";
    const leadRows = report.leads.map((l) => `Lead,${l.id},${escapeCsv(l.businessName)},${l.status},${l.date}`).join("\n");
    const businessRows = report.visitedBusinesses.map((b) => `Business,${b.id},${escapeCsv(b.businessName)},${b.status},${b.date}`).join("\n");
    return header + leadRows + (leadRows && businessRows ? "\n" : "") + businessRows;
  }
}
