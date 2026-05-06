import { ApiProperty } from '@nestjs/swagger';

export class AffiliateStatsResponseDto {
  @ApiProperty({ example: 150000.50 })
  totalEarnings: number;

  @ApiProperty({ example: 25000.00 })
  pendingEarnings: number;

  @ApiProperty({ example: 12 })
  activeReferrals: number;

  @ApiProperty({ example: 45 })
  referralCount: number;
}

export class AffiliateForecastResponseDto {
  @ApiProperty({ example: 340000.00 })
  monthlyRecurringRevenue: number;

  @ApiProperty({ example: 15 })
  activeBusinessCount: number;

  @ApiProperty({ example: 340000.00, description: 'Next 30 days projected earnings' })
  projectedEarnings: number;
}

export class ChartDataPointDto {
  @ApiProperty({ example: '2026-05-01' })
  date: string;

  @ApiProperty({ example: 5000.00 })
  value: number;
}

export class AffiliateChartsResponseDto {
  @ApiProperty({ type: [ChartDataPointDto] })
  earningsHistory: ChartDataPointDto[];

  @ApiProperty({ type: [ChartDataPointDto] })
  referralTrends: ChartDataPointDto[];
}

export class LeaderboardResponseDto {
  @ApiProperty({ example: 1 })
  rank: number;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ example: 1250000.00 })
  totalEarnings: number;

  @ApiProperty({ example: 150 })
  referralCount: number;
}
