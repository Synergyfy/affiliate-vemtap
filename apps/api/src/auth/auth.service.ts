import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { LoginDto } from "./dto/login.dto";
import { User } from "@prisma/client";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    public jwtService: JwtService,
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

  async signup(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    // Auto-login after signup
    return this.login(user as User); // Casting to User because password is omitted, but login only needs id/email/tokenVersion
  }

  async login(user: Partial<User>) {
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
