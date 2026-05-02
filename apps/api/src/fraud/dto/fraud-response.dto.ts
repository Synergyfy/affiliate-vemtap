import { ApiProperty } from '@nestjs/swagger';
import { FraudStatus } from '@prisma/client';

export class FraudAlertResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  severity: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: FraudStatus })
  status: FraudStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  resolution?: string;

  @ApiProperty({ required: false })
  resolvedAt?: Date;

  @ApiProperty({ required: false })
  resolvedBy?: string;
}

export class PaginatedFraudAlertResponseDto {
  @ApiProperty({ type: [FraudAlertResponseDto] })
  data: FraudAlertResponseDto[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
