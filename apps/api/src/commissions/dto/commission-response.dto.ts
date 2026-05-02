import { ApiProperty } from '@nestjs/swagger';
import { CommissionType, CommissionStatus } from '@prisma/client';

export class CommissionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: CommissionType })
  type: CommissionType;

  @ApiProperty({ enum: CommissionStatus })
  status: CommissionStatus;

  @ApiProperty()
  description: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  paidAt?: Date;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  businessId: string;

  @ApiProperty({ required: false })
  subAffiliateId?: string;
}

export class PaginatedCommissionResponseDto {
  @ApiProperty({ type: [CommissionResponseDto] })
  data: CommissionResponseDto[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
