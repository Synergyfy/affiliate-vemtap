import { ApiProperty } from "@nestjs/swagger";
import { WithdrawalStatus } from "@prisma/client";

export class WithdrawalResponseDto {
  @ApiProperty({
    description: "Unique withdrawal identifier",
    example: "withdrawal-uuid",
  })
  id: string;

  @ApiProperty({ description: "Withdrawal amount in kobo", example: 50000 })
  amount: number;

  @ApiProperty({
    enum: WithdrawalStatus,
    description: "Current withdrawal status",
    example: WithdrawalStatus.PENDING,
  })
  status: WithdrawalStatus;

  @ApiProperty({ description: "Bank name", example: "GTBank" })
  bankName: string;

  @ApiProperty({ description: "Bank account number", example: "0123456789" })
  accountNumber: string;

  @ApiProperty({ description: "Bank account name", example: "John Doe" })
  accountName: string;

  @ApiProperty({
    description: "Request creation date",
    example: "2026-05-06T10:00:00.000Z",
  })
  createdAt: Date;

  @ApiProperty({
    description: "Date when withdrawal was processed",
    required: false,
    example: "2026-05-07T10:00:00.000Z",
  })
  processedAt?: Date;

  @ApiProperty({
    description: "User who requested the withdrawal",
    example: "user-uuid",
  })
  userId: string;
}

export class PaginatedWithdrawalResponseDto {
  @ApiProperty({
    type: [WithdrawalResponseDto],
    description: "Array of withdrawal objects",
  })
  data: WithdrawalResponseDto[];

  @ApiProperty({
    description: "Pagination metadata",
    example: { total: 50, page: 1, limit: 10, totalPages: 5 },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
