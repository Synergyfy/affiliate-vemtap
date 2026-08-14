import { IsString, IsOptional, IsEmail, IsDateString, IsBoolean, IsIn, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LEAD_STATUSES, ALLOWED_LEAD_STATUSES } from '../../common/lead.constants';

export class CreateLeadDto {
  @ApiProperty({ example: 'Vemtap Solutions' })
  @IsString()
  businessName: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional({ example: '123 Main St, Lagos' })
  @IsOptional()
  @IsString()
  businessAddress?: string;

  @ApiPropertyOptional({ example: 'Lagos, Nigeria' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ example: 'CEO' })
  @IsOptional()
  @IsString()
  contactRole?: string;

  @ApiProperty({ example: '+2348000000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Social Media' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ enum: ALLOWED_LEAD_STATUSES, default: 'NOT_YET' })
  @IsOptional()
  @IsIn(ALLOWED_LEAD_STATUSES)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({ description: 'For admin use to assign to specific agent' })
  @IsOptional()
  @IsUUID()
  assignedAgentId?: string;

  @ApiPropertyOptional({ example: 'HIGH' })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'Lagos' })
  @IsOptional()
  @IsString()
  gpsAddress?: string;

  @ApiPropertyOptional({ example: '6.5244' })
  @IsOptional()
  @IsString()
  gpsLat?: string;

  @ApiPropertyOptional({ example: '3.3792' })
  @IsOptional()
  @IsString()
  gpsLng?: string;
}

import { PartialType } from '@nestjs/swagger';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {}

import { PaginationDto } from '../../common/dto/pagination.dto';

export class LeadFilterDto extends PaginationDto {
  @IsOptional()
  @IsIn(LEAD_STATUSES)
  status?: string;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  visited?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
