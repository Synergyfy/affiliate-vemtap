import { IsString, IsOptional, IsEmail, IsDateString, IsBoolean, IsIn, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
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

  @ApiPropertyOptional({ example: '50-100/day' })
  @IsOptional()
  @IsString()
  dailyCustomers?: string;

  @ApiPropertyOptional({ example: 'MEDIUM' })
  @IsOptional()
  @IsString()
  businessSize?: string;

  @ApiPropertyOptional({ example: '08:00 - 18:00' })
  @IsOptional()
  @IsString()
  openingHours?: string;

  @ApiPropertyOptional({ example: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] })
  @IsOptional()
  openingDays?: any;

  @ApiPropertyOptional({ example: 'DAY' })
  @IsOptional()
  @IsString()
  horizon?: string;

  @ApiPropertyOptional({ example: '2026-08-20' })
  @IsOptional()
  @IsString()
  nextVisitDate?: string;

  @ApiPropertyOptional({ example: '14:00' })
  @IsOptional()
  @IsString()
  nextVisitTime?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  decisionMakerMet?: boolean;

  @ApiPropertyOptional({ example: 'HIGH' })
  @IsOptional()
  @IsString()
  interested?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  demoDone?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isAnchor?: boolean;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsString()
  planId?: string;
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

export class DuplicateLeadsFilterDto {
  @ApiPropertyOptional({ description: 'Similarity threshold percentage (40 - 100)', default: 70 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(40)
  @Max(100)
  threshold?: number = 70;

  @ApiPropertyOptional({ description: 'Search term to filter duplicates by business name, phone, or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Maximum duplicate clusters to return', default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number = 100;
}

