import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsObject, IsOptional, IsString, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CampaignStatus, CommunicationChannel } from '@prisma/client';
import { AudienceFilterDto } from './audience.dto';

export class CreateCampaignDto {
  @ApiProperty({ example: 'August New Business Offer' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: CommunicationChannel, isArray: true })
  @IsArray()
  @IsEnum(CommunicationChannel, { each: true })
  channels: CommunicationChannel[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiProperty({ type: AudienceFilterDto })
  @ValidateNested()
  @Type(() => AudienceFilterDto)
  @IsObject()
  audienceFilters: AudienceFilterDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endAt?: string;
}

export class UpdateCampaignDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: CommunicationChannel, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(CommunicationChannel, { each: true })
  channels?: CommunicationChannel[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiProperty({ required: false, type: AudienceFilterDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AudienceFilterDto)
  @IsObject()
  audienceFilters?: AudienceFilterDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endAt?: string;

  @ApiProperty({ required: false, enum: CampaignStatus })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}

export class CampaignActionDto {
  @ApiProperty({ enum: CampaignStatus, description: 'activate | pause | complete | cancel' })
  @IsEnum(CampaignStatus)
  action: CampaignStatus;
}
