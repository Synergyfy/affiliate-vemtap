import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { FraudService } from './fraud.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateFraudStatusDto } from './dto/update-fraud.dto';
import { FraudAlertResponseDto, PaginatedFraudAlertResponseDto } from './dto/fraud-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FraudFilterDto } from './dto/fraud-filter.dto';

@ApiTags('fraud')
@ApiBearerAuth()
@Controller('fraud')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Get()
  @ApiOperation({ summary: 'List all fraud alerts' })
  @ApiOkResponse({ type: PaginatedFraudAlertResponseDto })
  async findAll(@Query() filterDto: FraudFilterDto) {
    const { data, total } = await this.fraudService.findAll({
      skip: filterDto.skip,
      take: filterDto.take,
      status: filterDto.status,
      severity: filterDto.severity,
      userId: filterDto.userId,
      search: filterDto.search,
    });

    return {
      data,
      meta: {
        total,
        page: filterDto.page,
        limit: filterDto.limit,
        totalPages: Math.ceil(total / (filterDto.limit || 10)),
      },
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get global fraud stats' })
  getStats() {
    return this.fraudService.getGlobalStats();
  }

  @Get('guard-status')
  @ApiOperation({ summary: 'Get global fraud guard configuration' })
  getGuardStatus() {
    return this.fraudService.getGuardStatus();
  }

  @Patch('guard-status')
  @ApiOperation({ summary: 'Update global fraud guard threshold' })
  updateGuardStatus(@Body() body: { thresholdScore: number }) {
    return this.fraudService.updateGuardStatus(body.thresholdScore);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fraud alert details' })
  @ApiOkResponse({ type: FraudAlertResponseDto })
  findOne(@Param('id') id: string) {
    return this.fraudService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update fraud alert status' })
  @ApiOkResponse({ type: FraudAlertResponseDto })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFraudStatusDto,
    @CurrentUser() admin: { id: string },
  ) {
    return this.fraudService.updateStatus(id, dto.status, dto.resolution, admin.id);
  }
}

