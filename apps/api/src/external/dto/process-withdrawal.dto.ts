import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsEmail } from 'class-validator';

export class ProcessWithdrawalDto {
  @ApiProperty({ description: 'Email of the affiliate to withdraw for', example: 'john@affiliate.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Amount to withdraw (NGN)', example: 50000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Bank name for payout', example: 'GTBank' })
  @IsString()
  bankName: string;

  @ApiProperty({ description: 'Bank account number', example: '0123456789' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ description: 'Bank account holder name', example: 'John Doe' })
  @IsString()
  accountName: string;

  @ApiProperty({
    description: 'Unique per-withdrawal reference from Vemtap for idempotency',
    example: 'VEM-WD-2024-001',
  })
  @IsString()
  externalReference: string;
}
