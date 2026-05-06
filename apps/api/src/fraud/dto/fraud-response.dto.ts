import { ApiProperty } from "@nestjs/swagger";
import { FraudStatus } from "@prisma/client";

export class FraudAlertResponseDto {
  @ApiProperty({
    description: "Unique fraud alert identifier",
    example: "fraud-uuid",
  })
  id: string;

  @ApiProperty({
    description: "User associated with the alert",
    example: "user-uuid",
  })
  userId: string;

  @ApiProperty({
    description: "Type of fraud detected",
    example: "CLICK_FRAUD",
  })
  type: string;

  @ApiProperty({ description: "Alert severity level", example: "HIGH" })
  severity: string;

  @ApiProperty({
    description: "Detailed description of the fraud",
    example:
      "Unusual click pattern detected: 50 clicks from same IP in 5 minutes",
  })
  description: string;

  @ApiProperty({
    enum: FraudStatus,
    description: "Current alert status",
    example: FraudStatus.OPEN,
  })
  status: FraudStatus;

  @ApiProperty({
    description: "Alert creation date",
    example: "2026-05-06T10:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Resolution notes",
    required: false,
    example: "False positive - legitimate marketing campaign",
  })
  resolution?: string;

  @ApiProperty({ description: "Date when alert was resolved", required: false })
  resolvedAt?: Date;

  @ApiProperty({
    description: "Admin who resolved the alert",
    required: false,
    example: "admin-uuid",
  })
  resolvedBy?: string;
}

export class PaginatedFraudAlertResponseDto {
  @ApiProperty({
    type: [FraudAlertResponseDto],
    description: "Array of fraud alert objects",
  })
  data: FraudAlertResponseDto[];

  @ApiProperty({
    description: "Pagination metadata",
    example: { total: 10, page: 1, limit: 10, totalPages: 1 },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
