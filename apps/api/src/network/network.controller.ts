import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { NetworkService } from './network.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginatedNetworkRecruitResponseDto, NetworkStatsResponseDto, ClaimBonusDto } from './dto/network-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('network')
@ApiBearerAuth()
@Controller('network')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NetworkController {
  constructor(private readonly networkService: NetworkService) {}

  @Get('recruits')
  @Roles(Role.AFFILIATE, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
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
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get network summary stats and milestone progress' })
  @ApiOkResponse({ type: NetworkStatsResponseDto })
  getStats(@CurrentUser() user: { id: string }) {
    return this.networkService.getStats(user.id);
  }

  @Post('claim-bonus')
  @Roles(Role.AFFILIATE, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Claim a milestone bonus' })
  @ApiCreatedResponse({ description: 'Bonus claimed successfully' })
  claimBonus(@CurrentUser() user: { id: string }, @Body() claimBonusDto: ClaimBonusDto) {
    return this.networkService.claimBonus(user.id, claimBonusDto.type);
  }

  @Post('toggle-manager-mode')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle Extended Earnings (Manager Mode)' })
  @ApiCreatedResponse({ description: 'Manager mode toggled successfully' })
  toggleManagerMode(@CurrentUser() user: { id: string }) {
    return this.networkService.toggleManagerMode(user.id);
  }
}
