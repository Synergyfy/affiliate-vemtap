import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { MarketMappingService } from "./market-mapping.service";
import { PrismaService } from "../prisma/prisma.service";

describe("MarketMappingService", () => {
  let service: MarketMappingService;
  let _prisma: PrismaService;
  const mockPrismaService: any = {
    $transaction: jest.fn((cb: (prisma: any) => any) => cb(mockPrismaService)),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    marketMappingTerritoryConfig: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    lead: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    business: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    marketMappingPlan: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    marketMappingNote: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    marketMappingHierarchy: {
      findUnique: jest.fn(),
    },
    marketMappingAssignment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    marketMappingAdminConfig: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketMappingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<MarketMappingService>(MarketMappingService);
    _prisma = module.get<PrismaService>(PrismaService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getConfig", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockPrismaService.user.findUnique.mockResolvedValue({
        territoryId: "NG-LAG-IKJ-01",
        dailyLeadTarget: 5,
        monthlyConversionTarget: 20,
      });
      mockPrismaService.marketMappingTerritoryConfig.findUnique.mockResolvedValue({
        territoryCode: "NG-LAG-IKJ-01",
        country: "Nigeria",
        state: "Lagos",
        city: "Ikeja",
        area: "Allen / Opebi",
        cluster: "Tech & Retail Cluster 1",
        totalAssigned: 120,
        anchorCount: 15,
        prospectCount: 85,
        maturityJson: {},
      });
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue({
        id: "cfg-1",
        categories: ["Pharmacy"],
        businessCategories: ["Pharmacy"],
        openingDays: ["Mon"],
        customerRanges: [],
        businessSizes: [],
        contactPositions: [],
        pipelineStatuses: [],
        interestOptions: [],
        planTypes: [],
        faqs: [],
        ticketStatuses: [],
        businessStatuses: [],
        paymentStatuses: [],
        dailyTarget: 5,
        weeklyTarget: 25,
        monthlyTarget: 20,
        fieldDefaults: {},
        updatedAt: new Date(),
      });
      mockPrismaService.marketMappingAssignment.findFirst.mockResolvedValue(null);
    });

    it("should return config with user targets", async () => {
      const result = await service.getConfig("user-1");

      expect(result.dailyTarget).toBe(5);
      expect(result.monthlyTarget).toBe(20);
      expect(result.userTargets.dailyLeadTarget).toBe(5);
      expect(result.assignedCluster).toBe("Tech & Retail Cluster 1");
      expect(result.isTargetLocked).toBe(false);
      expect(result.targetSource).toBe("USER_ADMIN_SET");
    });

    it("should lock target when active cluster assignment has allowUserEdit: false", async () => {
      mockPrismaService.marketMappingAssignment.findFirst.mockResolvedValue({
        id: "asgn-1",
        clusterId: "cl-wuse",
        dailyLeadTarget: 15,
        weeklyLeadTarget: 75,
        monthlyConversionTarget: 30,
        allowUserEdit: false,
        duration: "ONE_WEEK",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assignedAt: new Date(),
        cluster: { id: "cl-wuse", name: "Wuse Market" },
      });

      const result = await service.getConfig("user-1");

      expect(result.dailyTarget).toBe(15);
      expect(result.weeklyTarget).toBe(75);
      expect(result.monthlyTarget).toBe(30);
      expect(result.isTargetLocked).toBe(true);
      expect(result.targetSource).toBe("CLUSTER_ASSIGNMENT");
      expect(result.assignedCluster).toBe("Wuse Market");
      expect(result.assignment?.clusterName).toBe("Wuse Market");
    });

    it("should allow editing (isTargetLocked: false) when active cluster assignment has allowUserEdit: true", async () => {
      mockPrismaService.marketMappingAssignment.findFirst.mockResolvedValue({
        id: "asgn-1",
        clusterId: "cl-wuse",
        dailyLeadTarget: 15,
        weeklyLeadTarget: 75,
        monthlyConversionTarget: 30,
        allowUserEdit: true,
        duration: "ONE_WEEK",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assignedAt: new Date(),
        cluster: { id: "cl-wuse", name: "Wuse Market" },
      });

      const result = await service.getConfig("user-1");

      expect(result.dailyTarget).toBe(15);
      expect(result.isTargetLocked).toBe(false);
      expect(result.targetSource).toBe("CLUSTER_ASSIGNMENT");
      expect(result.assignment?.allowUserEdit).toBe(true);
    });

    it("should fall back to defaults when no admin config exists", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        territoryId: "NG-LAG-IKJ-01",
        dailyLeadTarget: 0,
        monthlyConversionTarget: 0,
      });
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue(null);
      mockPrismaService.marketMappingAdminConfig.create.mockResolvedValue({
        id: "cfg-new",
        dailyTarget: 5,
        weeklyTarget: 25,
        monthlyTarget: 20,
      });

      const result = await service.getConfig("user-1");

      expect(mockPrismaService.marketMappingAdminConfig.create).toHaveBeenCalled();
      expect(result.dailyTarget).toBe(5);
      expect(result.isTargetLocked).toBe(false);
      expect(result.targetSource).toBe("GLOBAL_DEFAULT");
    });
  });

  describe("getClusterDetail", () => {
    const cluster = {
      id: "cluster-1",
      name: "Wuse Market",
      type: "CLUSTER",
      assignments: [{ userId: "user-1" }, { userId: "user-2" }],
    };

    const existingBusinesses = [
      {
        id: "biz-1",
        businessName: "Converted Shop",
        planType: "BASIC",
        status: "ACTIVE",
        ownerName: "Adam",
        phone: "08011111111",
        affiliateId: "user-1",
      },
    ];

    const capturedLeads = [
      {
        id: "visit-1",
        businessName: "Captured Shop",
        industry: "Pharmacy",
        status: "INTERESTED",
        isAnchor: false,
        isPlaceholder: false,
        businessAddress: null,
        location: "Shop 3",
        phone: "08022222222",
        contactName: "Jane",
        email: "jane@example.com",
        gpsLat: "9.0765",
        gpsLng: "7.4898",
        dailyCustomers: "HIGH",
        businessSize: "SMALL",
        openingHours: "09:00-18:00",
        comments: "Follow up next week",
        visitedAt: new Date("2026-08-01T10:00:00Z"),
        nextVisitDate: null,
        nextVisitTime: null,
        userId: "user-1",
        user: { id: "user-1", fullName: "Affiliate One" },
      },
      {
        id: "visit-dup",
        businessName: "Converted Shop",
        status: "VISITED",
        phone: "08011111111",
        gpsLat: "9.0",
        gpsLng: "7.4",
        userId: "user-2",
        user: { id: "user-2", fullName: "Affiliate Two" },
      },
      {
        id: "visit-nogps",
        businessName: "No GPS Shop",
        status: "VISITED",
        phone: "08033333333",
        gpsLat: null,
        gpsLng: null,
        userId: "user-2",
        user: { id: "user-2", fullName: "Affiliate Two" },
      },
      {
        id: "visit-badcoords",
        businessName: "Bad Coords Shop",
        status: "VISITED",
        phone: "08044444444",
        gpsLat: "not-a-number",
        gpsLng: "7.4",
        userId: "user-2",
        user: { id: "user-2", fullName: "Affiliate Two" },
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      mockPrismaService.marketMappingHierarchy.findUnique.mockResolvedValue(cluster);
      mockPrismaService.business.findMany.mockResolvedValue(existingBusinesses);
      mockPrismaService.lead.findMany.mockResolvedValue(capturedLeads);
    });

    it("should throw NotFoundException when cluster does not exist", async () => {
      mockPrismaService.marketMappingHierarchy.findUnique.mockResolvedValue(null);

      await expect(service.getClusterDetail("missing")).rejects.toThrow(NotFoundException);
    });

    it("should include captured leads with GPS as mapped businesses with real coordinates", async () => {
      const result = await service.getClusterDetail("cluster-1");

      expect(result.businesses).toHaveLength(2);
      const captured = result.businesses.find((b) => b.id === "visit-1");
      expect(captured).toMatchObject({
        name: "Captured Shop",
        status: "NEGOTIATING",
        latitude: 9.0765,
        longitude: 7.4898,
        address: "Shop 3",
        phone: "08022222222",
        email: "jane@example.com",
        notes: "Follow up next week",
        clusterName: "Wuse Market",
        assignedAffiliateId: "user-1",
        assignedAffiliateName: "Affiliate One",
        source: "CAPTURE",
        isAnchor: false,
      });
    });

    it("should dedupe captured leads whose phone matches an existing business", async () => {
      const result = await service.getClusterDetail("cluster-1");

      expect(result.businesses.some((b) => b.id === "visit-dup")).toBe(false);
    });

    it("should exclude captured leads without GPS coordinates", async () => {
      const result = await service.getClusterDetail("cluster-1");

      expect(result.businesses.some((b) => b.id === "visit-nogps")).toBe(false);
    });

    it("should exclude captured leads with non-numeric GPS coordinates", async () => {
      const result = await service.getClusterDetail("cluster-1");

      expect(result.businesses.some((b) => b.id === "visit-badcoords")).toBe(false);
    });

    it("should return only existing businesses when there are no assigned affiliates", async () => {
      mockPrismaService.marketMappingHierarchy.findUnique.mockResolvedValue({
        ...cluster,
        assignments: [],
      });
      mockPrismaService.business.findMany.mockResolvedValue([]);

      const result = await service.getClusterDetail("cluster-1");

      expect(mockPrismaService.lead.findMany).not.toHaveBeenCalled();
      expect(result.businesses).toEqual([]);
    });
  });

  describe("createVisit / updateVisit (pipeline leads)", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("creates a lead with NOT_YET status and no visitedAt", async () => {
      mockPrismaService.lead.create.mockResolvedValue({
        id: "lead-1",
        businessName: "Shop One",
        status: "NOT_YET",
        visitedAt: null,
      });

      const result = await service.createVisit("user-1", {
        businessName: "Shop One",
        industry: "Pharmacy",
        status: "NOT_YET",
      } as any);

      expect(mockPrismaService.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          businessName: "Shop One",
          status: "NOT_YET",
          visitedAt: undefined,
        }),
      });
      expect(result.visited).toBe(false);
    });

    it("stamps visitedAt when a lead is created already visited (engaged status)", async () => {
      mockPrismaService.lead.create.mockResolvedValue({
        id: "lead-1",
        businessName: "Shop One",
        status: "INTERESTED",
        visitedAt: new Date(),
      });

      const result = await service.createVisit("user-1", {
        businessName: "Shop One",
        status: "INTERESTED",
      } as any);

      expect(mockPrismaService.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: "INTERESTED",
          visitedAt: expect.any(Date),
        }),
      });
      expect(result.visited).toBe(true);
    });

    it("stamps visitedAt when a lead transitions from NOT_YET to VISITED", async () => {
      mockPrismaService.lead.findFirst.mockResolvedValue({
        id: "lead-1",
        userId: "user-1",
        status: "NOT_YET",
        visitedAt: null,
      });
      mockPrismaService.lead.update.mockResolvedValue({
        id: "lead-1",
        businessName: "Shop One",
        status: "VISITED",
        visitedAt: new Date(),
      });

      const result = await service.updateVisit("lead-1", "user-1", { status: "VISITED" } as any);

      expect(mockPrismaService.lead.update).toHaveBeenCalledWith({
        where: { id: "lead-1" },
        data: expect.objectContaining({
          status: "VISITED",
          visitedAt: expect.any(Date),
        }),
      });
      expect(result.visited).toBe(true);
    });

    it("keeps visitedAt unchanged when updating an already visited lead", async () => {
      const visitedAt = new Date();
      mockPrismaService.lead.findFirst.mockResolvedValue({
        id: "lead-1",
        userId: "user-1",
        status: "INTERESTED",
        visitedAt,
      });
      mockPrismaService.lead.update.mockResolvedValue({
        id: "lead-1",
        status: "CUSTOMER",
        visitedAt,
      });

      const result = await service.updateVisit("lead-1", "user-1", { status: "CUSTOMER" } as any);

      expect(mockPrismaService.lead.update).toHaveBeenCalledWith({
        where: { id: "lead-1" },
        data: expect.objectContaining({ status: "CUSTOMER", visitedAt: undefined }),
      });
      expect(result.visited).toBe(true);
    });

    it("throws NotFoundException when updating a lead that does not exist", async () => {
      mockPrismaService.lead.findFirst.mockResolvedValue(null);

      await expect(service.updateVisit("missing", "user-1", { status: "VISITED" } as any)).rejects.toThrow(NotFoundException);
    });

    it("maps legacy POTENTIAL to NOT_YET on create", async () => {
      mockPrismaService.lead.create.mockResolvedValue({
        id: "lead-1",
        businessName: "Shop One",
        status: "NOT_YET",
        visitedAt: null,
      });

      const result = await service.createVisit("user-1", {
        businessName: "Shop One",
        status: "POTENTIAL",
      } as any);

      expect(mockPrismaService.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: "NOT_YET",
          visitedAt: undefined,
        }),
      });
      expect(result.visited).toBe(false);
    });

    it("maps legacy COMPLETED to CUSTOMER on update", async () => {
      mockPrismaService.lead.findFirst.mockResolvedValue({
        id: "lead-1",
        userId: "user-1",
        status: "INTERESTED",
        visitedAt: new Date(),
      });
      mockPrismaService.lead.update.mockResolvedValue({
        id: "lead-1",
        status: "CUSTOMER",
        visitedAt: new Date(),
      });

      const result = await service.updateVisit("lead-1", "user-1", { status: "COMPLETED" } as any);

      expect(mockPrismaService.lead.update).toHaveBeenCalledWith({
        where: { id: "lead-1" },
        data: expect.objectContaining({ status: "CUSTOMER", visitedAt: undefined }),
      });
      expect(result.visited).toBe(true);
    });

    it("does not reset an existing lead to NOT_YET when status is omitted on update", async () => {
      const visitedAt = new Date();
      mockPrismaService.lead.findFirst.mockResolvedValue({
        id: "lead-1",
        userId: "user-1",
        status: "CONTACTED",
        visitedAt,
      });
      mockPrismaService.lead.update.mockResolvedValue({
        id: "lead-1",
        status: "CONTACTED",
        visitedAt,
      });

      const result = await service.updateVisit("lead-1", "user-1", { comments: "updated" } as any);

      const updateArgs = mockPrismaService.lead.update.mock.calls[0][0];
      expect(updateArgs.data).not.toHaveProperty("status");
      expect(mockPrismaService.lead.update).toHaveBeenCalledWith({
        where: { id: "lead-1" },
        data: expect.objectContaining({ comments: "updated", visitedAt: undefined }),
      });
      expect(result.visited).toBe(true);
    });
  });

  describe("getReports", () => {
    let now: Date;

    beforeEach(() => {
      // Pin the clock to a Friday so weekday / optional-weekend behaviour is deterministic.
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 7, 14, 12, 0, 0));
      now = new Date();

      jest.clearAllMocks();
      mockPrismaService.user.findUnique.mockResolvedValue({ dailyLeadTarget: 20 });
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue({ dailyTarget: 20 });
      mockPrismaService.lead.findMany.mockResolvedValue([]);
      mockPrismaService.business.findMany.mockResolvedValue([]);
      mockPrismaService.marketMappingNote.findMany.mockResolvedValue([]);
      mockPrismaService.marketMappingPlan.findMany.mockResolvedValue([]);
      mockPrismaService.marketMappingAssignment.findMany.mockResolvedValue([]);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should score 0% on days with no activity and no mocked baselines", async () => {
      const result = await service.getReports("user-1", "daily");

      expect(result.weights.leadTarget).toBe(20);
      expect(result.weights.riskThreshold).toBe(90);
      expect(result.ledger[0].score).toBe(0);
      expect(result.ledger[0].infoPct).toBe(0);
      expect(result.ledger[0].gpsPct).toBe(0);
      expect(result.ledger[0].infoComposite).toBe(0);
      expect(result.ledger[0].met).toBe(false);
    });

    it("should strictly use global daily target config even if user has a different personal target", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ dailyLeadTarget: 15 });
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue({ dailyTarget: 20 });

      const result = await service.getReports("user-1", "daily");

      expect(result.weights.leadTarget).toBe(20);
      expect(result.ledger[0].target).toBe(20);
    });

    it("should strictly use global daily target config even when user is in an active cluster assignment with custom cluster targets", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ dailyLeadTarget: 5 });
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue({ dailyTarget: 20 });
      mockPrismaService.marketMappingAssignment.findMany.mockResolvedValue([
        {
          id: "asgn-1",
          clusterId: "cl-banex",
          dailyLeadTarget: 30,
          weeklyLeadTarget: 150,
          monthlyConversionTarget: 50,
          assignedAt: new Date(2026, 7, 10),
          expiresAt: new Date(2026, 7, 17),
          cluster: { id: "cl-banex", name: "Banex Plaza" },
        },
      ]);

      const result = await service.getReports("user-1", "daily");

      expect(result.weights.leadTarget).toBe(20);
      expect(result.ledger[0].target).toBe(20);
      expect(result.ledger[0].clusterName).toBe("Banex Plaza");
    });

    it("should strictly use global daily target config even when user has created custom mission plans", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ dailyLeadTarget: 5 });
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue({ dailyTarget: 20 });
      mockPrismaService.marketMappingAssignment.findMany.mockResolvedValue([
        {
          id: "asgn-1",
          clusterId: "cl-banex",
          dailyLeadTarget: 30,
          weeklyLeadTarget: 150,
          monthlyConversionTarget: 50,
          allowUserEdit: true,
          assignedAt: new Date(2026, 7, 10),
          expiresAt: new Date(2026, 7, 17),
          cluster: { id: "cl-banex", name: "Banex Plaza" },
        },
      ]);
      mockPrismaService.marketMappingPlan.findMany.mockResolvedValue([
        {
          id: "plan-custom",
          userId: "user-1",
          horizon: "DAY",
          targetLeads: 45,
          targetVisits: 45,
          targetConversions: 5,
          startDate: new Date(2026, 7, 14),
          endDate: new Date(2026, 7, 14),
        },
      ]);

      const result = await service.getReports("user-1", "daily");

      expect(result.weights.leadTarget).toBe(20);
      expect(result.ledger[0].target).toBe(20);
      expect(result.summary.target).toBe(20);
    });

    it("should derive Business Info + GPS from real visit (visited lead) data", async () => {
      // getReports calls prisma.lead.findMany twice: leads (createdAt) then visits (visitedAt)
      mockPrismaService.lead.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: "lead-1",
            businessName: "Complete Shop",
            industry: "Pharmacy",
            phone: "08011111111",
            contactName: "Jane",
            location: "Shop 3",
            businessSize: "SMALL",
            openingHours: "09:00-18:00",
            contactRole: "Owner",
            gpsLat: "9.0765",
            gpsLng: "7.4898",
            status: "INTERESTED",
            visitedAt: now,
            updatedAt: now,
          },
        ]);

      const result = await service.getReports("user-1", "daily");

      const today = result.ledger[0];
      expect(today.visits).toBe(1);
      expect(today.infoPct).toBe(100);
      expect(today.gpsPct).toBe(100);
      expect(today.infoComposite).toBe(100);
      expect(today.score).toBe(21);
    });

    it("should not score business info on days with visits lacking profile fields or GPS", async () => {
      mockPrismaService.lead.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: "lead-1",
            businessName: "Bare Shop",
            gpsLat: null,
            gpsLng: null,
            status: "NOT_YET",
            visitedAt: now,
            updatedAt: now,
          },
        ]);

      const result = await service.getReports("user-1", "daily");

      const today = result.ledger[0];
      expect(today.infoPct).toBe(0);
      expect(today.gpsPct).toBe(0);
    });

    it("should fall back to default global target (5) when admin config is created as fallback", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ dailyLeadTarget: 0 });
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue(null);
      mockPrismaService.marketMappingAdminConfig.create.mockResolvedValue({
        id: "cfg-default",
        dailyTarget: 5,
        weeklyTarget: 25,
        monthlyTarget: 20,
      });

      const result = await service.getReports("user-1", "daily");

      expect(result.weights.leadTarget).toBe(5);
      expect(result.ledger[0].target).toBe(5);
    });

    it("should use global weekly target in weekly report summary", async () => {
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue({
        dailyTarget: 20,
        weeklyTarget: 100,
        monthlyTarget: 400,
      });

      const result = await service.getReports("user-1", "weekly");

      expect(result.summary.target).toBe(100);
      expect(result.summary.visitsTarget).toBe(100);
      expect(result.weights.leadTarget).toBe(100);
    });

    it("should use global monthly target in monthly report summary", async () => {
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue({
        dailyTarget: 20,
        weeklyTarget: 100,
        monthlyTarget: 400,
      });

      const result = await service.getReports("user-1", "monthly");

      expect(result.summary.target).toBe(400);
      expect(result.summary.visitsTarget).toBe(400);
      expect(result.weights.leadTarget).toBe(400);
    });

    it("should mark unplanned weekend days as optional with zero target in daily ledger", async () => {
      const result = await service.getReports("user-1", "monthly");

      // ledger[4] = Mon Aug 10, ledger[5] = Sun Aug 9, ledger[6] = Sat Aug 8.
      expect(result.ledger[4].optional).toBe(false);
      expect(result.ledger[5].optional).toBe(true);
      expect(result.ledger[5].target).toBe(0);
      expect(result.ledger[6].optional).toBe(true);
    });

    it("should count conversions by paidAt as well as createdAt", async () => {
      mockPrismaService.business.findMany.mockResolvedValue([
        {
          id: "biz-1",
          businessName: "Paying Shop",
          ownerName: "Owner",
          planType: "BASIC",
          status: "ACTIVE",
          commissionAmount: 100,
          createdAt: new Date(now.getTime() - 10 * 86400000),
          paidAt: now,
        },
      ]);

      const result = await service.getReports("user-1", "daily");

      expect(result.summary.totalConversions).toBe(1);
      expect(result.ledger[0].conversions).toBe(1);
    });
  });

  describe("getAdminCapturedVisits", () => {
    it("should return all captured leads with GPS mapped to businesses", async () => {
      const leads = [
        {
          id: "visit-1",
          businessName: "Captured Shop",
          industry: "Pharmacy",
          status: "INTERESTED",
          isAnchor: false,
          isPlaceholder: false,
          businessAddress: null,
          location: "Shop 3",
          phone: "08022222222",
          contactName: "Jane",
          gpsLat: "8.482322",
          gpsLng: "4.595859",
          dailyCustomers: "HIGH",
          businessSize: "SMALL",
          comments: "Follow up next week",
          visitedAt: new Date("2026-08-01T10:00:00Z"),
          userId: "user-1",
          user: { id: "user-1", fullName: "Affiliate One" },
        },
        {
          id: "visit-nogps",
          businessName: "No GPS Shop",
          status: "VISITED",
          phone: "08033333333",
          gpsLat: null,
          gpsLng: null,
          userId: "user-2",
          user: { id: "user-2", fullName: "Affiliate Two" },
        },
      ];
      mockPrismaService.lead.findMany.mockResolvedValue(leads);

      const result = await service.getAdminCapturedVisits();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "visit-1",
        name: "Captured Shop",
        status: "NEGOTIATING",
        latitude: 8.482322,
        longitude: 4.595859,
        address: "Shop 3",
        assignedAffiliateName: "Affiliate One",
        source: "CAPTURE",
      });
    });

    it("should return empty array when no captured leads have GPS", async () => {
      mockPrismaService.lead.findMany.mockResolvedValue([
        { id: "visit-x", businessName: "X", gpsLat: null, gpsLng: null },
      ]);

      const result = await service.getAdminCapturedVisits();

      expect(result).toEqual([]);
    });
  });

  describe("visit next-visit validation", () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should reject a past nextVisitDate on create", async () => {
      await expect(
        service.createVisit("user-1", { businessName: "Shop", nextVisitDate: "2020-01-01" } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject a past nextVisitTime on today's date on create", async () => {
      await expect(
        service.createVisit("user-1", { businessName: "Shop", nextVisitDate: todayStr, nextVisitTime: "00:00" } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should accept a future nextVisitDate on create", async () => {
      const created = { id: "lead-1", businessName: "Shop", nextVisitDate: "2999-01-01" };
      mockPrismaService.lead.create.mockResolvedValue(created);

      const result = await service.createVisit("user-1", { businessName: "Shop", nextVisitDate: "2999-01-01" } as any);

      expect(result).toMatchObject(created);
    });

    it("should reject a changed past nextVisitDate on update", async () => {
      mockPrismaService.lead.findFirst.mockResolvedValue({
        id: "lead-1",
        userId: "user-1",
        nextVisitDate: "2999-01-01",
        nextVisitTime: null,
      });

      await expect(
        service.updateVisit("lead-1", "user-1", { nextVisitDate: "2020-01-01" } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should allow an unchanged legacy past nextVisitDate on update", async () => {
      mockPrismaService.lead.findFirst.mockResolvedValue({
        id: "lead-1",
        userId: "user-1",
        nextVisitDate: "2020-01-01",
        nextVisitTime: null,
      });
      const updated = { id: "lead-1", nextVisitDate: "2020-01-01" };
      mockPrismaService.lead.update.mockResolvedValue(updated);

      const result = await service.updateVisit("lead-1", "user-1", { nextVisitDate: "2020-01-01" } as any);

      expect(result).toMatchObject(updated);
    });
  });

  describe("cluster assignment durations & line manager cascade", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should calculate correct expiresAt for ONE_WEEK duration", async () => {
      mockPrismaService.marketMappingAssignment.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.marketMappingAssignment.create.mockImplementation((args: any) =>
        Promise.resolve({ id: "assg-1", ...args.data }),
      );

      const result = await service.createAssignment({
        userId: "user-10",
        clusterId: "cluster-1",
        dailyLeadTarget: 10,
        weeklyLeadTarget: 50,
        monthlyConversionTarget: 20,
        duration: "ONE_WEEK",
        reassignExisting: true,
      });

      expect(mockPrismaService.marketMappingAssignment.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-10" },
      });
      expect(result.duration).toBe("ONE_WEEK");
      expect(result.expiresAt).toBeInstanceOf(Date);
      // Check that expiresAt is ~7 days in the future
      const diffMs = (result.expiresAt as Date).getTime() - Date.now();
      expect(diffMs).toBeGreaterThan(6 * 24 * 60 * 60 * 1000);
      expect(diffMs).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000 + 5000);
    });

    it("should calculate correct expiresAt for CUSTOM duration with customDays", async () => {
      mockPrismaService.marketMappingAssignment.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.marketMappingAssignment.create.mockImplementation((args: any) =>
        Promise.resolve({ id: "assg-2", ...args.data }),
      );

      const result = await service.createAssignment({
        userId: "user-10",
        clusterId: "cluster-1",
        dailyLeadTarget: 10,
        weeklyLeadTarget: 50,
        monthlyConversionTarget: 20,
        duration: "CUSTOM",
        customDays: 14,
      });

      expect(result.duration).toBe("CUSTOM");
      expect(result.expiresAt).toBeInstanceOf(Date);
      const diffMs = (result.expiresAt as Date).getTime() - Date.now();
      expect(diffMs).toBeGreaterThan(13 * 24 * 60 * 60 * 1000);
    });

    it("should assign line manager and all managed team members", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: "mgr-1",
        role: "MANAGER",
        fullName: "Line Manager One",
      });
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: "sub-1" },
        { id: "sub-2" },
      ]);
      mockPrismaService.marketMappingAssignment.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaService.marketMappingAssignment.createMany.mockResolvedValue({ count: 3 });
      mockPrismaService.marketMappingAssignment.findMany.mockResolvedValue([
        { id: "a1", userId: "mgr-1", clusterId: "cluster-5" },
        { id: "a2", userId: "sub-1", clusterId: "cluster-5" },
        { id: "a3", userId: "sub-2", clusterId: "cluster-5" },
      ]);

      const result = await service.assignLineManager({
        managerId: "mgr-1",
        clusterId: "cluster-5",
        duration: "ONE_MONTH",
        dailyLeadTarget: 5,
        includeTeamMembers: true,
      });

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { OR: [{ managerId: "mgr-1" }, { supervisorId: "mgr-1" }] },
        select: { id: true },
      });
      expect(mockPrismaService.marketMappingAssignment.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: "mgr-1", clusterId: "cluster-5", duration: "ONE_MONTH" }),
          expect.objectContaining({ userId: "sub-1", clusterId: "cluster-5", duration: "ONE_MONTH" }),
          expect.objectContaining({ userId: "sub-2", clusterId: "cluster-5", duration: "ONE_MONTH" }),
        ]),
      });
      expect(result.length).toBe(3);
    });

    it("should reassign an existing assignment to a new cluster", async () => {
      mockPrismaService.marketMappingAssignment.findUnique.mockResolvedValue({
        id: "assg-10",
        userId: "user-2",
        clusterId: "cluster-old",
        duration: "FOREVER",
        expiresAt: null,
      });
      mockPrismaService.marketMappingAssignment.update.mockImplementation((args: any) =>
        Promise.resolve({ id: "assg-10", ...args.data }),
      );

      const result = await service.reassignAssignment("assg-10", {
        clusterId: "cluster-new",
        duration: "ONE_DAY",
      });

      expect(result.clusterId).toBe("cluster-new");
      expect(result.duration).toBe("ONE_DAY");
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it("should filter out expired assignments by default in getAssignments", async () => {
      mockPrismaService.marketMappingAssignment.findMany.mockResolvedValue([]);

      await service.getAssignments({ includeExpired: false });

      expect(mockPrismaService.marketMappingAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
          }),
        }),
      );
    });
  });

  describe("createPlan and updatePlan target locking", () => {
    it("should enforce admin cluster targets on createPlan when user is in an active cluster", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ dailyLeadTarget: 5 });
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue({ dailyTarget: 5 });
      mockPrismaService.marketMappingAssignment.findFirst.mockResolvedValue({
        id: "asgn-1",
        clusterId: "cl-wuse",
        dailyLeadTarget: 25,
        weeklyLeadTarget: 125,
        monthlyConversionTarget: 50,
        allowUserEdit: false,
        duration: "ONE_WEEK",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        cluster: { id: "cl-wuse", name: "Wuse Market" },
      });
      mockPrismaService.marketMappingPlan.create.mockImplementation((args: any) =>
        Promise.resolve({ id: "plan-new", ...args.data }),
      );

      const result = await service.createPlan("user-1", {
        targetVisits: 100, // User attempts to override
        targetLeads: 100,
        targetConversions: 20,
        locationCluster: "Custom Mall",
      });

      expect(result.targetVisits).toBe(25);
      expect(result.targetLeads).toBe(25);
      expect(result.locationCluster).toBe("Wuse Market");
    });

    it("should allow user custom targets on createPlan when active cluster has allowUserEdit: true and target is >= cluster target", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ dailyLeadTarget: 5 });
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue({ dailyTarget: 5 });
      mockPrismaService.marketMappingAssignment.findFirst.mockResolvedValue({
        id: "asgn-1",
        clusterId: "cl-wuse",
        dailyLeadTarget: 25,
        weeklyLeadTarget: 125,
        monthlyConversionTarget: 50,
        allowUserEdit: true,
        duration: "ONE_WEEK",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        cluster: { id: "cl-wuse", name: "Wuse Market" },
      });
      mockPrismaService.marketMappingPlan.create.mockImplementation((args: any) =>
        Promise.resolve({ id: "plan-new", ...args.data }),
      );

      const result = await service.createPlan("user-1", {
        targetVisits: 40,
        targetLeads: 40,
        targetConversions: 10,
        locationCluster: "Custom Cluster",
      });

      expect(result.targetVisits).toBe(40);
      expect(result.targetLeads).toBe(40);
      expect(result.locationCluster).toBe("Wuse Market");
    });

    it("should throw BadRequestException on createPlan when user sets target below cluster target even if allowUserEdit is true", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ dailyLeadTarget: 5 });
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue({ dailyTarget: 5 });
      mockPrismaService.marketMappingAssignment.findFirst.mockResolvedValue({
        id: "asgn-1",
        clusterId: "cl-wuse",
        dailyLeadTarget: 25,
        weeklyLeadTarget: 125,
        monthlyConversionTarget: 50,
        allowUserEdit: true,
        duration: "ONE_WEEK",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        cluster: { id: "cl-wuse", name: "Wuse Market" },
      });

      await expect(
        service.createPlan("user-1", {
          targetVisits: 10, // Below cluster target 25
          targetLeads: 10,
          targetConversions: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException on createPlan when user not in cluster sets target below global daily target", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ dailyLeadTarget: 0 });
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue({ dailyTarget: 10 });
      mockPrismaService.marketMappingAssignment.findFirst.mockResolvedValue(null);

      await expect(
        service.createPlan("user-1", {
          targetVisits: 3, // Below global target 10
          targetLeads: 3,
          targetConversions: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException on updatePlan when user sets target below minDailyTarget", async () => {
      mockPrismaService.marketMappingPlan.findFirst.mockResolvedValue({
        id: "plan-1",
        userId: "user-1",
      });
      mockPrismaService.user.findUnique.mockResolvedValue({ dailyLeadTarget: 0 });
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue({ dailyTarget: 10 });
      mockPrismaService.marketMappingAssignment.findFirst.mockResolvedValue(null);

      await expect(
        service.updatePlan("plan-1", "user-1", {
          targetVisits: 4, // Below global target 10
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("should parse string startDate and endDate into Date objects when updating a mission plan and enforce cluster target", async () => {
      mockPrismaService.marketMappingPlan.findFirst.mockResolvedValue({
        id: "plan-1",
        userId: "user-1",
      });
      mockPrismaService.user.findUnique.mockResolvedValue({ dailyLeadTarget: 5 });
      mockPrismaService.marketMappingAssignment.findFirst.mockResolvedValue({
        id: "asgn-1",
        clusterId: "cl-wuse",
        dailyLeadTarget: 25,
        weeklyLeadTarget: 125,
        monthlyConversionTarget: 50,
        allowUserEdit: false,
        duration: "ONE_WEEK",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        cluster: { id: "cl-wuse", name: "Wuse Market" },
      });
      mockPrismaService.marketMappingPlan.update.mockImplementation((args: any) =>
        Promise.resolve({ id: "plan-1", ...args.data }),
      );

      const result = await service.updatePlan("plan-1", "user-1", {
        startDate: "2026-08-11T00:00:00",
        endDate: "2026-08-11T23:59:59",
        targetVisits: 99,
      });

      expect(result.startDate).toEqual(new Date("2026-08-11T00:00:00"));
      expect(result.endDate).toEqual(new Date("2026-08-11T23:59:59"));
      expect(result.targetVisits).toBe(25);
      expect(result.locationCluster).toBe("Wuse Market");
    });

    it("should throw BadRequestException if a plan already exists for that day on createPlan", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ dailyLeadTarget: 5 });
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue({ dailyTarget: 5 });
      mockPrismaService.marketMappingAssignment.findFirst.mockResolvedValue(null);
      mockPrismaService.marketMappingPlan.findFirst.mockResolvedValue({
        id: "existing-plan-today",
        userId: "user-1",
        targetVisits: 5,
        targetLeads: 5,
        locationCluster: "Old Cluster",
      });

      await expect(
        service.createPlan("user-1", {
          startDate: "2026-08-18T00:00:00",
          targetVisits: 15,
          targetLeads: 15,
          targetConversions: 0,
          locationCluster: "New Cluster",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
