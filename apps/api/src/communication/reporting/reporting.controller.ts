import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CommunicationChannel, Role } from '@prisma/client';
import { ReportingService } from './reporting.service';

const ADMIN_ROLES = [Role.ADMIN, Role.SUPER_ADMIN];

@ApiTags('Communication Reporting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communication')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('overview')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Communication overview dashboard (totals by channel/status)' })
  overview() {
    return this.reportingService.overview();
  }

  @Get('reporting')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Communication performance report (whatsapp/sms + conversion)' })
  reporting(
    @Query('channel') channel?: CommunicationChannel,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportingService.reporting({ channel, from, to });
  }
}
