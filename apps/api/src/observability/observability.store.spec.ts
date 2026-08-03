import { ObservabilityStoreService } from './observability.store';
import { HttpMethod, LogEntryDto, StatusClass } from './dto/observability.dto';

const createLog = (overrides: Partial<LogEntryDto> = {}): LogEntryDto => ({
  id: 'log-1',
  timestamp: new Date().toISOString(),
  method: 'GET',
  url: '/api/v1/health',
  statusCode: 200,
  responseTime: 100,
  ...overrides,
});

describe('ObservabilityStoreService', () => {
  it('starts empty and only contains captured logs', () => {
    const store = new ObservabilityStoreService();

    expect(store.getLogs({ page: 1, limit: 50 })).toEqual({
      data: [],
      meta: { total: 0, page: 1, limit: 50, totalPages: 0 },
    });
  });

  it('computes statistics from captured logs', () => {
    const store = new ObservabilityStoreService();
    store.addLog(createLog({ id: 'success', responseTime: 100 }));
    store.addLog(
      createLog({
        id: 'failure',
        method: 'POST',
        statusCode: 500,
        responseTime: 3500,
      }),
    );

    expect(store.getStats()).toMatchObject({
      totalRequests: 2,
      avgResponseTime: 1800,
      errorRate: 50,
      slowCount: 1,
      criticalCount: 1,
      methodDistribution: { GET: 1, POST: 1 },
      statusDistribution: { '2XX': 1, '5XX': 1 },
    });
  });

  it('clears captured logs without creating replacement entries', () => {
    const store = new ObservabilityStoreService();
    store.addLog(createLog());

    store.clear();

    expect(store.getStats().totalRequests).toBe(0);
    expect(store.getLogs({ page: 1, limit: 50 }).data).toEqual([]);
  });

  it('applies live log filters and pagination', () => {
    const store = new ObservabilityStoreService();
    store.addLog(createLog({ id: 'get', method: 'GET' }));
    store.addLog(createLog({ id: 'slow-post', method: 'POST', responseTime: 1500 }));
    store.addLog(createLog({ id: 'failed-post', method: 'POST', statusCode: 422 }));

    const result = store.getLogs({
      method: HttpMethod.POST,
      statusClass: StatusClass._4XX,
      page: 1,
      limit: 1,
    });

    expect(result.data.map(({ id }) => id)).toEqual(['failed-post']);
    expect(result.meta).toEqual({ total: 1, page: 1, limit: 1, totalPages: 1 });
  });

  it('ignores invalid timestamps when building recent traffic', () => {
    const store = new ObservabilityStoreService();
    store.addLog(createLog({ timestamp: 'not-a-timestamp' }));

    expect(() => store.getStats()).not.toThrow();
    expect(store.getStats().totalRequests).toBe(1);
    expect(store.getStats().recentTraffic).toEqual([]);
  });
});
