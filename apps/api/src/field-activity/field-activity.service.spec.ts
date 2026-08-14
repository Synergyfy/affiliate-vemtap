import { Test, TestingModule } from "@nestjs/testing";
import {
  mapVisitOutcomeToLeadStatus,
  shouldApplyFieldLeadStatus,
  FieldActivityService,
} from "./field-activity.service";
import { PrismaService } from "../prisma/prisma.service";

describe("mapVisitOutcomeToLeadStatus", () => {
  it("maps engaged outcomes to the matching Lead pipeline status", () => {
    expect(mapVisitOutcomeToLeadStatus("CUSTOMER")).toBe("CUSTOMER");
    expect(mapVisitOutcomeToLeadStatus("INTERESTED")).toBe("INTERESTED");
    expect(mapVisitOutcomeToLeadStatus("NOT_INTERESTED")).toBe("NOT_INTERESTED");
    expect(mapVisitOutcomeToLeadStatus("VISITED")).toBe("VISITED");
  });

  it("collapses field-only outcomes to VISITED so the lead status stays valid", () => {
    expect(mapVisitOutcomeToLeadStatus("MANAGER_UNAVAILABLE")).toBe("VISITED");
    expect(mapVisitOutcomeToLeadStatus("FOLLOW_UP_REQUIRED")).toBe("VISITED");
    expect(mapVisitOutcomeToLeadStatus("OTHER")).toBe("VISITED");
  });

  it("defaults missing outcomes to VISITED", () => {
    expect(mapVisitOutcomeToLeadStatus(undefined)).toBe("VISITED");
    expect(mapVisitOutcomeToLeadStatus(null)).toBe("VISITED");
    expect(mapVisitOutcomeToLeadStatus("")).toBe("VISITED");
  });
});

describe("shouldApplyFieldLeadStatus", () => {
  it("applies explicit terminal outcomes regardless of current status", () => {
    expect(shouldApplyFieldLeadStatus("INTERESTED", "CUSTOMER")).toBe(true);
    expect(shouldApplyFieldLeadStatus("CUSTOMER", "NOT_INTERESTED")).toBe(true);
  });

  it("applies an upgrade along the funnel", () => {
    expect(shouldApplyFieldLeadStatus("NOT_YET", "VISITED")).toBe(true);
    expect(shouldApplyFieldLeadStatus("CONTACTED", "INTERESTED")).toBe(true);
  });

  it("never downgrades a further-along lead to VISITED", () => {
    expect(shouldApplyFieldLeadStatus("CONTACTED", "VISITED")).toBe(false);
    expect(shouldApplyFieldLeadStatus("INTERESTED", "VISITED")).toBe(false);
    expect(shouldApplyFieldLeadStatus("CUSTOMER", "VISITED")).toBe(false);
  });

  it("treats an equal status as a no-op", () => {
    expect(shouldApplyFieldLeadStatus("INTERESTED", "INTERESTED")).toBe(false);
  });
});

describe("FieldActivityService.completeVisit", () => {
  let service: FieldActivityService;

  const mockPrisma = {
    fieldMissionBusiness: { update: jest.fn() },
    lead: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
    fieldActivityTimelineEvent: { findFirst: jest.fn(), create: jest.fn() },
    visitTransition: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldActivityService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FieldActivityService>(FieldActivityService);
  });

  it("does not downgrade a CONTACTED lead to VISITED on a generic field outcome", async () => {
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
    jest.spyOn(service, "getActiveMission").mockResolvedValue({
      id: "mission-1",
      businesses: [{ id: "biz-1", leadId: "lead-1", status: "NOT_YET" }],
    } as any);
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      userId: "user-1",
      status: "CONTACTED",
      visitedAt: new Date(),
      comments: null,
      gpsLat: null,
      gpsLng: null,
      phone: "080",
      contactName: null,
      email: null,
    });
    mockPrisma.fieldActivityTimelineEvent.findFirst.mockResolvedValue(null);
    mockPrisma.fieldMissionBusiness.update.mockResolvedValue({});

    await service.completeVisit("user-1", {
      visitId: "biz-1",
      visitOutcome: "FOLLOW_UP_REQUIRED",
    } as any);

    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: "lead-1" },
      data: expect.objectContaining({ status: "CONTACTED" }),
    });
  });

  it("upgrades an INTERESTED lead to CUSTOMER on a CUSTOMER outcome", async () => {
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
    jest.spyOn(service, "getActiveMission").mockResolvedValue({
      id: "mission-1",
      businesses: [{ id: "biz-1", leadId: "lead-1", status: "NOT_YET" }],
    } as any);
    mockPrisma.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      userId: "user-1",
      status: "INTERESTED",
      visitedAt: new Date(),
      comments: null,
      gpsLat: null,
      gpsLng: null,
      phone: "080",
      contactName: null,
      email: null,
    });
    mockPrisma.fieldActivityTimelineEvent.findFirst.mockResolvedValue(null);
    mockPrisma.fieldMissionBusiness.update.mockResolvedValue({});

    await service.completeVisit("user-1", {
      visitId: "biz-1",
      visitOutcome: "CUSTOMER",
    } as any);

    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: "lead-1" },
      data: expect.objectContaining({ status: "CUSTOMER" }),
    });
  });

  it("backfills FieldMissionBusiness.leadId when a new lead is captured during field work", async () => {
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
    jest.spyOn(service, "getActiveMission").mockResolvedValue({
      id: "mission-1",
      businesses: [{ id: "biz-1", leadId: null, status: "NOT_YET" }],
    } as any);
    mockPrisma.lead.findFirst.mockResolvedValue(null);
    mockPrisma.lead.create.mockResolvedValue({ id: "lead-new" });
    mockPrisma.fieldActivityTimelineEvent.findFirst.mockResolvedValue(null);
    mockPrisma.fieldMissionBusiness.update.mockResolvedValue({});

    await service.completeVisit("user-1", {
      visitId: "biz-1",
      leadData: { businessName: "New Shop", phone: "0801234567" },
    } as any);

    expect(mockPrisma.lead.create).toHaveBeenCalled();
    expect(mockPrisma.fieldMissionBusiness.update).toHaveBeenCalledWith({
      where: { id: "biz-1" },
      data: { leadId: "lead-new" },
    });
  });

  it("links an existing lead instead of creating a duplicate during field capture", async () => {
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
    jest.spyOn(service, "getActiveMission").mockResolvedValue({
      id: "mission-1",
      businesses: [{ id: "biz-1", leadId: null, status: "NOT_YET" }],
    } as any);
    mockPrisma.lead.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: "lead-existing", userId: "user-1", status: "NOT_YET", visitedAt: null });
    mockPrisma.lead.create.mockResolvedValue({ id: "lead-new" });
    mockPrisma.fieldActivityTimelineEvent.findFirst.mockResolvedValue(null);
    mockPrisma.fieldMissionBusiness.update.mockResolvedValue({});

    await service.completeVisit("user-1", {
      visitId: "biz-1",
      leadData: { businessName: "New Shop", phone: "0801234567" },
    } as any);

    expect(mockPrisma.lead.create).not.toHaveBeenCalled();
    expect(mockPrisma.fieldMissionBusiness.update).toHaveBeenCalledWith({
      where: { id: "biz-1" },
      data: { leadId: "lead-existing" },
    });
  });
});
