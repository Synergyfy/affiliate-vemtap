import { ApiProperty } from '@nestjs/swagger';
import { PlanType, BusinessStatus } from '@prisma/client';

export class BusinessResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'Vemtap Solutions' })
  businessName: string;

  @ApiProperty({ example: 'John Owner' })
  ownerName: string;

  @ApiProperty({ example: 'owner@example.com' })
  email: string;

  @ApiProperty({ example: '08012345678' })
  phone: string;

  @ApiProperty({ enum: PlanType, example: PlanType.BASIC })
  planType: PlanType;

  @ApiProperty({ enum: BusinessStatus, example: BusinessStatus.TRIAL })
  status: BusinessStatus;

  @ApiProperty({ example: 3000 })
  subscriptionAmount: number;

  @ApiProperty({ example: 0.2 })
  commissionRate: number;

  @ApiProperty({ example: 450 })
  commissionAmount: number;

  @ApiProperty({ example: '2026-05-01T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ required: false, example: '2026-05-01T12:00:00Z' })
  paidAt?: Date;

  @ApiProperty({ example: 'affiliate-uuid' })
  affiliateId: string;
}

export class PaginatedBusinessResponseDto {
  @ApiProperty({ type: [BusinessResponseDto] })
  data: BusinessResponseDto[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
