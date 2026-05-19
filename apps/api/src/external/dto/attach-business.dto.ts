import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { PlanType } from '@prisma/client';

export class AttachBusinessDto {
  @ApiProperty({ description: 'The affiliate user ID to attach this business to', example: 'uuid-123' })
  @IsString()
  @IsNotEmpty()
  affiliateId: string;

  @ApiProperty({ description: 'Name of the business', example: 'Acme Ltd' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ description: 'Full name of the business owner', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @ApiProperty({ description: 'Business contact email', example: 'john@acme.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Business contact phone', example: '08012345678' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    description: 'Subscription plan the business signed up for',
    enum: PlanType,
    default: PlanType.BASIC,
    required: false,
  })
  @IsOptional()
  @IsEnum(PlanType)
  planType?: PlanType;

  @ApiProperty({ description: 'Business address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Type of business', required: false })
  @IsOptional()
  @IsString()
  businessType?: string;
}
