import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { FraudService } from "../fraud/fraud.service";
import { AuditService } from "../prisma/audit.service";

jest.mock("bcryptjs");

describe("AuthService", () => {
  let service: AuthService;
  let _usersService: UsersService;
  let _jwtService: JwtService;
  let prisma: PrismaService;
  let fraudService: FraudService;
  let auditService: AuditService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByPhone: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    incrementTokenVersion: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockPrisma = {
    user: {
      update: jest.fn(),
      count: jest.fn(),
    },
    platformSettings: {
      findFirst: jest.fn(),
    },
  };

  const mockFraudService = {
    createAlert: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: FraudService, useValue: mockFraudService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    _usersService = module.get<UsersService>(UsersService);
    _jwtService = module.get<JwtService>(JwtService);
    prisma = module.get<PrismaService>(PrismaService);
    fraudService = module.get<FraudService>(FraudService);
    auditService = module.get<AuditService>(AuditService);
    (service as any).auditService = mockAuditService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("validateUser", () => {
    it("should return user if credentials are valid", async () => {
      const mockUser = {
        id: "1",
        email: "test@example.com",
        password: "hashedPassword",
      };
      mockUsersService.findByEmail.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.validateUser(
        "test@example.com",
        "password123",
      );
      expect(result).toEqual(mockUser);
    });

    it("should throw UnauthorizedException if credentials are invalid", async () => {
      mockUsersService.findByEmail.mockResolvedValueOnce(null);
      mockUsersService.findByPhone.mockResolvedValueOnce(null);

      await expect(
        service.validateUser("test@example.com", "wrongPass"),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("login", () => {
    it("should return access and refresh tokens and check IP limit", async () => {
      const mockUser = { id: "1", email: "test@example.com", tokenVersion: 0 };
      const ip = "127.0.0.1";
      
      mockJwtService.signAsync
        .mockResolvedValueOnce("access-token")
        .mockResolvedValueOnce("refresh-token");
      
      mockPrisma.platformSettings.findFirst.mockResolvedValue({ maxIpUsage: 2 });
      mockPrisma.user.count.mockResolvedValue(2); // 2 other users on same IP
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.login(mockUser as any, ip);
      
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "1" },
        data: expect.objectContaining({ lastLoginIp: ip })
      }));
      expect(fraudService.createAlert).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({
        userId: "1",
        action: 'LOGIN',
      }));
      expect(result.accessToken).toBe("access-token");
    });
  });

  describe("refreshTokens", () => {
    it("should issue new tokens if refresh token is valid", async () => {
      const mockUser = { id: "1", email: "test@example.com", tokenVersion: 1 };
      mockJwtService.verifyAsync.mockResolvedValueOnce({
        sub: "1",
        tokenVersion: 1,
      });
      mockUsersService.findById.mockResolvedValueOnce(mockUser);
      mockJwtService.signAsync.mockResolvedValue("new-token");

      const result = await service.refreshTokens("1", "valid-refresh");
      expect(result.accessToken).toBe("new-token");
    });

    it("should throw UnauthorizedException if tokenVersion mismatch", async () => {
      const mockUser = { id: "1", tokenVersion: 2 }; // DB version is 2
      mockJwtService.verifyAsync.mockResolvedValueOnce({
        sub: "1",
        tokenVersion: 1,
      }); // Token version is 1
      mockUsersService.findById.mockResolvedValueOnce(mockUser);

      await expect(service.refreshTokens("1", "old-refresh")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
