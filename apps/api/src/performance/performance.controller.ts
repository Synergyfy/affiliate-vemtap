import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role, PerformancePeriodType } from '@prisma/client';
import { PerformanceService } from './performance.service';
import {
  PerformanceQueryDto,
  UpdatePerformanceConfigDto,
} from './dto/performance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('performance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('score')
  @Roles(Role.SALES_EXECUTIVE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: 'Compute live performance score for a period' })
  getScore(
    @CurrentUser() user: { id: string },
    @Query() query: PerformanceQueryDto,
  ) {
    return this.performanceService.computeScore(user.id, query.period);
  }

  @Get('recovery')
  @Roles(Role.SALES_EXECUTIVE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: 'Get "what do I need to do" recovery guidance' })
  getRecovery(
    @CurrentUser() user: { id: string },
    @Query() query: PerformanceQueryDto,
  ) {
    return this.performanceService.getRecoveryPlan(user.id, query.period);
  }

  @Get('summary')
  @Roles(Role.SALES_EXECUTIVE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: "Get today's performance summary and progress" })
  getTodaySummary(@CurrentUser() user: { id: string }) {
    return this.performanceService.getTodaySummary(user.id);
  }

  @Get('transitions')
  @Roles(Role.SALES_EXECUTIVE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: 'Analyze visit transitions (distance/time between visits)' })
  getTransitions(
    @CurrentUser() user: { id: string },
    @Query('date') date?: string,
  ) {
    return this.performanceService.getVisitTransitions(user.id, date);
  }

  @Get('lead-quality')
  @Roles(Role.SALES_EXECUTIVE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: 'Lead quality breakdown for a period' })
  getLeadQuality(
    @CurrentUser() user: { id: string },
    @Query() query: PerformanceQueryDto,
  ) {
    return this.performanceService.getLeadQualityStats(user.id, query.period);
  }

  @Get('history')
  @Roles(Role.SALES_EXECUTIVE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: 'Persisted performance score history' })
  getHistory(
    @CurrentUser() user: { id: string },
    @Query('periodType') periodType?: PerformancePeriodType,
  ) {
    return this.performanceService.getScoreHistory(
      user.id,
      periodType ?? PerformancePeriodType.DAILY,
    );
  }

  @Get('config')
  @Roles(Role.SALES_EXECUTIVE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get the active performance configuration' })
  async getConfig() {
    const config = await this.performanceService['getConfig']();
    if (!config) return null;
    const { id: _id, updatedAt: _updatedAt, ...rest } = config;
    return rest;
  }

  // ---- Admin ----

  @Get('admin/team')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: team performance overview' })
  getTeamOverview() {
    return this.performanceService.getTeamOverview();
  }

  @Get('admin/user/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: individual performance drill-down' })
  getIndividual(@Param('id') id: string) {
    return this.performanceService.getIndividualPerformance(id);
  }

  @Patch('admin/config')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: update performance configuration' })
  async updateConfig(@Body() dto: UpdatePerformanceConfigDto) {
    const current = await this.performanceService['getConfig']();
    if (!current) return null;
    return this.performanceService['updateConfig'](dto);
  }
}
