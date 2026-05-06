import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class AffiliateStatsResponseDto {
  @ApiProperty({
    example: 150000.5,
    description: "Total lifetime earnings in kobo",
  })
  totalEarnings: number;

  @ApiProperty({
    example: 25000.0,
    description: "Earnings pending payout in kobo",
  })
  pendingEarnings: number;

  @ApiProperty({
    example: 12,
    description: "Number of active referred businesses",
  })
  activeReferrals: number;

  @ApiProperty({
    example: 45,
    description: "Total number of successful referrals",
  })
  referralCount: number;
}

export class GetLeaderboardQueryDto {
  @ApiProperty({
    required: false,
    default: 10,
    description: "Number of top affiliates to return",
  })
  @IsOptional()
  limit?: number;

  @ApiProperty({
    required: false,
    default: "all",
    enum: ["week", "month", "all"],
    description: "Time period for ranking",
  })
  @IsOptional()
  @IsString()
  timeframe?: string;
}

export class AffiliateForecastResponseDto {
  @ApiProperty({
    example: 340000.0,
    description: "Monthly recurring revenue from active businesses in kobo",
  })
  monthlyRecurringRevenue: number;

  @ApiProperty({
    example: 15,
    description: "Number of active businesses generating commissions",
  })
  activeBusinessCount: number;

  @ApiProperty({
    example: 340000.0,
    description: "Projected earnings for next 30 days in kobo",
  })
  projectedEarnings: number;
}

export class ChartDataPointDto {
  @ApiProperty({
    example: "2026-05-01",
    description: "Date in YYYY-MM-DD format",
  })
  date: string;

  @ApiProperty({ example: 5000.0, description: "Value for the date in kobo" })
  value: number;
}

export class AffiliateChartsResponseDto {
  @ApiProperty({
    type: [ChartDataPointDto],
    description: "Historical earnings data points",
  })
  earningsHistory: ChartDataPointDto[];

  @ApiProperty({
    type: [ChartDataPointDto],
    description: "Referral count trends over time",
  })
  referralTrends: ChartDataPointDto[];
}

export class LeaderboardResponseDto {
  @ApiProperty({ example: 1, description: "Current ranking position" })
  rank: number;

  @ApiProperty({ example: "John Doe", description: "Affiliate full name" })
  fullName: string;

  @ApiProperty({ example: 1250000.0, description: "Total earnings in kobo" })
  totalEarnings: number;

  @ApiProperty({ example: 150, description: "Total number of referrals" })
  referralCount: number;

  @ApiProperty({
    example: "up",
    enum: ["up", "down", "stable"],
    description: "Ranking trend compared to previous period",
  })
  trend?: string;
}
