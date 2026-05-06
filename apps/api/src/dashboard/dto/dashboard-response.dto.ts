import { ApiProperty } from '@nestjs/swagger';

export class AdminStatsResponseDto {
  @ApiProperty()
  totalAffiliates: number;

  @ApiProperty()
  activeAffiliates: number;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  commissionsPaid: number;

  @ApiProperty()
  pendingPayouts: number;

  @ApiProperty()
  fraudAlerts: number;

  @ApiProperty()
  commissionsTrendPercentage: number;
}

export class ChartDataPointDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  value: number;
}

export class DashboardChartsResponseDto {
  @ApiProperty({ type: [ChartDataPointDto] })
  revenueGrowth: ChartDataPointDto[];

  @ApiProperty({ type: [ChartDataPointDto] })
  affiliateSignups: ChartDataPointDto[];
}

export class ManagerPerformanceResponseDto {
  @ApiProperty()
  activeAgentsCount: number;

  @ApiProperty()
  newNetworkBusinessesCount: number;

  @ApiProperty()
  networkSize: number;

  @ApiProperty()
  isQualified: boolean;

  @ApiProperty()
  targetAgents: number;

  @ApiProperty()
  targetBusinesses: number;
}
