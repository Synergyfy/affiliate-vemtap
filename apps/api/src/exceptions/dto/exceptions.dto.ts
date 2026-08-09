import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ExceptionType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExceptionDto {
  @ApiProperty({ enum: ExceptionType })
  @IsEnum(ExceptionType)
  type: ExceptionType;

  @ApiPropertyOptional({ description: 'What happened / context' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Related work session id' })
  @IsOptional()
  @IsUUID()
  workSessionId?: string;

  @ApiPropertyOptional({ description: 'Related visit id' })
  @IsOptional()
  @IsUUID()
  visitId?: string;
}

export class ReviewExceptionDto {
  @ApiProperty({ enum: ['VALID', 'INVALID'] })
  @IsEnum(['VALID', 'INVALID'])
  status: 'VALID' | 'INVALID';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewComment?: string;
}
