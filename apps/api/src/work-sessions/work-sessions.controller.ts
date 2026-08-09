import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { WorkSessionsService } from './work-sessions.service';
import { StartWorkDto, EndWorkDto } from './dto/work-sessions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('work-sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('work-sessions')
export class WorkSessionsController {
  constructor(private readonly workSessionsService: WorkSessionsService) {}

  @Post('start')
  @Roles(Role.SALES_EXECUTIVE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: 'Start a work session with GPS capture' })
  startWork(@CurrentUser() user: { id: string }, @Body() dto: StartWorkDto) {
    return this.workSessionsService.startWork(user.id, dto);
  }

  @Post('end')
  @Roles(Role.SALES_EXECUTIVE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: 'End the active work session' })
  endWork(@CurrentUser() user: { id: string }, @Body() dto: EndWorkDto) {
    return this.workSessionsService.endWork(user.id, dto);
  }

  @Get('active')
  @Roles(Role.SALES_EXECUTIVE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: 'Get the active work session for the current user' })
  getActiveSession(@CurrentUser() user: { id: string }) {
    return this.workSessionsService.getActiveSession(user.id);
  }

  @Get('me')
  @Roles(Role.SALES_EXECUTIVE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: 'List work sessions for the current user' })
  getMySessions(
    @CurrentUser() user: { id: string },
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.workSessionsService.getMySessions(user.id, {
      take: take ? parseInt(take, 10) : 20,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Get('today')
  @Roles(Role.SALES_EXECUTIVE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: 'Get today work status for the current user' })
  getTodayStatus(@CurrentUser() user: { id: string }) {
    return this.workSessionsService.getTodayStatus(user.id);
  }

  @Get('admin/today')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Admin: today's live work-status for the sales team" })
  getTodaySessions() {
    return this.workSessionsService.getTodaySessions();
  }
}
