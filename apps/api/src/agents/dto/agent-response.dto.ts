import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class BusinessBriefDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Business name' })
  name: string;

  @ApiProperty({ description: 'Plan type', example: 'PRO' })
  plan: string;

  @ApiProperty({ description: 'Monthly recurring revenue' })
  mrr: number;

  @ApiProperty({ description: 'Business status', example: 'ACTIVE' })
  status: string;
}

export class SubordinateBriefDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class AgentResponseDto {
  @ApiProperty({ example: 'cuid123' })
  id: string;

  @ApiProperty({ example: 'Chidi Okafor' })
  name: string;

  @ApiProperty({ example: 'chidi@vemtap.com' })
  email: string;

  @ApiProperty({ example: '+2348022334455', nullable: true })
  phone: string | null;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ example: '2026-01-15T00:00:00.000Z' })
  dateJoined: Date;

  @ApiProperty({ nullable: true, description: 'FK to parent agent — null means this agent is a Manager' })
  managerId: string | null;

  @ApiProperty({ nullable: true, example: 'Azeem Bello' })
  managerName: string | null;

  @ApiProperty({ description: 'Count of active businesses (Network Size)' })
  businessesCount: number;

  @ApiProperty({ description: 'Sum of MRR from active businesses (Revenue Generated)' })
  managedMrr: number;

  @ApiProperty({ description: 'Sum of commission amounts from active businesses' })
  commissionEarned: number;
}

export class AgentListResponseDto {
  @ApiProperty({ type: [AgentResponseDto] })
  agents: AgentResponseDto[];

  @ApiProperty()
  total: number;
}

export class AgentDetailResponseDto extends AgentResponseDto {
  @ApiProperty({ type: [SubordinateBriefDto] })
  subordinates: SubordinateBriefDto[];

  @ApiProperty({ type: [BusinessBriefDto] })
  businesses: BusinessBriefDto[];
}

export class MonthRevenueDto {
  @ApiProperty({ example: 'Jan' })
  month: string;

  @ApiProperty({ example: 850000 })
  revenue: number;
}

export class RevenueTrendResponseDto {
  @ApiProperty({ type: [MonthRevenueDto] })
  months: MonthRevenueDto[];
}
