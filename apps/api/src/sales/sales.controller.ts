import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
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
import { SalesService } from './sales.service';
import {
  CreateSalesPipelineDto,
  DuplicateCheckRequestDto,
  QualifyLeadDto,
  UpdateStageDto,
  SetExitStateDto,
  ScheduleFollowUpDto,
  CompleteFollowUpDto,
  ScheduleDemoDto,
  CompleteDemoDto,
  SalesFilterDto,
} from './dto/sales.dto';

@ApiTags('Sales Pipeline')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('pipeline')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Get sales pipeline entries with optional stage and search filters' })
  getPipeline(
    @CurrentUser() user: { id: string },
    @Query() filters: SalesFilterDto,
  ) {
    return this.salesService.getPipeline(user.id, filters);
  }

  @Post('pipeline')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Create a new sales lead entry' })
  createPipeline(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateSalesPipelineDto,
  ) {
    return this.salesService.createPipeline(user.id, dto);
  }

  @Get('metrics')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Get sales metrics and stage breakdowns' })
  getMetrics(@CurrentUser() user: { id: string }) {
    return this.salesService.getMetrics(user.id);
  }

  @Get('follow-ups')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Get follow-ups categorized by due today, overdue, and upcoming' })
  getFollowUps(@CurrentUser() user: { id: string }) {
    return this.salesService.getFollowUps(user.id);
  }

  @Post('leads/check-duplicate')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Check if business name or phone matches an existing lead' })
  checkDuplicate(
    @CurrentUser() user: { id: string },
    @Body() dto: DuplicateCheckRequestDto,
  ) {
    return this.salesService.checkDuplicate(user.id, dto);
  }

  @Get('pipeline/:leadId')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Get detailed sales lead information' })
  getLeadDetail(
    @CurrentUser() user: { id: string },
    @Param('leadId') leadId: string,
  ) {
    return this.salesService.getLeadDetail(user.id, leadId);
  }

  @Post('leads/:leadId/qualify')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Set lead quality score or status' })
  qualifyLead(
    @CurrentUser() user: { id: string },
    @Param('leadId') leadId: string,
    @Body() dto: QualifyLeadDto,
  ) {
    return this.salesService.qualifyLead(user.id, leadId, dto);
  }

  @Patch('pipeline/:leadId/stage')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Update pipeline stage for a lead' })
  updateStage(
    @CurrentUser() user: { id: string },
    @Param('leadId') leadId: string,
    @Body() dto: UpdateStageDto,
  ) {
    return this.salesService.updateStage(user.id, leadId, dto);
  }

  @Patch('pipeline/:leadId/exit')
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Set exit state for an unqualified/lost lead' })
  setExitState(
    @CurrentUser() user: { id: string },
    @Param('leadId') leadId: string,
    @Body() dto: SetExitStateDto,
  ) {
    return this.salesService.setExitState(user.id, leadId, dto);
  }

  @Post('pipeline/:leadId/follow-up')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Schedule a follow-up call/meeting' })
  scheduleFollowUp(
    @CurrentUser() user: { id: string },
    @Param('leadId') leadId: string,
    @Body() dto: ScheduleFollowUpDto,
  ) {
    return this.salesService.scheduleFollowUp(user.id, leadId, dto);
  }

  @Post('pipeline/:leadId/follow-up/complete')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Complete a scheduled follow-up' })
  completeFollowUp(
    @CurrentUser() user: { id: string },
    @Param('leadId') leadId: string,
    @Body() dto: CompleteFollowUpDto,
  ) {
    return this.salesService.completeFollowUp(user.id, leadId, dto);
  }

  @Post('pipeline/:leadId/demo')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Schedule a product demo' })
  scheduleDemo(
    @CurrentUser() user: { id: string },
    @Param('leadId') leadId: string,
    @Body() dto: ScheduleDemoDto,
  ) {
    return this.salesService.scheduleDemo(user.id, leadId, dto);
  }

  @Post('pipeline/:leadId/demo/complete')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Complete a scheduled product demo' })
  completeDemo(
    @CurrentUser() user: { id: string },
    @Param('leadId') leadId: string,
    @Body() dto: CompleteDemoDto,
  ) {
    return this.salesService.completeDemo(user.id, leadId, dto);
  }
}
