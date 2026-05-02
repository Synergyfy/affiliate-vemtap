import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

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

export class NetworkStatsResponseDto {
  @ApiProperty()
  directRecruits: number;

  @ApiProperty()
  totalNetworkSize: number;

  @ApiProperty()
  activeRecruits: number;

  @ApiProperty()
  totalNetworkEarnings: number;

  @ApiProperty()
  milestoneProgress: number;

  @ApiProperty()
  nextMilestone: string;
}
