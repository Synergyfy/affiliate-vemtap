import { ApiProperty } from '@nestjs/swagger';
import { PlanType, BusinessStatus } from '@prisma/client';

export class BusinessResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  businessName: string;

  @ApiProperty()
  ownerName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ enum: PlanType })
  planType: PlanType;

  @ApiProperty({ enum: BusinessStatus })
  status: BusinessStatus;

  @ApiProperty()
  subscriptionAmount: number;

  @ApiProperty()
  commissionRate: number;

  @ApiProperty()
  commissionAmount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  paidAt?: Date;

  @ApiProperty()
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
