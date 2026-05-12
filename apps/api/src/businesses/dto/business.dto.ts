import { IsString, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { PlanType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBusinessDto {
  @ApiProperty({ example: 'Vemtap Solutions' })
  @IsString()
  businessName: string;

  @ApiProperty({ example: 'John Owner' })
  @IsString()
  ownerName: string;

  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '08012345678' })
  @IsString()
  phone: string;

  @ApiProperty({ required: false, example: '123 Business Way, Lagos' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, example: 'Retail' })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiProperty({ enum: PlanType, example: PlanType.BASIC })
  @IsEnum(PlanType)
  planType: PlanType;

  @ApiProperty({ example: 'AGENT001' })
  @IsString()
  referralCode: string;
}
