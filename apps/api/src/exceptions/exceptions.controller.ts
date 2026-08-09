import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ExceptionsService } from './exceptions.service';
import { CreateExceptionDto, ReviewExceptionDto } from './dto/exceptions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('exceptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exceptions')
export class ExceptionsController {
  constructor(private readonly exceptionsService: ExceptionsService) {}

  @Post()
  @Roles(Role.SALES_EXECUTIVE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: 'Submit an exception/context report' })
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateExceptionDto) {
    return this.exceptionsService.create(user.id, dto);
  }

  @Get('me')
  @Roles(Role.SALES_EXECUTIVE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: 'List my exception reports' })
  getMyExceptions(
    @CurrentUser() user: { id: string },
    @Query('status') status?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.exceptionsService.getMyExceptions(user.id, {
      status,
      take: take ? parseInt(take, 10) : 20,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Get('stats')
  @Roles(Role.SALES_EXECUTIVE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER)
  @ApiOperation({ summary: 'My exception stats' })
  getStats(@CurrentUser() user: { id: string }) {
    return this.exceptionsService.getStats(user.id);
  }

  @Get('admin/all')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: list all exception reports' })
  getAll(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    return this.exceptionsService.getAll({
      status,
      userId,
      take: take ? parseInt(take, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Patch('admin/:id/review')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: review an exception (VALID / INVALID)' })
  review(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ReviewExceptionDto,
  ) {
    return this.exceptionsService.review(id, user.id, dto);
  }

  @Get('admin/overview')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin: exception stats overview' })
  getOverview() {
    return this.exceptionsService.getStatsOverview();
  }
}
