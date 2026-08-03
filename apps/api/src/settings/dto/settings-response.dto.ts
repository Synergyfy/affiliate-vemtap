import { ApiProperty } from "@nestjs/swagger";

export class PlatformSettingsResponseDto {
  @ApiProperty({
    description: "Settings record identifier",
    example: "settings-uuid",
  })
  id: string;

  @ApiProperty({
    description: "Direct referral commission rate (e.g., 0.15 = 15%)",
    example: 0.15,
  })
  directCommissionRate: number;

  @ApiProperty({
    description: "Indirect/network commission rate (e.g., 0.10 = 10%)",
    example: 0.1,
  })
  indirectCommissionRate: number;

  @ApiProperty({
    description: "Minimum withdrawal amount in kobo",
    example: 10000,
  })
  minWithdrawal: number;

  @ApiProperty({
    description: "Fee charged per withdrawal in kobo",
    example: 100,
  })
  withdrawalFee: number;

  @ApiProperty({
    description:
      "Number of direct recruits needed to unlock sub-affiliate commissions",
    example: 5,
  })
  subAffiliateUnlockCount: number;

  @ApiProperty({
    description: "Score threshold for triggering fraud alerts",
    example: 75,
  })
  fraudThresholdScore: number;

  @ApiProperty({
    description: "Duration in months that a business generates commissions",
    example: 12,
  })
  earningDurationMonths: number;

  @ApiProperty({
    description: "Recurring agent commission percentage",
    example: 5,
  })
  recurringAgentCommission: number;

  @ApiProperty({
    description: "Recurring affiliate commission percentage",
    example: 10,
  })
  recurringAffiliateCommission: number;

  @ApiProperty({
    description: "Recurring line manager commission percentage",
    example: 3,
  })
  recurringLineManagerCommission: number;

  @ApiProperty({
    description: "Recurring subscription commission duration in months",
    example: 12,
  })
  recurringDurationMonths: number;

  @ApiProperty({
    description: "Recurring subscription commission year 2+ reduction rate percentage",
    example: 50,
  })
  recurringYear2Rate: number;

  @ApiProperty({
    description: "Last settings update timestamp",
    example: "2026-05-01T10:00:00.000Z",
  })
  updatedAt: Date;
}
