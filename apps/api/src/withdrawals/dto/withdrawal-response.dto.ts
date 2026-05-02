import { ApiProperty } from '@nestjs/swagger';
import { WithdrawalStatus } from '@prisma/client';

export class WithdrawalResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: WithdrawalStatus })
  status: WithdrawalStatus;

  @ApiProperty()
  bankName: string;

  @ApiProperty()
  accountNumber: string;

  @ApiProperty()
  accountName: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  processedAt?: Date;

  @ApiProperty()
  userId: string;
}

export class PaginatedWithdrawalResponseDto {
  @ApiProperty({ type: [WithdrawalResponseDto] })
  data: WithdrawalResponseDto[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
