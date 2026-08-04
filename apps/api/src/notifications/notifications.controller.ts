import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { Role } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import {
  CreateNotificationDto,
  BroadcastNotificationDto,
} from "./dto/notification.dto";
import {
  NotificationResponseDto,
  PaginatedNotificationResponseDto,
} from "./dto/notification-response.dto";
import { PaginationDto } from "../common/dto/pagination.dto";

@ApiTags("notifications")
@ApiBearerAuth("JWT")
@Controller("notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("me")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get current user notifications" })
  @ApiOkResponse({
    type: PaginatedNotificationResponseDto,
    description: "User notifications retrieved",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(
    @CurrentUser() user: { id: string },
    @Query() paginationDto: PaginationDto,
  ) {
    const { data, total } =
      await this.notificationsService.findUserNotifications(user.id, {
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

  @Get("unread-count")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get current user unread notification count" })
  getUnreadCount(@CurrentUser() user: { id: string }) {
    return this.notificationsService.getUnreadCount(user.id);
  }

  @Patch("read-all")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Mark all user notifications as read" })
  markAllAsRead(@CurrentUser() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Get("push-vapid-public-key")
  @Public()
  @ApiOperation({ summary: "Get the VAPID public key for browser push subscriptions" })
  getVapidPublicKey() {
    return this.notificationsService.getVapidPublicKey();
  }

  @Post("push-subscription")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Register a browser push subscription for the current user" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["endpoint", "p256dh", "auth"],
      properties: {
        endpoint: { type: "string" },
        p256dh: { type: "string" },
        auth: { type: "string" },
        userAgent: { type: "string" },
      },
    },
  })
  savePushSubscription(
    @CurrentUser() user: { id: string },
    @Body() body: { endpoint: string; p256dh: string; auth: string; userAgent?: string },
  ) {
    return this.notificationsService.savePushSubscription(user.id, body);
  }

  @Delete("push-subscription")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Remove a browser push subscription for the current user" })
  removePushSubscription(
    @CurrentUser() user: { id: string },
    @Body() body: { endpoint: string },
  ) {
    return this.notificationsService.removePushSubscription(user.id, body.endpoint);
  }

  @Patch(":id/read")
  @Roles(Role.AFFILIATE, Role.AGENT, Role.SUPERVISOR, Role.MANAGER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Mark notification as read" })
  @ApiOkResponse({
    type: NotificationResponseDto,
    description: "Notification marked as read",
  })
  @ApiResponse({ status: 404, description: "Notification not found" })
  markAsRead(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Get("drafts")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get draft notifications (Admin only)" })
  getDrafts() {
    return this.notificationsService.getDrafts();
  }

  @Post("drafts")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Save draft notification (Admin only)" })
  saveDraft(
    @CurrentUser() admin: { id: string },
    @Body() data: { title: string; message: string; type: any; targetRoles?: any }
  ) {
    return this.notificationsService.saveDraft({ ...data, createdById: admin.id });
  }

  @Get("admin/list")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "List all notifications sent (Admin only)" })
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

  @Post("broadcast")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary:
      "Send notification to all active users with filtering (Admin only)",
  })
  @ApiBody({
    type: BroadcastNotificationDto,
    description: "Broadcast notification details",
    examples: {
      all: {
        value: {
          type: "SYSTEM",
          title: "Maintenance Notice",
          message: "System maintenance on May 10th",
          recipients: "ALL",
          channels: ["IN_APP", "EMAIL"],
        },
      },
      topEarners: {
        value: {
          type: "PROMOTION",
          title: "Bonus Event",
          message: "Double commissions this weekend!",
          recipients: "TOP_EARNERS",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Broadcast sent successfully",
    example: { message: "Notification sent to 150 users" },
  })
  broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.notificationsService.broadcast(
      dto.type,
      dto.title,
      dto.message,
      dto.data,
      dto.recipients,
      dto.channels,
    );
  }

  @Post("direct")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: "Send notification to a specific user (Admin only)",
  })
  @ApiBody({
    type: CreateNotificationDto,
    description: "Direct notification details",
    examples: {
      default: {
        value: {
          userId: "user-uuid",
          type: "SYSTEM",
          title: "Account Update",
          message: "Your profile has been updated",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Notification sent to user",
    example: {
      id: "notif-uuid",
      userId: "user-uuid",
      title: "Account Update",
      message: "Your profile has been updated",
      isRead: false,
    },
  })
  @ApiResponse({ status: 404, description: "User not found" })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get(":id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get notification detail (Admin only)" })
  getNotificationDetail(@Param("id") id: string) {
    return this.notificationsService.getNotificationDetail(id);
  }

  @Delete(":id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Delete notification (Admin only)" })
  deleteNotification(@Param("id") id: string) {
    return this.notificationsService.deleteNotification(id);
  }
}
