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
  async findAll(@Query() paginationDto: PaginationDto) {
    const { data, total } = await this.fraudService.findAll({
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
