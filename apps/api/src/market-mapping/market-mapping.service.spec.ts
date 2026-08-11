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
    marketMappingVisit: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
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

  it("should return config with fallback territory", async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      territoryId: "NG-LAG-IKJ-01",
      dailyLeadTarget: 5,
      monthlyConversionTarget: 20,
    });
    mockPrismaService.marketMappingTerritoryConfig.findUnique.mockResolvedValue({
      territoryCode: "NG-LAG-IKJ-01",
      name: "Ikeja Central Business District",
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
      id: "config-1",
      categories: ["Pharmacy"],
      openingDays: ["Mon"],
      customerRanges: [{ value: "LOW", label: "Low" }],
      businessSizes: [{ value: "SMALL", label: "Small" }],
      contactPositions: ["Owner"],
      pipelineStatuses: [{ id: "NOT_YET", name: "Not yet" }],
      interestOptions: [{ value: "YES", label: "Yes" }],
      planTypes: [{ value: "BASIC", label: "Basic" }],
      faqs: [],
      ticketStatuses: [],
      businessStatuses: [],
      paymentStatuses: [],
      dailyTarget: 5,
      weeklyTarget: 25,
      monthlyTarget: 20,
      fieldDefaults: { autoAssignLead: true, requireGps: true },
    });
    mockPrismaService.marketMappingAssignment.findFirst.mockResolvedValue(null);

    const result = await service.getConfig("user-1");
    expect(result.territory.territoryCode).toBe("NG-LAG-IKJ-01");
    expect(result.userTargets.dailyLeadTarget).toBe(5);
    expect(result.assignment).toBeNull();
    expect(result.assignedCluster).toBe("Tech & Retail Cluster 1");
  });

  it("should expose the admin cluster assignment in config", async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      territoryId: "NG-LAG-IKJ-01",
      dailyLeadTarget: 5,
      monthlyConversionTarget: 20,
    });
    mockPrismaService.marketMappingTerritoryConfig.findUnique.mockResolvedValue({
      territoryCode: "NG-LAG-IKJ-01",
      cluster: "Tech & Retail Cluster 1",
      country: "Nigeria",
      state: "Lagos",
      city: "Ikeja",
      area: "Allen / Opebi",
      totalAssigned: 120,
      anchorCount: 15,
      prospectCount: 85,
      maturityJson: {},
    });
    mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue({
      id: "config-1",
      categories: [],
      openingDays: [],
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
    });
    mockPrismaService.marketMappingAssignment.findFirst.mockResolvedValue({
      userId: "user-1",
      clusterId: "cluster-9",
      allowUserEdit: false,
      cluster: { id: "cluster-9", name: "Ikeja Cluster A" },
    });

    const result = await service.getConfig("user-1");
    expect(result.assignment).toEqual({ clusterId: "cluster-9", clusterName: "Ikeja Cluster A", allowUserEdit: false });
    expect(result.assignedCluster).toBe("Ikeja Cluster A");
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

    const capturedVisits = [
      {
        id: "visit-1",
        name: "Captured Shop",
        category: "Pharmacy",
        status: "INTERESTED",
        isAnchor: false,
        isPlaceholder: false,
        address: null,
        exactAddress: "Shop 3",
        phone: "08022222222",
        ownerName: "Jane",
        contactEmail: "jane@example.com",
        gpsLat: "9.0765",
        gpsLng: "7.4898",
        dailyCustomers: "HIGH",
        businessSize: "SMALL",
        openingHours: "09:00-18:00",
        visitNotes: "Follow up next week",
        visitedAt: new Date("2026-08-01T10:00:00Z"),
        nextVisitDate: null,
        nextVisitTime: null,
        userId: "user-1",
        user: { id: "user-1", fullName: "Affiliate One" },
      },
      {
        id: "visit-dup",
        name: "Converted Shop",
        status: "VISITED",
        phone: "08011111111",
        gpsLat: "9.0",
        gpsLng: "7.4",
        userId: "user-2",
        user: { id: "user-2", fullName: "Affiliate Two" },
      },
      {
        id: "visit-nogps",
        name: "No GPS Shop",
        status: "VISITED",
        phone: "08033333333",
        gpsLat: null,
        gpsLng: null,
        userId: "user-2",
        user: { id: "user-2", fullName: "Affiliate Two" },
      },
      {
        id: "visit-badcoords",
        name: "Bad Coords Shop",
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
      mockPrismaService.marketMappingVisit.findMany.mockResolvedValue(capturedVisits);
    });

    it("should throw NotFoundException when cluster does not exist", async () => {
      mockPrismaService.marketMappingHierarchy.findUnique.mockResolvedValue(null);

      await expect(service.getClusterDetail("missing")).rejects.toThrow(NotFoundException);
    });

    it("should include captured visits with GPS as mapped businesses with real coordinates", async () => {
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

    it("should dedupe captured visits whose phone matches an existing business", async () => {
      const result = await service.getClusterDetail("cluster-1");

      expect(result.businesses.some((b) => b.id === "visit-dup")).toBe(false);
    });

    it("should exclude captured visits without GPS coordinates", async () => {
      const result = await service.getClusterDetail("cluster-1");

      expect(result.businesses.some((b) => b.id === "visit-nogps")).toBe(false);
    });

    it("should exclude captured visits with non-numeric GPS coordinates", async () => {
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

      expect(mockPrismaService.marketMappingVisit.findMany).not.toHaveBeenCalled();
      expect(result.businesses).toEqual([]);
    });
  });

  describe("getReports", () => {
    const now = new Date();

    beforeEach(() => {
      jest.clearAllMocks();
      mockPrismaService.user.findUnique.mockResolvedValue({ dailyLeadTarget: 20 });
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue({ dailyTarget: 20 });
      mockPrismaService.lead.findMany.mockResolvedValue([]);
      mockPrismaService.business.findMany.mockResolvedValue([]);
      mockPrismaService.marketMappingNote.findMany.mockResolvedValue([]);
      mockPrismaService.marketMappingVisit.findMany.mockResolvedValue([]);
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

    it("should use the user's real daily lead target", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ dailyLeadTarget: 15 });

      const result = await service.getReports("user-1", "daily");

      expect(result.weights.leadTarget).toBe(15);
      expect(result.ledger[0].target).toBe(15);
    });

    it("should derive Business Info + GPS from real visit data", async () => {
      mockPrismaService.marketMappingVisit.findMany.mockResolvedValue([
        {
          id: "visit-1",
          name: "Complete Shop",
          category: "Pharmacy",
          phone: "08011111111",
          ownerName: "Jane",
          exactAddress: "Shop 3",
          businessSize: "SMALL",
          openingHours: "09:00-18:00",
          contactPosition: "Owner",
          gpsLat: "9.0765",
          gpsLng: "7.4898",
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
      mockPrismaService.marketMappingVisit.findMany.mockResolvedValue([
        {
          id: "visit-1",
          name: "Bare Shop",
          gpsLat: null,
          gpsLng: null,
          visitedAt: now,
          updatedAt: now,
        },
      ]);

      const result = await service.getReports("user-1", "daily");

      const today = result.ledger[0];
      expect(today.infoPct).toBe(0);
      expect(today.gpsPct).toBe(0);
    });

    it("should score 0 when no target is configured", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ dailyLeadTarget: 0 });
      mockPrismaService.marketMappingAdminConfig.findFirst.mockResolvedValue(null);

      const result = await service.getReports("user-1", "daily");

      expect(result.weights.leadTarget).toBe(0);
      expect(result.ledger[0].score).toBe(0);
    });
  });

  describe("getAdminCapturedVisits", () => {
    it("should return all captured visits with GPS mapped to businesses", async () => {
      const visits = [
        {
          id: "visit-1",
          name: "Captured Shop",
          category: "Pharmacy",
          status: "INTERESTED",
          isAnchor: false,
          isPlaceholder: false,
          address: null,
          exactAddress: "Shop 3",
          phone: "08022222222",
          ownerName: "Jane",
          gpsLat: "8.482322",
          gpsLng: "4.595859",
          dailyCustomers: "HIGH",
          businessSize: "SMALL",
          visitNotes: "Follow up next week",
          visitedAt: new Date("2026-08-01T10:00:00Z"),
          userId: "user-1",
          user: { id: "user-1", fullName: "Affiliate One" },
        },
        {
          id: "visit-nogps",
          name: "No GPS Shop",
          status: "VISITED",
          phone: "08033333333",
          gpsLat: null,
          gpsLng: null,
          userId: "user-2",
          user: { id: "user-2", fullName: "Affiliate Two" },
        },
      ];
      mockPrismaService.marketMappingVisit.findMany.mockResolvedValue(visits);

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

    it("should return empty array when no captured visits have GPS", async () => {
      mockPrismaService.marketMappingVisit.findMany.mockResolvedValue([
        { id: "visit-x", name: "X", gpsLat: null, gpsLng: null },
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
        service.createVisit("user-1", { name: "Shop", nextVisitDate: "2020-01-01" } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should reject a past nextVisitTime on today's date on create", async () => {
      await expect(
        service.createVisit("user-1", { name: "Shop", nextVisitDate: todayStr, nextVisitTime: "00:00" } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should accept a future nextVisitDate on create", async () => {
      const created = { id: "visit-1", name: "Shop", nextVisitDate: "2999-01-01" };
      mockPrismaService.marketMappingVisit.create.mockResolvedValue(created);

      const result = await service.createVisit("user-1", { name: "Shop", nextVisitDate: "2999-01-01" } as any);

      expect(result).toEqual(created);
    });

    it("should reject a changed past nextVisitDate on update", async () => {
      mockPrismaService.marketMappingVisit.findFirst.mockResolvedValue({
        id: "visit-1",
        userId: "user-1",
        nextVisitDate: "2999-01-01",
        nextVisitTime: null,
      });

      await expect(
        service.updateVisit("visit-1", "user-1", { nextVisitDate: "2020-01-01" } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("should allow an unchanged legacy past nextVisitDate on update", async () => {
      mockPrismaService.marketMappingVisit.findFirst.mockResolvedValue({
        id: "visit-1",
        userId: "user-1",
        nextVisitDate: "2020-01-01",
        nextVisitTime: null,
      });
      const updated = { id: "visit-1", nextVisitDate: "2020-01-01" };
      mockPrismaService.marketMappingVisit.update.mockResolvedValue(updated);

      const result = await service.updateVisit("visit-1", "user-1", { nextVisitDate: "2020-01-01" } as any);

      expect(result).toEqual(updated);
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
});
