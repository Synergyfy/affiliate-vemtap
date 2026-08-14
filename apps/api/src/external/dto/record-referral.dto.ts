import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';

export class RecordReferralDto {
  @ApiProperty({ description: 'The affiliate referral code used at signup', example: 'VEM-VLBAJY' })
  @IsString()
  referralCode: string;

  @ApiProperty({
    description: "Vemtap's business UUID (links recurring payments to the same business)",
    example: 'edcf9de7-2397-474b-8720-412a4cb95e78',
  })
  @IsString()
  businessId: string;

  @ApiProperty({ description: 'Name of the referred business', example: 'Acme Ltd' })
  @IsString()
  businessName: string;

  @ApiProperty({ description: 'Full name of the business owner', example: 'John Doe' })
  @IsString()
  ownerName: string;

  @ApiProperty({ description: 'Business contact email', example: 'john@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Opaque plan name from Vemtap (dynamic, admin-defined)', example: 'Professional' })
  @IsString()
  planName: string;

  @ApiProperty({
    description: 'Actual amount charged for this payment in NGN',
    example: 15000,
  })
  @IsNumber({}, { message: 'amountPaid must be a number' })
  @Min(0)
  amountPaid: number;

  @ApiProperty({
    description: 'Whether this is the first successful paid subscription for the business',
    example: true,
  })
  @IsBoolean()
  isFirstPayment: boolean;

  @ApiProperty({
    description: 'Commission rate as a percentage (30 for first payment, 10 for recurring)',
    example: 30,
  })
  @IsNumber({}, { message: 'rate must be a number' })
  @Min(0)
  rate: number;

  @ApiProperty({
    description: 'Unique payment reference from Vemtap (unique per payment, NOT per business)',
    example: 'SUB-edcf9de7-...-1786706909521',
  })
  @IsString()
  externalReference: string;

  @ApiPropertyOptional({ description: 'Business contact phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Opaque plan id from Vemtap', example: '25a9b67b-63ed-4df8-b222-58d0a2e22715' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ description: 'Business address' })
  @IsOptional()
  @IsString()
  address?: string;
}
