import { IsString, IsArray, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateAgreementDto {
  @ApiProperty({
    description: 'Title of the agreement',
    example: 'Independent Contractor Terms of Service v2',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'A brief description of the agreement or what has changed',
    example: 'Updated terms regarding direct referral commission percentages and tax responsibility.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'The full text of the agreement (supports markdown or HTML)',
    example: '<h4>1. Introduction</h4><p>These terms govern your participation...</p>',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'An array of roles that this agreement applies to',
    enum: Role,
    isArray: true,
    example: [Role.AFFILIATE, Role.AGENT],
  })
  @IsArray()
  @IsEnum(Role, { each: true })
  @IsNotEmpty()
  targetRoles: Role[];
}
