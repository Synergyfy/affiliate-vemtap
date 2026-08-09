import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PerformancePeriodType } from '@prisma/client';

export class PerformanceQueryDto {
  @ApiProperty({ enum: PerformancePeriodType })
  @IsEnum(PerformancePeriodType)
  period: PerformancePeriodType;
}

export class UpdatePerformanceConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyLeadTarget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  weeklyLeadTarget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyLeadTarget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  conversionTarget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  demoTarget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  followUpTarget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  revenueTarget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  dailyVisitTarget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  leadQualityPassThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedWorkStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedWorkEnd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  lateStartGraceMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  performanceThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  excellentThreshold?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightQualifiedLead?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightLeadQuality?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightFieldActivity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightFollowUp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightDemo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightConversion?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  weightRevenue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireContactInfo?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireDecisionMaker?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireGps?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireBusinessCategory?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  burstSubmissionWindowMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  burstSubmissionMaxLeads?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxSameLocationRadiusMeters?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  maxTransitionGapMinutes?: number;
}
