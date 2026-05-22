import {
  Controller,
  Get,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Sse,
  Header,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '@prisma/client';
import { ObservabilityStoreService } from './observability.store';
import {
  QueryLogsDto,
  PaginatedLogsResponseDto,
  ObservabilityStatsDto,
  LogEntryDto,
} from './dto/observability.dto';
import { getMetrics, getMetricsContentType } from './metrics.middleware';

@ApiTags('observability')
@ApiBearerAuth()
@Controller('v1/observability')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class ObservabilityController {
  constructor(private readonly store: ObservabilityStoreService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Get filtered, paginated observability logs' })
  @ApiOkResponse({ type: PaginatedLogsResponseDto })
  getLogs(@Query() query: QueryLogsDto) {
    return this.store.getLogs(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get computed observability KPIs' })
  @ApiOkResponse({ type: ObservabilityStatsDto })
  getStats() {
    return this.store.getStats();
  }

  @Get('stream')
  @ApiOperation({ summary: 'SSE stream of real-time log entries' })
  @Sse()
  stream(): Observable<{ data: LogEntryDto }> {
    return this.store.getLogStream().pipe(map((entry) => ({ data: entry })));
  }

  @Delete('logs')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear all in-memory logs' })
  clearLogs(): void {
    this.store.clear();
  }

  @Get('metrics')
  @Public()
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @Header('Content-Type', getMetricsContentType())
  async getMetrics(): Promise<string> {
    return getMetrics();
  }
}
