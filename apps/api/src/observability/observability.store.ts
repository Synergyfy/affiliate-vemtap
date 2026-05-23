import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { LogEntryDto, QueryLogsDto, ObservabilityStatsDto } from './dto/observability.dto';

const MAX_ENTRIES = 500;

@Injectable()
export class ObservabilityStoreService {
  private buffer: LogEntryDto[] = [];
  private subject = new Subject<LogEntryDto>();

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

    return { data, total, page, limit, totalPages };
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

    const totalTime = entries.reduce((sum, e) => sum + e.responseTime, 0);
    const avgResponseTime = Math.round(totalTime / totalRequests);

    const errors = entries.filter((e) => e.statusCode >= 400).length;
    const errorRate = Math.round((errors / totalRequests) * 100);

    const slowCount = entries.filter((e) => e.responseTime >= 1000).length;
    const criticalCount = entries.filter((e) => e.responseTime >= 3000).length;

    const methodDistribution: Record<string, number> = {};
    const statusDistribution: Record<string, number> = {};
    for (const e of entries) {
      methodDistribution[e.method] = (methodDistribution[e.method] || 0) + 1;
      const statusClass = String(e.statusCode).charAt(0) + 'XX';
      statusDistribution[statusClass] = (statusDistribution[statusClass] || 0) + 1;
    }

    const recent = entries.slice(-20);
    const buckets: Record<string, { count: number; totalLatency: number }> = {};
    for (const e of recent) {
      const minute = new Date(e.timestamp).toISOString().slice(0, 16);
      if (!buckets[minute]) buckets[minute] = { count: 0, totalLatency: 0 };
      buckets[minute].count++;
      buckets[minute].totalLatency += e.responseTime;
    }
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
