import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";
import { ConflictException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashedPassword"),
  compare: jest.fn().mockResolvedValue(true),
}));

describe("UsersService", () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    const createUserDto = {
      fullName: "Test User",
      email: "test@example.com",
      phone: "1234567890",
      password: "password123",
    };

    it("should throw ConflictException if user already exists", async () => {
      mockPrismaService.user.findFirst.mockResolvedValueOnce({ id: "1" });

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should create a new user and omit password in the result", async () => {
      mockPrismaService.user.findFirst.mockResolvedValueOnce(null);
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null); // for unique referral code gen

      const createdUser = {
        id: "1",
        ...createUserDto,
        password: "hashedPassword",
        referralCode: "VEM-TEST",
      };
      mockPrismaService.user.create.mockResolvedValueOnce(createdUser);

      const result = await service.create(createUserDto);

      expect(result).not.toHaveProperty("password");
      expect(result.fullName).toBe(createUserDto.fullName);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("should return null if user not found", async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);
      const result = await service.findById("1");
      expect(result).toBeNull();
    });

    it("should return user omitting password", async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: "1",
        password: "secretPassword",
        email: "test@example.com",
      });

      const result = await service.findById("1");
      expect(result).not.toBeNull();
      expect(result).not.toHaveProperty("password");
      expect(result?.email).toBe("test@example.com");
    });
  });
});
