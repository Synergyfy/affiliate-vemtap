import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AnomalyStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAnomalyDto {
  @ApiPropertyOptional({ enum: AnomalyStatus })
  @IsEnum(AnomalyStatus)
  @IsOptional()
  status?: AnomalyStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resolution?: string;
}
