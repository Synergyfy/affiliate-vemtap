import { ApiProperty } from "@nestjs/swagger";
import { NotificationType } from "@prisma/client";

export class NotificationResponseDto {
  @ApiProperty({
    description: "Unique notification identifier",
    example: "notif-uuid",
  })
  id: string;

  @ApiProperty({
    description: "User who received the notification",
    example: "user-uuid",
  })
  userId: string;

  @ApiProperty({
    enum: NotificationType,
    description: "Type of notification",
    example: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @ApiProperty({
    description: "Notification title",
    example: "New Commission Earned",
  })
  title: string;

  @ApiProperty({
    description: "Notification message body",
    example: "You earned ₦450 from Vemtap Solutions!",
  })
  message: string;

  @ApiProperty({
    description: "Additional notification data",
    required: false,
    example: { businessId: "business-uuid", amount: 45000 },
  })
  data?: any;

  @ApiProperty({
    description: "Whether the notification has been read",
    example: false,
  })
  isRead: boolean;

  @ApiProperty({
    description: "Notification creation date",
    example: "2026-05-06T10:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Date when notification was marked as read",
    required: false,
    example: "2026-05-06T11:00:00.000Z",
  })
  readAt?: Date;
}

export class PaginatedNotificationResponseDto {
  @ApiProperty({
    type: [NotificationResponseDto],
    description: "Array of notification objects",
  })
  data: NotificationResponseDto[];

  @ApiProperty({
    description: "Pagination metadata",
    example: { total: 30, page: 1, limit: 10, totalPages: 3 },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
