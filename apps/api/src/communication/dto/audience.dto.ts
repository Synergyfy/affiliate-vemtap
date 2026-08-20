import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JOURNEY_STATES, JourneyState } from '../common/communication.constants';

export enum AudienceDateFilter {
  TODAY = 'TODAY',
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
}

export class AudienceFilterDto {
  @ApiProperty({ required: false, enum: JOURNEY_STATES, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(JOURNEY_STATES, { each: true })
  statuses?: JourneyState[];

  @ApiProperty({ required: false, description: 'Salesperson (agent) user ids' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  salespersonIds?: string[];

  @ApiProperty({ required: false, description: 'Location / area filter' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false, enum: AudienceDateFilter })
  @IsOptional()
  @IsEnum(AudienceDateFilter)
  dateFilter?: AudienceDateFilter;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'Only contacts with a phone number' })
  @IsOptional()
  @IsBoolean()
  hasPhone?: boolean;
}

export class AudiencePreviewDto extends AudienceFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  includeEligibility?: boolean;
}

export class ContactQueryDto {
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;
}
