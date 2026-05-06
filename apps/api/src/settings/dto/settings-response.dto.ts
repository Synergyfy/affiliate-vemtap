import { ApiProperty } from '@nestjs/swagger';

export class PlatformSettingsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  directCommissionRate: number;

  @ApiProperty()
  indirectCommissionRate: number;

  @ApiProperty()
  minWithdrawal: number;

  @ApiProperty()
  withdrawalFee: number;

  @ApiProperty()
  subAffiliateUnlockCount: number;

  @ApiProperty()
  fraudThresholdScore: number;

  @ApiProperty()
  earningDurationMonths: number;

  @ApiProperty()
  updatedAt: Date;
}
