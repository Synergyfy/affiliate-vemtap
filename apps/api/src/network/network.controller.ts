import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { NetworkService } from './network.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginatedNetworkRecruitResponseDto, NetworkStatsResponseDto, ClaimBonusDto, UpdateTargetsDto } from './dto/network-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('network')
@ApiBearerAuth()
@Controller('network')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @Get('recruits')
  @Roles(Role.AFFILIATE, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'List direct recruits and their stats' })
  @ApiOkResponse({ type: PaginatedNetworkRecruitResponseDto })
  async getRecruits(@CurrentUser() user: { id: string }, @Query() paginationDto: PaginationDto) {
    const { data, total } = await this.networkService.getRecruits(user.id, {
      skip: paginationDto.skip,
      take: paginationDto.take,
    });

    return {
      data,
      meta: {
        total,
        page: paginationDto.page,
        limit: paginationDto.limit,
        totalPages: Math.ceil(total / (paginationDto.limit || 10)),
      },
    };
  }

  @Get('stats')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Get network summary stats and milestone progress' })
  @ApiOkResponse({ type: NetworkStatsResponseDto })
  getStats(@CurrentUser() user: { id: string }) {
    return this.networkService.getStats(user.id);
  }

  @Get('team-member/:id')
  @Roles(Role.AFFILIATE, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Get full team member details and history' })
  getTeamMemberDetail(@Param('id') memberId: string, @CurrentUser() user: { id: string }) {
    return this.networkService.getTeamMemberDetail(user.id, memberId);
  }

  @Post('update-targets')
  @Roles(Role.AFFILIATE, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Update team member target goals' })
  updateTargets(@CurrentUser() user: { id: string }, @Body() dto: UpdateTargetsDto) {
    return this.networkService.updateTargets(user.id, dto);
  }

  @Get('earnings-history')
  @Roles(Role.AFFILIATE, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Get team earnings history over time' })
  getEarningsHistory(@CurrentUser() user: { id: string }) {
    return this.networkService.getEarningsHistory(user.id);
  }

  @Get('team-reports')
  @Roles(Role.AFFILIATE, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Get aggregated team performance reports' })
  getTeamReports(@CurrentUser() user: { id: string }, @Query('period') period?: string) {
    return this.networkService.getTeamReports(user.id, period);
  }

  @Post('claim-bonus')
  @Roles(Role.AFFILIATE, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Claim a milestone bonus' })
  @ApiCreatedResponse({ description: 'Bonus claimed successfully' })
  claimBonus(@CurrentUser() user: { id: string }, @Body() claimBonusDto: ClaimBonusDto) {
    return this.networkService.claimBonus(user.id, claimBonusDto.type);
  }

  @Post('toggle-manager-mode')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Toggle Extended Earnings (Manager Mode)' })
  @ApiCreatedResponse({ description: 'Manager mode toggled successfully' })
  toggleManagerMode(@CurrentUser() user: { id: string }) {
    return this.networkService.toggleManagerMode(user.id);
  }
}
