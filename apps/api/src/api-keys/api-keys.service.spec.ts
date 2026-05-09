import { Test, TestingModule } from "@nestjs/testing";
import { ApiKeysService } from "./api-keys.service";
import { PrismaService } from "../prisma/prisma.service";
import { UnauthorizedException, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

describe("ApiKeysService", () => {
  let service: ApiKeysService;

  const mockPrisma = {
    apiKey: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("generate", () => {
    it("should generate a new API key and return raw key", async () => {
      const dto = { name: "Test Key" };
      const adminId = "admin-123";

      (mockPrisma.apiKey.create as jest.Mock).mockImplementation(
        ({ data }) => ({
          id: "key-id",
          name: data.name,
          prefix: data.prefix,
          createdAt: new Date(),
        }),
      );

      const result = await service.generate(adminId, dto);

      expect(result.rawKey).toMatch(/^vem_[a-f0-9]{8}/);
      expect(result.prefix).toBe(result.rawKey.substring(0, 12));
      expect(mockPrisma.apiKey.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          keyHash: expect.any(String),
          prefix: result.prefix,
          createdById: adminId,
        },
      });
    });
  });

  describe("validateKey", () => {
    it("should pass for a valid key", async () => {
      const rawKey = "vem_12345678abcdef1234567890abcdef1234567890abcdef";
      const keyHash = await bcrypt.hash(rawKey, 10);
      const mockKey = { id: "key-id", keyHash };

      (mockPrisma.apiKey.findMany as jest.Mock).mockResolvedValue([mockKey]);
      (mockPrisma.apiKey.update as jest.Mock).mockResolvedValue({});

      await expect(service.validateKey(rawKey)).resolves.not.toThrow();
      expect(mockPrisma.apiKey.findMany).toHaveBeenCalled();
    });

    it("should throw UnauthorizedException for invalid format", async () => {
      await expect(service.validateKey("invalid-key")).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if no key matches prefix", async () => {
      const rawKey = "vem_12345678abcdef";
      (mockPrisma.apiKey.findMany as jest.Mock).mockResolvedValue([]);

      await expect(service.validateKey(rawKey)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if hash does not match", async () => {
      const rawKey = "vem_12345678abcdef";
      const mockKey = { id: "key-id", keyHash: "wrong-hash" };

      (mockPrisma.apiKey.findMany as jest.Mock).mockResolvedValue([mockKey]);

      await expect(service.validateKey(rawKey)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("revoke", () => {
    it("should mark key as inactive", async () => {
      const keyId = "key-id";
      const adminId = "admin-123";
      const mockKey = { id: keyId, name: "Test", isActive: true };

      (mockPrisma.apiKey.findUnique as jest.Mock).mockResolvedValue(mockKey);
      (mockPrisma.apiKey.update as jest.Mock).mockResolvedValue({});

      await service.revoke(keyId, adminId);

      expect(mockPrisma.apiKey.update).toHaveBeenCalledWith({
        where: { id: keyId },
        data: { isActive: false, revokedAt: expect.any(Date) },
      });
    });

    it("should throw NotFoundException if key does not exist", async () => {
      (mockPrisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.revoke("non-existent", "admin")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
