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
import { Role } from '@prisma/client';
import { AnomaliesService } from './anomalies.service';
import { UpdateAnomalyDto } from './dto/anomalies.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('anomalies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('anomalies')
export class AnomaliesController {
  constructor(private readonly anomaliesService: AnomaliesService) {}

  @Get('me')
  @Roles(Role.SALES_EXECUTIVE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: 'List my activity anomalies' })
  getMyAnomalies(@CurrentUser() user: { id: string }) {
    return this.anomaliesService.getMyAnomalies(user.id);
  }

  @Get('admin/all')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: list activity anomalies' })
  getAll(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.anomaliesService.getAll({
      status,
      userId,
      take: take ? parseInt(take, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Patch('admin/:id/status')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: acknowledge or dismiss an anomaly' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAnomalyDto) {
    return this.anomaliesService.updateStatus(id, dto);
  }

  @Get('admin/overview')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: anomaly stats overview' })
  getOverview() {
    return this.anomaliesService.getOverview();
  }
}
