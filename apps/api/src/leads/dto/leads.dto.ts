import { IsString, IsOptional, IsEnum, IsEmail, IsDateString, IsUUID } from 'class-validator';
import { LeadStatus, Priority } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadDto {
  @ApiProperty({ example: 'Vemtap Solutions' })
  @IsString()
  businessName: string;

  @ApiProperty({ example: 'Technology' })
  @IsString()
  industry: string;

  @ApiPropertyOptional({ example: 'Lagos, Nigeria' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'https://vemtap.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  contactName: string;

  @ApiPropertyOptional({ example: 'CEO' })
  @IsOptional()
  @IsString()
  contactRole?: string;

  @ApiProperty({ example: '+2348000000000' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Social Media' })
  @IsString()
  source: string;

  @ApiPropertyOptional({ example: 'Referral from Michael' })
  @IsOptional()
  @IsString()
  otherSource?: string;

  @ApiProperty({ enum: Priority, default: Priority.MEDIUM })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiProperty({ enum: LeadStatus, default: LeadStatus.POTENTIAL })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

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
}

export class UpdateLeadDto extends CreateLeadDto {}

export class LeadFilterDto {
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsString()
  search?: string;
}
