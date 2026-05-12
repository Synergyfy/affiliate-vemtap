import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { LoginDto } from "./dto/login.dto";
import { Response, Request } from "express";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { User } from "@prisma/client";

const REFRESH_TOKEN_KEY = "refresh_token";
const ACCESS_TOKEN_KEY = "access_token";

interface TokenPayload {
  sub: string;
  email: string;
  tokenVersion?: number;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === "production";
    const cookieDomain = process.env.COOKIE_DOMAIN;

    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    };

    if (isProduction && cookieDomain) {
      cookieOptions.domain = cookieDomain;
    }

    res.cookie(ACCESS_TOKEN_KEY, accessToken, cookieOptions);

    res.cookie(REFRESH_TOKEN_KEY, refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  @Post("signup")
  @ApiOperation({
    summary: "Register a new user",
    description:
      "Creates a new affiliate account. Authentication tokens are set in cookies automatically.",
  })
  @ApiBody({
    type: CreateUserDto,
    description: "User registration details",
    examples: {
      default: {
        value: {
          fullName: "John Doe",
          email: "john@example.com",
          phone: "08012345678",
          password: "securePassword123",
          referralCode: "VEM-ABC123",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "User registered successfully",
    example: {
      user: {
        id: "uuid",
        fullName: "John Doe",
        email: "john@example.com",
        phone: "08012345678",
        role: "AFFILIATE",
        status: "ACTIVE",
        referralCode: "VEM-XYZ789",
        createdAt: "2026-05-06T10:00:00.000Z",
        totalEarnings: 0,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Invalid input or email already exists",
  })
  async signup(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const ip =
      req.header("x-forwarded-for") || req.ip || req.socket.remoteAddress;
    const { accessToken, refreshToken, user } = await this.authService.signup(
      createUserDto,
      ip,
    );
    this.setCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Login with email/phone and password",
    description:
      "Authenticates the user and sets access/refresh tokens in cookies.",
  })
  @ApiBody({
    type: LoginDto,
    description: "Login credentials",
    examples: {
      default: {
        value: { email: "john@example.com", password: "securePassword123" },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    example: {
      user: {
        id: "uuid",
        fullName: "John Doe",
        email: "john@example.com",
        phone: "08012345678",
        role: "AFFILIATE",
        status: "ACTIVE",
        referralCode: "VEM-XYZ789",
        createdAt: "2026-05-06T10:00:00.000Z",
        totalEarnings: 0,
      },
    },
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const ip =
      req.header("x-forwarded-for") || req.ip || req.socket.remoteAddress;
    const validUser = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    const { accessToken, refreshToken, user } = await this.authService.login(
      validUser,
      ip,
    );
    this.setCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Refresh access token",
    description:
      "Uses the refresh token cookie to issue a new access/refresh token pair.",
  })
  @ApiResponse({
    status: 200,
    description: "Tokens refreshed successfully",
    example: {
      user: {
        id: "uuid",
        fullName: "John Doe",
        email: "john@example.com",
        role: "AFFILIATE",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Invalid or missing refresh token" })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies[REFRESH_TOKEN_KEY];
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token not found");
    }

    const decoded = this.authService.jwtService.decode(
      refreshToken,
    ) as TokenPayload;
    if (!decoded || !decoded.sub) {
      throw new UnauthorizedException("Invalid refresh token payload");
    }

    const {
      accessToken: newAccess,
      refreshToken: newRefresh,
      user,
    } = await this.authService.refreshTokens(decoded.sub, refreshToken);
    this.setCookies(res, newAccess, newRefresh);
    return { user };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Logout and clear cookies",
    description:
      "Clears the access and refresh token cookies from the browser.",
  })
  @ApiResponse({
    status: 200,
    description: "Logged out successfully",
    example: { message: "Logged out successfully" },
  })
  async logout(@Res({ passthrough: true }) res: Response) {
    const isProduction = process.env.NODE_ENV === "production";
    const cookieDomain = process.env.COOKIE_DOMAIN;
    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    };

    if (isProduction && cookieDomain) {
      cookieOptions.domain = cookieDomain;
    }

    res.clearCookie(ACCESS_TOKEN_KEY, cookieOptions);
    res.clearCookie(REFRESH_TOKEN_KEY, cookieOptions);
    return { message: "Logged out successfully" };
  }

  @ApiBearerAuth("JWT")
  @UseGuards(JwtAuthGuard)
  @Post("invalidate-all")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Invalidate all sessions for the user",
    description:
      "Forces logout from all devices by invalidating all active tokens.",
  })
  @ApiResponse({
    status: 200,
    description: "All sessions invalidated",
    example: { message: "All sessions invalidated successfully" },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT required",
  })
  async invalidateAll(
    @CurrentUser() user: Omit<User, "password">,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.invalidateAllTokens(user.id);
    
    const isProduction = process.env.NODE_ENV === "production";
    const cookieDomain = process.env.COOKIE_DOMAIN;
    const cookieOptions: any = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    };

    if (isProduction && cookieDomain) {
      cookieOptions.domain = cookieDomain;
    }

    res.clearCookie(ACCESS_TOKEN_KEY, cookieOptions);
    res.clearCookie(REFRESH_TOKEN_KEY, cookieOptions);
    return { message: "All sessions invalidated successfully" };
  }

  @ApiBearerAuth("JWT")
  @UseGuards(JwtAuthGuard)
  @Get("me")
  @ApiOperation({
    summary: "Get current user profile",
    description: "Returns the profile of the authenticated user.",
  })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved",
    example: {
      user: {
        id: "uuid",
        fullName: "John Doe",
        email: "john@example.com",
        phone: "08012345678",
        role: "AFFILIATE",
        status: "ACTIVE",
        referralCode: "VEM-XYZ789",
        createdAt: "2026-05-06T10:00:00.000Z",
        totalEarnings: 0,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - valid JWT required",
  })
  async getProfile(@CurrentUser() user: Omit<User, "password">) {
    return { user };
  }
}
