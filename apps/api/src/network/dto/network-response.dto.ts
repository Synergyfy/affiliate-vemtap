import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { IsEnum, IsString, IsNotEmpty } from 'class-validator';

export class NetworkRecruitResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  totalEarnings: number;

  @ApiProperty()
  referralCount: number;

  @ApiProperty()
  businessCount: number;

  @ApiProperty({ description: '10% of the recruit\'s total business volume' })
  managerShare: number;
}

export class PaginatedNetworkRecruitResponseDto {
  @ApiProperty({ type: [NetworkRecruitResponseDto] })
  data: NetworkRecruitResponseDto[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class MilestoneInfo {
  @ApiProperty()
  current: number;

  @ApiProperty()
  target: number;

  @ApiProperty()
  isReached: boolean;
}

class MilestonesDto {
  @ApiProperty({ type: MilestoneInfo })
  agents: MilestoneInfo;

  @ApiProperty({ type: MilestoneInfo })
  businesses: MilestoneInfo;
}

export class NetworkStatsResponseDto {
  @ApiProperty()
  activeAgentsCount: number;

  @ApiProperty()
  totalNetworkBusinesses: number;

  @ApiProperty({ type: MilestonesDto })
  milestones: MilestonesDto;

  @ApiProperty({ required: false, nullable: true })
  managerQualificationExpiry: Date | null;

  @ApiProperty()
  isManagerMode: boolean;

  @ApiProperty()
  hasClaimedAgentBonus: boolean;

  @ApiProperty()
  hasClaimedBusinessBonus: boolean;
}

export enum BonusType {
  AGENT = 'AGENT',
  BUSINESS = 'BUSINESS',
}

export class ClaimBonusDto {
  @ApiProperty({ enum: BonusType })
  @IsEnum(BonusType)
  @IsNotEmpty()
  type: BonusType;
}
