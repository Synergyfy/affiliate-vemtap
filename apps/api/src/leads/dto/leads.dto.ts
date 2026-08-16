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
import { Role } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {}

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

export class HarvestLeadsFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search term across business, contact person, phone, email, and user name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: Role, description: 'Filter by role of user who added the lead' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Filter by specific user ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by pipeline status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by location or address' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Filter only leads with a valid phone number' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasPhone?: boolean;

  @ApiPropertyOptional({ description: 'Filter created on or after date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter created on or before date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['createdAt', 'businessName', 'status', 'contactName'], default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

