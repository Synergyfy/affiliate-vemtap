import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  SalesPipelineStage,
  SalesExitState,
  SalesPriority,
  SalesDemoType,
} from '@prisma/client';

export class CreateSalesPipelineDto {
  @ApiProperty({ example: 'ABC Pharmacy' })
  @IsString()
  businessName: string;

  @ApiProperty({ required: false, example: 'Pharmacy' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiProperty({ required: false, example: 'Wuse 2, Abuja' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false, example: 'Mr. Johnson' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiProperty({ required: false, example: '08012345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: 'johnson@abcpharmacy.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false, example: 'Direct Referral' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({ required: false, enum: SalesPriority })
  @IsOptional()
  @IsEnum(SalesPriority)
  priority?: SalesPriority;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  subscriptionInterest?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DuplicateCheckRequestDto {
  @ApiProperty({ required: false, example: 'ABC Pharmacy' })
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiProperty({ required: false, example: '08012345678' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class QualifyLeadDto {
  @ApiProperty({ example: 'QUALIFIED' })
  @IsString()
  quality: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateStageDto {
  @ApiProperty({ enum: SalesPipelineStage })
  @IsEnum(SalesPipelineStage)
  stage: SalesPipelineStage;
}

export class SetExitStateDto {
  @ApiProperty({ enum: SalesExitState })
  @IsEnum(SalesExitState)
  exitState: SalesExitState;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  quality?: string;
}

export class ScheduleFollowUpDto {
  @ApiProperty({ example: '2026-08-10' })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ required: false, example: '14:00' })
  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteFollowUpDto {
  @ApiProperty({ example: 'Completed call, client interested' })
  @IsString()
  outcome: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ScheduleDemoDto {
  @ApiProperty({ example: '2026-08-12' })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ required: false, example: '10:00' })
  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @ApiProperty({ enum: SalesDemoType, example: 'VIRTUAL' })
  @IsEnum(SalesDemoType)
  type: SalesDemoType;

  @ApiProperty({ required: false, example: 'https://meet.google.com/abc-defg-hij' })
  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteDemoDto {
  @ApiProperty({ example: 'Demo successful, client signed up' })
  @IsString()
  outcome: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SalesFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  stage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, example: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
