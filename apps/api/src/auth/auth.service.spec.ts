import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import { UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

jest.mock("bcryptjs");

describe("AuthService", () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
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
    it("should return access and refresh tokens", async () => {
      const mockUser = { id: "1", email: "test@example.com", tokenVersion: 0 };
      mockJwtService.signAsync
        .mockResolvedValueOnce("access-token")
        .mockResolvedValueOnce("refresh-token");

      const result = await service.login(mockUser as any);
      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
      expect(result.user.id).toBe("1");
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
