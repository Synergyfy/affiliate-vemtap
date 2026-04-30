import { Controller, Post, Body, Res, Req, UseGuards, Get, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Response, Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

const REFRESH_TOKEN_KEY = 'refresh_token';
const ACCESS_TOKEN_KEY = 'access_token';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(ACCESS_TOKEN_KEY, accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie(REFRESH_TOKEN_KEY, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  async signup(@Body() createUserDto: CreateUserDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.signup(createUserDto);
    this.setCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email/phone and password' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const validUser = await this.authService.validateUser(loginDto.email, loginDto.password);
    const { accessToken, refreshToken, user } = await this.authService.login(validUser);
    this.setCookies(res, accessToken, refreshToken);
    return { user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies[REFRESH_TOKEN_KEY];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const decoded = this.authService.jwtService.decode(refreshToken) as any;
    if (!decoded || !decoded.sub) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    const { accessToken: newAccess, refreshToken: newRefresh, user } = await this.authService.refreshTokens(decoded.sub, refreshToken);
    this.setCookies(res, newAccess, newRefresh);
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and clear cookies' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(ACCESS_TOKEN_KEY);
    res.clearCookie(REFRESH_TOKEN_KEY);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('invalidate-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidate all sessions for the user' })
  async invalidateAll(@CurrentUser() user: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.invalidateAllTokens(user.id);
    res.clearCookie(ACCESS_TOKEN_KEY);
    res.clearCookie(REFRESH_TOKEN_KEY);
    return { message: 'All sessions invalidated successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: any) {
    return { user };
  }
}
