import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { LogEntryDto, QueryLogsDto, ObservabilityStatsDto } from './dto/observability.dto';

const MAX_ENTRIES = 100;

@Injectable()
export class ObservabilityStoreService {
  private buffer: LogEntryDto[] = [];
  private subject = new Subject<LogEntryDto>();

  constructor() {
    this.seedInitialLogs();
  }

  private seedInitialLogs(): void {
    const now = Date.now();
    const systemLogs: LogEntryDto[] = [
      {
        id: 'sys_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date(now - 120000).toISOString(),
        method: 'POST',
        url: '/api/v1/auth/system-bootstrap',
        statusCode: 201,
        responseTime: 145,
        headers: { host: 'api.vemtap.com', 'user-agent': 'VemtapCore/1.0.0' },
        body: { service: 'AffiliateAPI', action: 'BOOTSTRAP', version: '0.1.0' },
        responseBody: { success: true, servicesInitialized: ['Prisma', 'Redis', 'Observability', 'Storage'] },
        traceId: 'trace_boot_' + Math.random().toString(16).substring(2, 10),
      },
      {
        id: 'sys_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date(now - 90000).toISOString(),
        method: 'GET',
        url: '/api/health',
        statusCode: 200,
        responseTime: 8,
        headers: { host: 'api.vemtap.com', 'user-agent': 'VemtapHealthMonitor/1.0' },
        responseBody: { status: 'ok', database: 'connected', redis: 'connected' },
        traceId: 'trace_health_' + Math.random().toString(16).substring(2, 10),
      },
      {
        id: 'sys_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date(now - 60000).toISOString(),
        method: 'GET',
        url: '/api/v1/settings',
        statusCode: 200,
        responseTime: 18,
        headers: { host: 'api.vemtap.com', 'user-agent': 'Mozilla/5.0' },
        responseBody: { currency: 'NGN', referralRate: 0.1, payoutMin: 5000 },
        traceId: 'trace_settings_' + Math.random().toString(16).substring(2, 10),
      },
      {
        id: 'sys_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date(now - 30000).toISOString(),
        method: 'GET',
        url: '/api/v1/dashboard/stats',
        statusCode: 200,
        responseTime: 54,
        headers: { host: 'api.vemtap.com', 'user-agent': 'Mozilla/5.0' },
        responseBody: { activeAffiliates: 142, pendingWithdrawals: 4, monthlyRevenue: 1250000 },
        traceId: 'trace_dash_' + Math.random().toString(16).substring(2, 10),
      }
    ];

    for (const log of systemLogs) {
      this.buffer.push(log);
    }
  }

  addLog(entry: LogEntryDto): void {
    this.buffer.push(entry);
    if (this.buffer.length > MAX_ENTRIES) {
      this.buffer.shift();
    }
    this.subject.next(entry);
  }

  getLogStream(): Observable<LogEntryDto> {
    return this.subject.asObservable();
  }

  getLogs(query: QueryLogsDto) {
    let filtered = [...this.buffer];

    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.url.toLowerCase().includes(term) ||
          e.method.toLowerCase().includes(term) ||
          String(e.statusCode).includes(term) ||
          e.traceId?.toLowerCase().includes(term),
      );
    }

    if (query.method) {
      filtered = filtered.filter((e) => e.method === query.method);
    }

    if (query.statusClass && query.statusClass !== 'ALL') {
      const classPrefix = query.statusClass.replace('_', '').charAt(0);
      filtered = filtered.filter((e) => String(e.statusCode).startsWith(classPrefix));
    }

    if (query.speed && query.speed !== 'ALL') {
      filtered = filtered.filter((e) => {
        if (query.speed === 'SLOW') return e.responseTime >= 1000;
        if (query.speed === 'CRITICAL') return e.responseTime >= 3000;
        return true;
      });
    }

    const page = query.page || 1;
    const limit = query.limit || 50;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit).reverse();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  getStats(): ObservabilityStatsDto {
    const entries = this.buffer;
    const totalRequests = entries.length;

    if (totalRequests === 0) {
      return {
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 0,
        slowCount: 0,
        criticalCount: 0,
        methodDistribution: {},
        statusDistribution: {},
        recentTraffic: [],
      };
    }

    let totalTime = 0;
    let errors = 0;
    let slowCount = 0;
    let criticalCount = 0;
    const methodDistribution: Record<string, number> = {};
    const statusDistribution: Record<string, number> = {};

    // For bucketing the last 20 entries
    const recentStartIndex = Math.max(0, totalRequests - 20);
    const buckets: Record<string, { count: number; totalLatency: number }> = {};

    for (let i = 0; i < totalRequests; i++) {
      const e = entries[i];
      totalTime += e.responseTime;
      if (e.statusCode >= 400) {
        errors++;
      }
      if (e.responseTime >= 3000) {
        criticalCount++;
        slowCount++;
      } else if (e.responseTime >= 1000) {
        slowCount++;
      }

      methodDistribution[e.method] = (methodDistribution[e.method] || 0) + 1;
      const statusClass = String(e.statusCode).charAt(0) + 'XX';
      statusDistribution[statusClass] = (statusDistribution[statusClass] || 0) + 1;

      // Capture recent traffic for the last 20 entries in the single pass
      if (i >= recentStartIndex) {
        const minute = new Date(e.timestamp).toISOString().slice(0, 16);
        if (!buckets[minute]) buckets[minute] = { count: 0, totalLatency: 0 };
        buckets[minute].count++;
        buckets[minute].totalLatency += e.responseTime;
      }
    }

    const avgResponseTime = Math.round(totalTime / totalRequests);
    const errorRate = Math.round((errors / totalRequests) * 100);

    const recentTraffic = Object.entries(buckets).map(([timestamp, d]) => ({
      timestamp,
      count: d.count,
      avgLatency: Math.round(d.totalLatency / d.count),
    }));

    return {
      totalRequests,
      avgResponseTime,
      errorRate,
      slowCount,
      criticalCount,
      methodDistribution,
      statusDistribution,
      recentTraffic,
    };
  }

  clear(): void {
    this.buffer = [];
  }
}
