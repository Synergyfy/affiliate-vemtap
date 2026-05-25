import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export enum StatusClass {
  ALL = 'ALL',
  _2XX = '2XX',
  _3XX = '3XX',
  _4XX = '4XX',
  _5XX = '5XX',
}

export enum SpeedFilter {
  ALL = 'ALL',
  SLOW = 'SLOW',
  CRITICAL = 'CRITICAL',
}

export class QueryLogsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: HttpMethod })
  @IsOptional()
  @IsEnum(HttpMethod)
  method?: HttpMethod;

  @ApiPropertyOptional({ enum: StatusClass })
  @IsOptional()
  @IsEnum(StatusClass)
  statusClass?: StatusClass;

  @ApiPropertyOptional({ enum: SpeedFilter })
  @IsOptional()
  @IsEnum(SpeedFilter)
  speed?: SpeedFilter;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 50;
}

export class LogEntryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  timestamp: string;

  @ApiProperty({ enum: HttpMethod })
  method: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  responseTime: number;

  @ApiPropertyOptional()
  headers?: Record<string, any>;

  @ApiPropertyOptional()
  query?: Record<string, any>;

  @ApiPropertyOptional()
  body?: any;

  @ApiPropertyOptional()
  responseBody?: any;

  @ApiPropertyOptional()
  user?: { id: string; email: string; role: string };

  @ApiPropertyOptional()
  traceId?: string;

  @ApiPropertyOptional()
  error?: { message: string; stack?: string; name?: string };
}

export class PaginatedLogsResponseDto {
  @ApiProperty({ type: [LogEntryDto] })
  data: LogEntryDto[];

  @ApiProperty()
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ObservabilityStatsDto {
  @ApiProperty()
  totalRequests: number;

  @ApiProperty()
  avgResponseTime: number;

  @ApiProperty()
  errorRate: number;

  @ApiProperty()
  slowCount: number;

  @ApiProperty()
  criticalCount: number;

  @ApiProperty()
  methodDistribution: Record<string, number>;

  @ApiProperty()
  statusDistribution: Record<string, number>;

  @ApiProperty()
  recentTraffic: { timestamp: string; count: number; avgLatency: number }[];
}
