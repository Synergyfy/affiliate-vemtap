import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { FieldActivityService } from './field-activity.service';
import {
  StartVisitPayloadDto,
  CompleteVisitPayloadDto,
  TransitionExplanationDto,
} from './dto/field-activity.dto';

@ApiTags('Field Activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('field-activity')
export class FieldActivityController {
  constructor(private readonly fieldActivityService: FieldActivityService) {}

  @Get('mission/active')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Get active field mission for current user' })
  getActiveMission(@CurrentUser() user: { id: string }) {
    return this.fieldActivityService.getActiveMission(user.id);
  }

  @Get('mission/:id/progress')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Get progress metrics for a field mission' })
  getMissionProgress(
    @CurrentUser() user: { id: string },
    @Param('id') missionId: string,
  ) {
    return this.fieldActivityService.getMissionProgress(user.id, missionId);
  }

  @Get('mission/:id/timeline')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Get activity timeline events for a field mission' })
  getMissionTimeline(
    @CurrentUser() user: { id: string },
    @Param('id') missionId: string,
  ) {
    return this.fieldActivityService.getMissionTimeline(user.id, missionId);
  }

  @Post('visit/start')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Start a field visit' })
  startVisit(
    @CurrentUser() user: { id: string },
    @Body() dto: StartVisitPayloadDto,
  ) {
    return this.fieldActivityService.startVisit(user.id, dto);
  }

  @Post('visit/complete')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Complete a field visit' })
  completeVisit(
    @CurrentUser() user: { id: string },
    @Body() dto: CompleteVisitPayloadDto,
  ) {
    return this.fieldActivityService.completeVisit(user.id, dto);
  }

  @Get('visit/:id/status')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Get visit status and transition details' })
  getVisitStatus(
    @CurrentUser() user: { id: string },
    @Param('id') visitId: string,
  ) {
    return this.fieldActivityService.getVisitStatus(user.id, visitId);
  }

  @Post('visit/:id/transition/explanation')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Submit explanation for unusual visit transition' })
  submitTransitionExplanation(
    @CurrentUser() user: { id: string },
    @Param('id') visitId: string,
    @Body() dto: TransitionExplanationDto,
  ) {
    return this.fieldActivityService.submitTransitionExplanation(user.id, visitId, dto);
  }
}
