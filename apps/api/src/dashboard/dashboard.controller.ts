import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AdminStatsResponseDto, DashboardChartsResponseDto } from './dto/dashboard-response.dto';

@ApiTags('admin-dashboard')
@ApiBearerAuth()
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get overall admin statistics' })
  @ApiOkResponse({ type: AdminStatsResponseDto })
  getStats() {
    return this.dashboardService.getAdminStats();
  }

  @Get('manager-performance')
  @ApiOperation({ summary: 'Get manager performance metrics' })
  @ApiOkResponse({ type: Object })
  getManagerPerformance(@CurrentUser() user: { id: string }) {
    return this.dashboardService.getManagerPerformance(user.id);
  }

  @Get('charts')
  @ApiOperation({ summary: 'Get data for dashboard charts' })
  @ApiOkResponse({ type: DashboardChartsResponseDto })
  getCharts() {
    return this.dashboardService.getDashboardCharts();
  }
}
