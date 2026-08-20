import { IsBoolean, IsInt, IsOptional, IsString, Min, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommunicationChannel, NotInterestedPolicy } from '@prisma/client';

export class UpdateCommunicationSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @ApiProperty({ required: false, default: 'disabled' })
  @IsOptional()
  @IsString()
  smsProvider?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  smsSenderId?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  smsDailyCap?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  whatsappEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  minIntervalHours?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxMessagesPerContactPerDay?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxMessagesPerContactPerWeek?: number;

  @ApiProperty({ required: false, enum: NotInterestedPolicy })
  @IsOptional()
  @IsEnum(NotInterestedPolicy)
  notInterestedPolicy?: NotInterestedPolicy;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  reEngagementDelayDays?: number;

  @ApiProperty({ required: false, enum: CommunicationChannel })
  @IsOptional()
  @IsEnum(CommunicationChannel)
  welcomeChannel?: CommunicationChannel;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  welcomeBody?: string | null;

  @ApiProperty({ required: false, type: [String], description: 'List of prohibited words/phrases in SMS' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  smsBlacklistedWords?: string[];
}

