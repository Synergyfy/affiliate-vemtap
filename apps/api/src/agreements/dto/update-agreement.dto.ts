import { IsString, IsArray, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateAgreementDto {
  @ApiProperty({
    description: 'Title of the agreement',
    example: 'Independent Contractor Terms of Service v3',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'A brief description of the agreement or what has changed',
    example: 'Updated terms regarding monthly conversion requirements.',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The full text of the agreement (supports markdown or HTML)',
    example: '<h4>1. Introduction</h4><p>These terms govern your participation...</p>',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    description: 'An array of roles that this agreement applies to',
    enum: Role,
    isArray: true,
    example: [Role.AFFILIATE, Role.AGENT],
    required: false,
  })
  @IsArray()
  @IsEnum(Role, { each: true })
  @IsOptional()
  targetRoles?: Role[];

  @ApiProperty({
    description: 'Whether the agreement is currently active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
