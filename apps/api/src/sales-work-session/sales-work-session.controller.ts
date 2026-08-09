import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SalesWorkSessionService } from './sales-work-session.service';
import { StartWorkDto } from './dto/start-work.dto';
import { EndWorkDto } from './dto/end-work.dto';
import { Role } from '@prisma/client';

@ApiTags('Sales Work Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales-work-sessions')
export class SalesWorkSessionController {
  constructor(
    private readonly workSessionService: SalesWorkSessionService,
  ) {}

  @Post('start')
  @Roles(Role.SALES_EXECUTIVE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a new work session' })
  @ApiResponse({ status: 201, description: 'Work session started successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not a Sales Executive' })
  @ApiResponse({ status: 409, description: 'Active session already exists' })
  async startWork(
    @CurrentUser() user: any,
    @Body() dto: StartWorkDto,
    @Req() req: any,
  ) {
    return this.workSessionService.startWork(
      user.id,
      user.role,
      dto,
      req.ip,
    );
  }

  @Post('end')
  @Roles(Role.SALES_EXECUTIVE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End the active work session' })
  @ApiResponse({ status: 200, description: 'Work session ended successfully' })
  @ApiResponse({ status: 404, description: 'No active session found' })
  async endWork(
    @CurrentUser() user: any,
    @Body() dto: EndWorkDto,
    @Req() req: any,
  ) {
    return this.workSessionService.endWork(
      user.id,
      user.role,
      dto,
      req.ip,
    );
  }

  @Get('active')
  @Roles(Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Get current active work session' })
  @ApiResponse({ status: 200, description: 'Returns active session or null' })
  async getActiveSession(@CurrentUser() user: any) {
    return this.workSessionService.getActiveSession(user.id, user.role);
  }

  @Get('history')
  @Roles(Role.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Get work session history' })
  @ApiResponse({ status: 200, description: 'Returns paginated session history' })
  async getHistory(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.workSessionService.getSessionHistory(
      user.id,
      user.role,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
