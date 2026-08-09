import { IsString, IsOptional, IsLatitude, IsLongitude } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartWorkDto {
  @ApiPropertyOptional({ description: 'Latitude at work start' })
  @IsOptional()
  @IsLatitude()
  gpsLat?: string;

  @ApiPropertyOptional({ description: 'Longitude at work start' })
  @IsOptional()
  @IsLongitude()
  gpsLng?: string;

  @ApiPropertyOptional({ description: 'Device/session identifier' })
  @IsOptional()
  @IsString()
  device?: string;

  @ApiPropertyOptional({ description: 'Assigned market/territory id' })
  @IsOptional()
  @IsString()
  territoryId?: string;
}

export class EndWorkDto {
  @ApiPropertyOptional({ description: 'Latitude at work end' })
  @IsOptional()
  @IsLatitude()
  gpsLat?: string;

  @ApiPropertyOptional({ description: 'Longitude at work end' })
  @IsOptional()
  @IsLongitude()
  gpsLng?: string;

  @ApiPropertyOptional({ description: 'Optional end-of-day comment' })
  @IsOptional()
  @IsString()
  endComment?: string;
}
