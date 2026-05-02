import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsUUID } from 'class-validator';

export class ProcessWithdrawalDto {
  @ApiProperty({ description: 'The affiliate user ID to create a withdrawal for', example: 'uuid-here' })
  @IsUUID()
  affiliateId: string;

  @ApiProperty({ description: 'Amount to withdraw in kobo (NGN)', example: 50000 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'External reference from Vemtap for audit trail', example: 'VEM-WD-2024-001' })
  @IsString()
  externalReference: string;
}
