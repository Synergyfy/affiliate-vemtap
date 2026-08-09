import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';
import { PlanType } from '@prisma/client';

export class RecordReferralDto {
  @ApiProperty({ description: 'The affiliate referral code used at signup', example: 'VEM-ABC123' })
  @IsString()
  referralCode: string;

  @ApiProperty({ description: 'Name of the referred business', example: 'Acme Ltd' })
  @IsString()
  businessName: string;

  @ApiProperty({ description: 'Full name of the business owner', example: 'John Doe' })
  @IsString()
  ownerName: string;

  @ApiProperty({ description: 'Business contact email', example: 'john@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Business contact phone', example: '08012345678' })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'The actual monthly subscription amount Vemtap charged the business',
    example: 10000,
  })
  @IsNumber({}, { message: 'amount must be a number' })
  @Min(0)
  amount: number;

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
