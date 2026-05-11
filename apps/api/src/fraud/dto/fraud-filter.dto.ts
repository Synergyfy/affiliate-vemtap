import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FraudStatus, Severity } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class FraudFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: FraudStatus })
  @IsOptional()
  @IsEnum(FraudStatus)
  status?: FraudStatus;

  @ApiPropertyOptional({ enum: Severity })
  @IsOptional()
  @IsEnum(Severity)
  severity?: Severity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
