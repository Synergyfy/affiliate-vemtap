import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BusinessStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBusinessStatusDto {
  @ApiProperty({ enum: BusinessStatus })
  @IsEnum(BusinessStatus)
  status: BusinessStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
