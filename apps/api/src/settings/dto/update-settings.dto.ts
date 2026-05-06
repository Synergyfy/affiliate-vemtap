import { IsNumber, IsOptional, Min, Max, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateSettingsDto {
  @ApiProperty({
    required: false,
    example: 0.15,
    description: "Direct referral commission rate (0-1)",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  directCommissionRate?: number;

  @ApiProperty({
    required: false,
    example: 0.1,
    description: "Indirect/network commission rate (0-1)",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  indirectCommissionRate?: number;

  @ApiProperty({
    required: false,
    example: 10000,
    description: "Minimum withdrawal amount in kobo",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minWithdrawal?: number;

  @ApiProperty({
    required: false,
    example: 100,
    description: "Fee charged per withdrawal in kobo",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  withdrawalFee?: number;

  @ApiProperty({
    required: false,
    example: 5,
    description:
      "Number of direct recruits needed to unlock sub-affiliate commissions",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  subAffiliateUnlockCount?: number;

  @ApiProperty({
    required: false,
    example: 75,
    description: "Score threshold (0-100) for triggering fraud alerts",
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  fraudThresholdScore?: number;

  @ApiProperty({
    required: false,
    example: 12,
    description: "Number of months a business generates commissions",
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  earningDurationMonths?: number;

  @ApiProperty({
    required: false,
    example: "<h1>Affiliate Agreement v1.0</h1>...",
    description: "HTML template for the affiliate agreement",
  })
  @IsOptional()
  @IsString()
  agreementTemplate?: string;

  @ApiProperty({
    required: false,
    example: 2,
    description: "Version number of the affiliate agreement",
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  agreementVersion?: number;

  @ApiProperty({
    required: false,
    example: 30,
    description: "Number of days before referral links expire",
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  linkExpiryDays?: number;

  @ApiProperty({
    required: false,
    example: 6,
    description: "Duration in months for manager reward eligibility",
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  managerRewardDurationMonths?: number;

  @ApiProperty({
    required: false,
    example: 3,
    description: "Maximum number of users who can share the same IP address",
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxIpUsage?: number;
}
