import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartVisitPayloadDto {
  @ApiProperty({ description: 'ID of the visit or business to start' })
  @IsString()
  visitId: string;

  @ApiProperty({ required: false, description: 'Optional mission ID' })
  @IsOptional()
  @IsString()
  missionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  accuracy?: number;
}

export class CompleteVisitPayloadDto {
  @ApiProperty({ description: 'ID of the visit being completed' })
  @IsString()
  visitId: string;

  @ApiProperty({ required: false, description: 'Outcome of the visit' })
  @IsOptional()
  @IsString()
  visitOutcome?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  durationSeconds?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  visitNotes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  leadData?: {
    businessName?: string;
    category?: string;
    contactName?: string;
    phone?: string;
    email?: string;
    subscriptionInterest?: boolean;
  };
}

export class TransitionExplanationDto {
  @ApiProperty({ description: 'Reason for unusual transition' })
  @IsString()
  reason: string;

  @ApiProperty({ required: false, description: 'Additional notes or explanation context' })
  @IsOptional()
  @IsString()
  notes?: string;
}
