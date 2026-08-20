import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommunicationChannel, CommunicationMessageStatus, CommunicationMessageType } from '@prisma/client';
import { AudienceFilterDto } from './audience.dto';

export class SendMessageDto {
  @ApiProperty({ enum: CommunicationChannel })
  @IsEnum(CommunicationChannel)
  channel: CommunicationChannel;

  @ApiProperty({ example: 'Hi [Business Name], thanks for your interest...' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ required: false, description: 'Explicit lead ids (overrides audience filters)' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  leadIds?: string[];

  @ApiProperty({ required: false, type: AudienceFilterDto })
  @IsOptional()
  audience?: AudienceFilterDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @ApiProperty({ required: false, enum: CommunicationMessageType })
  @IsOptional()
  @IsEnum(CommunicationMessageType)
  type?: CommunicationMessageType;

  @ApiProperty({ required: false, description: 'Schedule SMS delivery at this time' })
  @IsOptional()
  @IsDateString()
  scheduledForAt?: string;
}

export class MessageQueryDto {
  @ApiProperty({ required: false, enum: CommunicationChannel })
  @IsOptional()
  @IsEnum(CommunicationChannel)
  channel?: CommunicationChannel;

  @ApiProperty({ required: false, enum: CommunicationMessageStatus })
  @IsOptional()
  @IsEnum(CommunicationMessageStatus)
  status?: CommunicationMessageStatus;

  @ApiProperty({ required: false, enum: CommunicationMessageType })
  @IsOptional()
  @IsEnum(CommunicationMessageType)
  type?: CommunicationMessageType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}

export class RetrySmsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
