import { IsEnum, IsString, IsOptional, IsObject } from 'class-validator';
import { FraudStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFraudStatusDto {
  @ApiProperty({ enum: FraudStatus })
  @IsEnum(FraudStatus)
  status: FraudStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  resolution?: string;
}
