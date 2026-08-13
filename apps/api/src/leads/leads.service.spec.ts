import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { LeadsService } from "./leads.service";
import { PrismaService } from "../prisma/prisma.service";

describe("LeadsService", () => {
  let service: LeadsService;

  const mockPrisma = {
    lead: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    const baseDto = {
      businessName: "Shop One",
      industry: "Pharmacy",
      businessAddress: "123 Allen Avenue",
      location: "Ikeja, Lagos",
      contactName: "Jane Doe",
      contactRole: "Owner",
      phone: "08011111111",
      email: "jane@example.com",
      source: "Direct Referral",
    };

    it("creates a lead with NOT_YET status and no visitedAt", async () => {
      mockPrisma.lead.create.mockResolvedValue({
        id: "lead-1",
        ...baseDto,
        userId: "user-1",
        status: "NOT_YET",
        visitedAt: null,
      });

      const result = await service.create("user-1", baseDto as any);

      expect(mockPrisma.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          businessName: "Shop One",
          status: "NOT_YET",
          visitedAt: null,
        }),
      });
      expect(result.visited).toBe(false);
    });

    it("stamps visitedAt when created with an engaged status", async () => {
      mockPrisma.lead.create.mockResolvedValue({
        id: "lead-1",
        ...baseDto,
        userId: "user-1",
        status: "INTERESTED",
        visitedAt: new Date(),
      });

      const result = await service.create("user-1", { ...baseDto, status: "INTERESTED" } as any);

      expect(mockPrisma.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: "INTERESTED",
          visitedAt: expect.any(Date),
        }),
      });
      expect(result.visited).toBe(true);
    });

    it("maps the legacy COMPLETED status to CUSTOMER", async () => {
      mockPrisma.lead.create.mockResolvedValue({
        id: "lead-1",
        ...baseDto,
        userId: "user-1",
        status: "CUSTOMER",
        visitedAt: new Date(),
      });

      const result = await service.create("user-1", { ...baseDto, status: "COMPLETED" } as any);

      expect(mockPrisma.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ status: "CUSTOMER" }),
      });
      expect(result.visited).toBe(true);
    });

    it("maps legacy POTENTIAL to NOT_YET and defaults source to Market Mapping", async () => {
      mockPrisma.lead.create.mockResolvedValue({
        id: "lead-1",
        businessName: "Shop One",
        userId: "user-1",
        status: "NOT_YET",
        visitedAt: null,
      });

      const result = await service.create("user-1", { businessName: "Shop One", status: "POTENTIAL" } as any);

      expect(mockPrisma.lead.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: "NOT_YET",
          visitedAt: null,
          source: "Market Mapping",
        }),
      });
      expect(result.visited).toBe(false);
    });
  });

  describe("update", () => {
    it("stamps visitedAt when a lead transitions from NOT_YET to CONTACTED", async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: "lead-1",
        userId: "user-1",
        businessName: "Shop One",
        status: "NOT_YET",
        visitedAt: null,
      });
      mockPrisma.lead.update.mockResolvedValue({
        id: "lead-1",
        userId: "user-1",
        status: "CONTACTED",
        visitedAt: new Date(),
      });

      const result = await service.update("lead-1", { id: "user-1", role: "AFFILIATE" }, { status: "CONTACTED" } as any);

      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: "lead-1" },
        data: expect.objectContaining({
          status: "CONTACTED",
          visitedAt: expect.any(Date),
        }),
      });
      expect(result.visited).toBe(true);
    });

    it("keeps visitedAt when updating a lead that is already visited", async () => {
      const visitedAt = new Date();
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: "lead-1",
        userId: "user-1",
        status: "INTERESTED",
        visitedAt,
      });
      mockPrisma.lead.update.mockResolvedValue({
        id: "lead-1",
        userId: "user-1",
        status: "CUSTOMER",
        visitedAt,
      });

      const result = await service.update("lead-1", { id: "user-1", role: "AFFILIATE" }, { comments: "updated" } as any);

      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: "lead-1" },
        data: expect.objectContaining({ visitedAt }),
      });
      expect(result.visited).toBe(true);
    });

    it("clears followUpDate when null is explicitly provided", async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: "lead-1",
        userId: "user-1",
        status: "CONTACTED",
        visitedAt: new Date(),
        followUpDate: new Date(),
      });
      mockPrisma.lead.update.mockResolvedValue({
        id: "lead-1",
        userId: "user-1",
        status: "CONTACTED",
        visitedAt: new Date(),
        followUpDate: null,
      });

      await service.update(
        "lead-1",
        { id: "user-1", role: "AFFILIATE" },
        { followUpDate: null } as any,
      );

      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: "lead-1" },
        data: expect.objectContaining({ followUpDate: null }),
      });
    });

    it("reverting to NOT_YET keeps visitedAt so the lead still reports visited", async () => {
      const visitedAt = new Date();
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: "lead-1",
        userId: "user-1",
        status: "INTERESTED",
        visitedAt,
      });
      mockPrisma.lead.update.mockResolvedValue({
        id: "lead-1",
        userId: "user-1",
        status: "NOT_YET",
        visitedAt,
      });

      const result = await service.update(
        "lead-1",
        { id: "user-1", role: "AFFILIATE" },
        { status: "NOT_YET" } as any,
      );

      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: "lead-1" },
        data: expect.objectContaining({ status: "NOT_YET", visitedAt }),
      });
      expect(result.visited).toBe(true);
    });
  });

  describe("findOne", () => {
    it("throws NotFoundException when the lead does not exist", async () => {
      mockPrisma.lead.findUnique.mockResolvedValue(null);

      await expect(service.findOne("missing", { id: "user-1" })).rejects.toThrow(NotFoundException);
    });

    it("throws NotFoundException for soft-deleted leads", async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: "lead-1",
        userId: "user-1",
        deletedAt: new Date(),
      });

      await expect(service.findOne("lead-1", { id: "user-1" })).rejects.toThrow(NotFoundException);
    });

    it("throws ForbiddenException for a lead owned by another user", async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({
        id: "lead-1",
        userId: "user-other",
      });

      await expect(service.findOne("lead-1", { id: "user-1", role: "AFFILIATE" })).rejects.toThrow(ForbiddenException);
    });
  });

  describe("getStats", () => {
    it("returns total, visited, notVisited and byStatus breakdown", async () => {
      mockPrisma.lead.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(6);
      mockPrisma.lead.groupBy.mockResolvedValue([
        { status: "NOT_YET", _count: { status: 6 } },
        { status: "CUSTOMER", _count: { status: 1 } },
      ]);

      const result = await service.getStats({ id: "user-1", role: "AFFILIATE" });

      expect(result).toEqual({
        total: 10,
        visited: 4,
        notVisited: 6,
        byStatus: { NOT_YET: 6, CUSTOMER: 1 },
      });
      expect(mockPrisma.lead.count).toHaveBeenNthCalledWith(1, {
        where: { deletedAt: null, isPlaceholder: false, userId: "user-1" },
      });
    });
  });
});
