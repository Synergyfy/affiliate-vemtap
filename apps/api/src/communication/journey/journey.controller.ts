import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JourneyService } from './journey.service';
import { UpdateJourneyDto } from './dto/update-journey.dto';

const ADMIN_ROLES = [Role.ADMIN, Role.SUPER_ADMIN];

@ApiTags('Communication Customer Journey')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('communication/journey')
export class JourneyController {
  constructor(private readonly journeyService: JourneyService) {}

  @Get()
  @ApiOperation({ summary: 'List the configured customer-journey stages in execution order' })
  getStages() {
    return this.journeyService.getStages();
  }

  @Put()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Replace all customer-journey stages with the submitted ordered array' })
  replaceStages(@Body() dto: UpdateJourneyDto) {
    return this.journeyService.replaceStages(dto);
  }
}