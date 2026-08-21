import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CommunicationChannel } from '@prisma/client';

export class JourneyStageDto {
  @ApiProperty({ example: 'Day 3 follow-up' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Days to wait before this stage fires', default: 0 })
  @IsInt()
  @Min(0)
  waitDays: number;

  @ApiProperty({ enum: CommunicationChannel })
  @IsEnum(CommunicationChannel)
  channel: CommunicationChannel;

  @ApiProperty({ required: false, description: 'Message template to use for this stage' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiProperty({ default: true })
  @IsBoolean()
  enabled: boolean;
}

export class UpdateJourneyDto {
  @ApiProperty({ type: [JourneyStageDto], description: 'Full ordered list of journey stages (replaces all existing)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JourneyStageDto)
  stages: JourneyStageDto[];
}