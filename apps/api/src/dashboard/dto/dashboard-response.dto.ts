import { ApiProperty } from "@nestjs/swagger";

export class AdminStatsResponseDto {
  @ApiProperty({
    example: 150,
    description: "Total number of registered affiliates",
  })
  totalAffiliates: number;

  @ApiProperty({
    example: 120,
    description: "Number of active affiliates (status = ACTIVE)",
  })
  activeAffiliates: number;

  @ApiProperty({
    example: 2500000,
    description: "Total subscription revenue from active businesses",
  })
  totalRevenue: number;

  @ApiProperty({
    example: 500000,
    description: "Total commission amount paid to affiliates",
  })
  commissionsPaid: number;

  @ApiProperty({
    example: 25000,
    description: "Total amount of pending withdrawal requests",
  })
  pendingPayouts: number;

  @ApiProperty({
    example: 15000,
    description: "Total amount of approved withdrawals awaiting payout",
  })
  approvedPayouts: number;

  @ApiProperty({
    example: 35000,
    description: "Total amount of processing + paid withdrawals",
  })
  completedPayouts: number;

  @ApiProperty({ example: 3, description: "Number of open fraud alerts" })
  fraudAlerts: number;

  @ApiProperty({
    example: 25,
    description: "Percentage change in paid commissions vs previous 30 days",
  })
  commissionsTrendPercentage: number;
}

export class ChartDataPointDto {
  @ApiProperty({
    example: "2026-05-01",
    description: "Date in YYYY-MM-DD format",
  })
  date: string;

  @ApiProperty({ example: 15000, description: "Numeric value for the date" })
  value: number;
}

export class DashboardChartsResponseDto {
  @ApiProperty({
    type: [ChartDataPointDto],
    example: [
      { date: "2026-05-01", value: 15000 },
      { date: "2026-05-02", value: 22000 },
    ],
    description: "Daily revenue growth over last 30 days",
  })
  revenueGrowth: ChartDataPointDto[];

  @ApiProperty({
    type: [ChartDataPointDto],
    example: [
      { date: "2026-05-01", value: 5 },
      { date: "2026-05-02", value: 8 },
    ],
    description: "Daily new affiliate signups over last 30 days",
  })
  affiliateSignups: ChartDataPointDto[];
}

export class ManagerPerformanceResponseDto {
  @ApiProperty({
    example: 15,
    description: "Number of recruited affiliates with at least 1 referral",
  })
  activeAgentsCount: number;

  @ApiProperty({
    example: 45,
    description: "Number of businesses referred by network in last 90 days",
  })
  newNetworkBusinessesCount: number;

  @ApiProperty({
    example: 120,
    description: "Total network size (recruits of recruits)",
  })
  networkSize: number;

  @ApiProperty({
    example: true,
    description: "Whether manager meets qualification thresholds",
  })
  isQualified: boolean;

  @ApiProperty({
    example: 30,
    description: "Required active agents for qualification",
  })
  targetAgents: number;

  @ApiProperty({
    example: 100,
    description: "Required network businesses for qualification",
  })
  targetBusinesses: number;
}
