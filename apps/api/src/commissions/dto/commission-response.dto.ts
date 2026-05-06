import { ApiProperty } from "@nestjs/swagger";
import { CommissionType, CommissionStatus } from "@prisma/client";

export class CommissionResponseDto {
  @ApiProperty({
    description: "Unique commission identifier",
    example: "commission-uuid",
  })
  id: string;

  @ApiProperty({ description: "Commission amount in kobo", example: 45000 })
  amount: number;

  @ApiProperty({
    enum: CommissionType,
    description: "Type of commission",
    example: CommissionType.DIRECT,
  })
  type: CommissionType;

  @ApiProperty({
    enum: CommissionStatus,
    description: "Current commission status",
    example: CommissionStatus.PAID,
  })
  status: CommissionStatus;

  @ApiProperty({
    description: "Description of the commission source",
    example: "Commission from Vemtap Solutions (BASIC plan)",
  })
  description: string;

  @ApiProperty({
    description: "Commission creation date",
    example: "2026-05-01T10:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Date when commission was paid",
    required: false,
    example: "2026-06-01T10:00:00.000Z",
  })
  paidAt?: Date;

  @ApiProperty({ description: "Affiliate user ID", example: "user-uuid" })
  userId: string;

  @ApiProperty({
    description: "Associated business ID",
    example: "business-uuid",
  })
  businessId: string;

  @ApiProperty({
    description: "Sub-affiliate who earned override commission",
    required: false,
    example: "manager-uuid",
  })
  subAffiliateId?: string;
}

export class PaginatedCommissionResponseDto {
  @ApiProperty({
    type: [CommissionResponseDto],
    description: "Array of commission objects",
  })
  data: CommissionResponseDto[];

  @ApiProperty({
    description: "Pagination metadata",
    example: { total: 100, page: 1, limit: 10, totalPages: 10 },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
