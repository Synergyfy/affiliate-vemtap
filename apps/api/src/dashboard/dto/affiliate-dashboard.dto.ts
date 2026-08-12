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

  @ApiProperty({
    example: 125,
    description: "Total number of clicks on affiliate links",
  })
  totalClicks: number;

  @ApiProperty({
    example: 24500.0,
    description: "Earnings for the current day in kobo",
  })
  todayEarnings: number;

  @ApiProperty({
    example: 15,
    description: "Number of clicks on affiliate links today",
  })
  todayClicks: number;

  @ApiProperty({ example: 'Active Earner', description: 'Current affiliate level based on referrals' })
  currentLevel: string;

  @ApiProperty({ example: 'https://vemtap.com/signup', description: 'The base URL for affiliate referral signups' })
  referralSignupUrl: string;

  @ApiProperty({ example: 5, description: 'Daily lead target set by admin or user' })
  dailyLeadTarget: number;

  @ApiProperty({ example: 20, description: 'Monthly conversion target set by admin or user' })
  monthlyConversionTarget: number;

  @ApiProperty({ example: 3, description: 'Number of leads submitted today' })
  todayLeadsCount: number;

  @ApiProperty({ example: 12, description: 'Total leads submitted this month' })
  monthlyLeadsCount: number;

  @ApiProperty({ example: 2, description: 'Businesses converted (active) this month' })
  monthlyConversionsCount: number;

  @ApiProperty({ example: 4, description: 'SalesPipeline entries created today (businesses added via pipeline)' })
  todaySalesPipelineCount: number;

  @ApiProperty({ example: 2, description: 'MarketMappingVisit entries created today (businesses added via field work)' })
  todayMarketMappingCount: number;

  @ApiProperty({ example: 6, description: 'Total businesses added today across both sources' })
  todayBusinessesAdded: number;

  @ApiProperty({ example: 3, description: 'Market mapping visits that happened today (visitedAt is today)' })
  todayVisitsCount: number;

  @ApiProperty({ example: 1, description: 'Follow-ups due today (FOLLOW_UP stage with followUpDate = today)' })
  todayFollowUpsDue: number;

  @ApiProperty({ example: 1, description: 'Demos scheduled for today (DEMO stage with demoScheduledDate = today)' })
  todayDemosDue: number;

  @ApiProperty({ example: 0, description: 'Entries that moved to CUSTOMER stage today' })
  todayConversions: number;
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

export class AffiliateActionResponseDto {
  @ApiProperty({ example: "Recruit Affiliates" })
  title: string;

  @ApiProperty({ example: "Find 5 new potential affiliates" })
  desc: string;

  @ApiProperty({ example: "UserPlus" })
  icon: string;

  @ApiProperty({ example: "text-blue-600" })
  color: string;

  @ApiProperty({ example: "bg-blue-50" })
  bg: string;

  @ApiProperty({ example: "/dashboard/tools" })
  link?: string;
}

export class AffiliateAlertResponseDto {
  @ApiProperty({ example: "Milestone Alert" })
  title: string;

  @ApiProperty({ example: "You are 10 businesses away" })
  desc: string;

  @ApiProperty({
    example: "info",
    enum: ["info", "warning", "success", "error"],
  })
  type: string;

  @ApiProperty({ example: "Target" })
  icon: string;

  @ApiProperty({ example: "text-blue-600" })
  color: string;

  @ApiProperty({ example: "bg-blue-50" })
  bg: string;
}
