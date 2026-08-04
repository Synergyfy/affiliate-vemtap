import { Test, TestingModule } from "@nestjs/testing";
import { MarketMappingService } from "./market-mapping.service";
import { PrismaService } from "../prisma/prisma.service";

describe("MarketMappingService", () => {
  let service: MarketMappingService;
  let _prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
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

    const result = await service.getConfig("user-1");
    expect(result.territory.territoryCode).toBe("NG-LAG-IKJ-01");
    expect(result.userTargets.dailyLeadTarget).toBe(5);
  });
});
