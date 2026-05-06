import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { User, Severity, FraudType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { FraudService } from "../fraud/fraud.service";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    public jwtService: JwtService,
    private prisma: PrismaService,
    private fraudService: FraudService,
  ) {}

  async validateUser(emailOrPhone: string, pass: string): Promise<User> {
    let user = await this.usersService.findByEmail(emailOrPhone);
    if (!user) {
      user = await this.usersService.findByPhone(emailOrPhone);
    }

    if (user && (await bcrypt.compare(pass, user.password))) {
      return user;
    }
    throw new UnauthorizedException("Invalid credentials");
  }

  async signup(createUserDto: CreateUserDto, ip?: string) {
    const user = await this.usersService.create(createUserDto);
    // Auto-login after signup
    return this.login(user as User, ip);
  }

  async login(user: Partial<User>, ip?: string) {
    if (user.id && ip) {
      // 1. Update last login IP
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginIp: ip, lastLoginAt: new Date() },
      });

      // 2. IP Limit Enforcement
      const settings = await this.prisma.platformSettings.findFirst();
      if (settings && settings.maxIpUsage > 0) {
        const usersOnSameIp = await this.prisma.user.count({
          where: {
            lastLoginIp: ip,
            status: "ACTIVE",
            id: { not: user.id },
          },
        });

        if (usersOnSameIp >= settings.maxIpUsage) {
          await this.fraudService.createAlert({
            userId: user.id,
            type: FraudType.MULTIPLE_ACCOUNTS,
            severity: Severity.MEDIUM,
            description: `IP Address ${ip} is shared by ${usersOnSameIp + 1} active accounts. Limit is ${settings.maxIpUsage}.`,
            evidence: { ip, count: usersOnSameIp + 1 },
          });
        }
      }
    }

    const payload = { sub: user.id, email: user.email };
    const refreshPayload = {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion || 0,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || "dev-secret-key",
        expiresIn: "15m",
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
        expiresIn: "7d",
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        referralCode: user.referralCode,
        role: user.role,
      },
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    let decoded;
    try {
      decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
      });
    } catch (e) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Check token rotation validity
    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException("Refresh token is no longer valid");
    }

    return this.login(user as User);
  }

  async invalidateAllTokens(userId: string) {
    await this.usersService.incrementTokenVersion(userId);
    return { message: "All active sessions invalidated" };
  }
}
