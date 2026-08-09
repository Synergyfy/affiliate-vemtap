import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartWorkDto {
  @ApiPropertyOptional({ description: 'GPS latitude at work start', example: 6.5244 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'GPS longitude at work start', example: 3.3792 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'GPS accuracy in meters', example: 10.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @ApiPropertyOptional({ description: 'GPS permission status from browser', enum: ['GRANTED', 'DENIED', 'UNAVAILABLE', 'UNKNOWN'] })
  @IsOptional()
  @IsString()
  gpsStatus?: 'GRANTED' | 'DENIED' | 'UNAVAILABLE' | 'UNKNOWN';

  @ApiPropertyOptional({ description: 'Optional notes for the work session' })
  @IsOptional()
  @IsString()
  notes?: string;
}
