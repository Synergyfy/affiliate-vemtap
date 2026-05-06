import { IsEnum, IsString, IsOptional, IsUUID, IsObject, IsArray } from 'class-validator';
import { NotificationType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export enum BroadcastRecipientType {
  ALL = 'ALL',
  TOP_EARNERS = 'TOP_EARNERS',
  MANAGERS = 'MANAGERS',
  NEW_AFFILIATES = 'NEW_AFFILIATES',
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
}

export class CreateNotificationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  data?: any;
}

export class BroadcastNotificationDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty({ enum: BroadcastRecipientType, default: BroadcastRecipientType.ALL })
  @IsEnum(BroadcastRecipientType)
  @IsOptional()
  recipients: BroadcastRecipientType = BroadcastRecipientType.ALL;

  @ApiProperty({ enum: NotificationChannel, isArray: true, default: [NotificationChannel.IN_APP] })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @IsOptional()
  channels: NotificationChannel[] = [NotificationChannel.IN_APP];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  data?: any;
}
