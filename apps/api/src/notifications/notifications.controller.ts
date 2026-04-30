import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateNotificationDto, BroadcastNotificationDto } from './dto/notification.dto';
import { NotificationResponseDto, PaginatedNotificationResponseDto } from './dto/notification-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiOkResponse({ type: PaginatedNotificationResponseDto })
  async findAll(@CurrentUser() user: { id: string }, @Query() paginationDto: PaginationDto) {
    const { data, total } = await this.notificationsService.findUserNotifications(user.id, {
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

  @Patch(':id/read')
  @Roles(Role.AFFILIATE, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiOkResponse({ type: NotificationResponseDto })
  markAsRead(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  // --- ADMIN ENDPOINTS ---

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all notifications sent (Admin only)' })
  @ApiOkResponse({ type: PaginatedNotificationResponseDto })
  async findAllAdmin(@Query() paginationDto: PaginationDto) {
    const { data, total } = await this.notificationsService.findAllAdmin({
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

  @Post('broadcast')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send notification to all active users (Admin only)' })
  broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.notificationsService.broadcast(dto.type, dto.title, dto.message, dto.data);
  }

  @Post('direct')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send notification to a specific user (Admin only)' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }
}
