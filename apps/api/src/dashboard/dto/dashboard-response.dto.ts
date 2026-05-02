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
}

export class DashboardChartsResponseDto {
  @ApiProperty()
  revenueGrowth: any[];

  @ApiProperty()
  affiliateSignups: any[];
}
