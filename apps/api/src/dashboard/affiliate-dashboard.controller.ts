import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { 
  AffiliateStatsResponseDto, 
  AffiliateForecastResponseDto, 
  AffiliateChartsResponseDto,
  LeaderboardResponseDto
} from './dto/affiliate-dashboard.dto';

@ApiTags('affiliate-dashboard')
@ApiBearerAuth()
@Controller('affiliate/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
export class AffiliateDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get current affiliate statistics' })
  @ApiOkResponse({ type: AffiliateStatsResponseDto })
  getStats(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getAffiliateStats(user.id);
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Get affiliate earnings forecast' })
  @ApiOkResponse({ type: AffiliateForecastResponseDto })
  getForecast(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getAffiliateForecast(user.id);
  }

  @Get('charts')
  @ApiOperation({ summary: 'Get data for affiliate dashboard charts' })
  @ApiOkResponse({ type: AffiliateChartsResponseDto })
  getCharts(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getAffiliateCharts(user.id);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get global top affiliates leaderboard' })
  @ApiOkResponse({ type: [LeaderboardResponseDto] })
  getLeaderboard(@Query('limit') limit?: number) {
    return this.dashboardService.getGlobalLeaderboard(limit ? Number(limit) : 10);
  }
}
