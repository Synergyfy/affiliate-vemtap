'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Terminal, 
  Database, 
  Server, 
  RefreshCw, 
  Trash2, 
  Search, 
  Play, 
  Pause, 
  X, 
  Cpu, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  Copy, 
  Check,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import AdminLayout from '@/components/admin/AdminLayout';

const ObservabilityChart = dynamic(() => import('@/components/admin/ObservabilityChart'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[256px] w-full flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-2xl">
      <Activity className="w-8 h-8 animate-pulse text-slate-300" />
      <p className="text-xs font-bold uppercase tracking-wider">Initializing performance chart...</p>
    </div>
  ),
});
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/toast';

// Types matching Backend Observability module
interface LogEntry {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  statusCode: number;
  responseTime: number;
  headers?: Record<string, any>;
  query?: Record<string, any>;
  body?: any;
  responseBody?: any;
  user?: { id: string; email: string; role: string };
  traceId?: string;
  error?: { message: string; name?: string; stack?: string };
}

interface ObservabilityStats {
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  slowCount: number;
  criticalCount: number;
  methodDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
  recentTraffic: { timestamp: string; count: number; avgLatency: number }[];
}

// Generate unique trace IDs
const generateTraceId = () => Math.random().toString(16).substring(2, 10) + Math.random().toString(16).substring(2, 10);

// Realistic mock URLs and actions for Sandbox mode
const MOCK_ENDPOINTS = [
  { method: 'GET' as const, url: '/api/v1/affiliates', weight: 4 },
  { method: 'GET' as const, url: '/api/v1/referrals', weight: 3 },
  { method: 'POST' as const, url: '/api/v1/commissions/calculate', weight: 2 },
  { method: 'POST' as const, url: '/api/v1/withdrawals/request', weight: 2 },
  { method: 'GET' as const, url: '/api/v1/fraud/alerts', weight: 1.5 },
  { method: 'GET' as const, url: '/api/v1/dashboard/stats', weight: 4.5 },
  { method: 'PATCH' as const, url: '/api/v1/users/status', weight: 1 },
  { method: 'PUT' as const, url: '/api/v1/settings', weight: 0.5 },
];

const MOCK_EMAILS = [
  'admin@vemtap.com',
  'affiliate.star@gmail.com',
  'grow.partner@outlook.com',
  'supervisor.john@vemtap.com',
  'lead.builder@yahoo.com'
];

// Generate single random realistic log entry
const generateMockLog = (): LogEntry => {
  const endpoint = MOCK_ENDPOINTS[Math.floor(Math.random() * MOCK_ENDPOINTS.length)];
  const durationRandom = Math.random();
  
  // Latency profiles: 85% fast, 12% slow, 3% critical/timeout
  let responseTime = Math.round(50 + Math.random() * 200);
  if (durationRandom > 0.85 && durationRandom <= 0.97) {
    responseTime = Math.round(1000 + Math.random() * 800); // SLOW (1s - 1.8s)
  } else if (durationRandom > 0.97) {
    responseTime = Math.round(3000 + Math.random() * 2500); // CRITICAL (3s - 5.5s)
  }

  // Error profiles: 94% success (2xx/3xx), 4% client error (4xx), 2% server error (5xx)
  const statusRandom = Math.random();
  let statusCode = 200;
  if (endpoint.method === 'POST') statusCode = 210; // Created
  
  if (statusRandom > 0.94 && statusRandom <= 0.98) {
    statusCode = [400, 401, 403, 404][Math.floor(Math.random() * 4)];
  } else if (statusRandom > 0.98) {
    statusCode = [500, 502, 503][Math.floor(Math.random() * 3)];
  }

  // Details
  const userRandom = Math.random();
  const user = userRandom > 0.3 ? {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    email: MOCK_EMAILS[Math.floor(Math.random() * MOCK_EMAILS.length)],
    role: userRandom > 0.85 ? 'ADMIN' : 'AFFILIATE'
  } : undefined;

  let error: LogEntry['error'];
  if (statusCode >= 400) {
    const errorMessages: Record<number, string> = {
      400: 'Validation failed: Amount exceeds maximum daily payout limit',
      401: 'Authentication credentials expired or invalid',
      403: 'Access denied: Insufficient role permissions for this operation',
      404: 'The requested resource could not be located',
      500: 'Database connection pools depleted under peak system load',
      502: 'Gateway timeout: Upstream application server unresponsive',
      503: 'Service unavailable: Temporary rate-limit throttling engaged'
    };
    error = {
      name: statusCode >= 500 ? 'SystemCriticalException' : 'BadRequestException',
      message: errorMessages[statusCode] || 'An unexpected API exception occurred',
      stack: `Error: ${errorMessages[statusCode] || 'API Error'}\n    at processRequest (/app/dist/main.js:142:25)\n    at dispatch (/app/node_modules/nestjs/core.js:42:12)\n    at next (/app/node_modules/express/router.js:18:2)\n    at systemRun (/app/dist/main.js:88:5)`
    };
  }

  const queryParams = endpoint.method === 'GET' && Math.random() > 0.5 
    ? { limit: '50', page: '1', search: 'payout', status: 'ACTIVE' }
    : undefined;

  const payload = endpoint.method !== 'GET' && Math.random() > 0.3
    ? { 
        amount: Math.round(5000 + Math.random() * 150000), 
        currency: 'NGN', 
        bankCode: '058', 
        accountNumber: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        description: 'Vemtap payouts program batch execution' 
      }
    : undefined;

  const responsePayload = statusCode < 400 
    ? { success: true, timestamp: new Date().toISOString(), payload: { count: Math.round(Math.random() * 100), items: [] } }
    : { success: false, statusCode, message: error?.message };

  return {
    id: 'log_' + Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    method: endpoint.method,
    url: endpoint.url,
    statusCode,
    responseTime,
    headers: {
      'host': 'api.vemtap.com',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
      'accept': 'application/json',
      'x-request-id': generateTraceId(),
      'x-forwarded-for': `197.210.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    },
    query: queryParams,
    body: payload,
    responseBody: responsePayload,
    user,
    traceId: generateTraceId(),
    error
  };
};

export default function ObservabilityDashboard() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Mode: LIVE or SANDBOX
  const [sandboxMode, setSandboxMode] = useState<boolean>(false);
  const [liveStreamActive, setLiveStreamActive] = useState<boolean>(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'ALL' | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | '2XX' | '3XX' | '4XX' | '5XX'>('ALL');
  const [selectedSpeed, setSelectedSpeed] = useState<'ALL' | 'SLOW' | 'CRITICAL'>('ALL');
  const [page, setPage] = useState(1);

  // Active Selected Log for Drawer
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'headers' | 'payload' | 'response' | 'error'>('overview');

  // Copy support state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Local sandbox data store
  const [sandboxLogs, setSandboxLogs] = useState<LogEntry[]>([]);
  const sandboxStatsRef = useRef<ObservabilityStats>({
    totalRequests: 0,
    avgResponseTime: 0,
    errorRate: 0,
    slowCount: 0,
    criticalCount: 0,
    methodDistribution: {},
    statusDistribution: {},
    recentTraffic: [],
  });

  // Load initial sandbox dataset
  useEffect(() => {
    if (sandboxMode && sandboxLogs.length === 0) {
      const logsList: LogEntry[] = [];
      const now = Date.now();
      // Backfill 80 logs with simulated past timestamps
      for (let i = 80; i > 0; i--) {
        const mock = generateMockLog();
        mock.timestamp = new Date(now - i * 30000).toISOString();
        logsList.push(mock);
      }
      setSandboxLogs(logsList);
    }
  }, [sandboxMode, sandboxLogs.length]);

  // Periodic sandbox ticker to simulate incoming real-time requests (every 2.5s)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (sandboxMode && liveStreamActive) {
      interval = setInterval(() => {
        const newLog = generateMockLog();
        setSandboxLogs((prev) => {
          const next = [newLog, ...prev];
          if (next.length > 500) next.pop(); // Keep within circular buffer limit
          return next;
        });
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sandboxMode, liveStreamActive]);

  // Computes Stats dynamically from local Sandbox logs
  const getComputedSandboxStats = (): ObservabilityStats => {
    const entries = sandboxLogs;
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

    // Bucket into minute segments for Recharts AreaChart (last 10 buckets)
    const buckets: Record<string, { count: number; totalLatency: number }> = {};
    const recent = [...entries].reverse().slice(-50); // Take chronological order of last 50
    
    for (const e of recent) {
      const date = new Date(e.timestamp);
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${(Math.floor(date.getSeconds() / 15) * 15).toString().padStart(2, '0')}`;
      if (!buckets[timeStr]) buckets[timeStr] = { count: 0, totalLatency: 0 };
      buckets[timeStr].count++;
      buckets[timeStr].totalLatency += e.responseTime;
    }

    const recentTraffic = Object.entries(buckets).map(([timestamp, d]) => ({
      timestamp,
      count: d.count,
      avgLatency: Math.round(d.totalLatency / d.count),
    })).slice(-15); // Show latest 15 segments

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
  };

  // Real API Data fetching queries via React Query
  const { data: serverLogsResponse, isLoading: isLogsLoading } = useQuery({
    queryKey: ['observability', 'logs', searchTerm, selectedMethod, selectedStatus, selectedSpeed, page],
    queryFn: () => {
      const qp = new URLSearchParams();
      if (searchTerm) qp.append('search', searchTerm);
      if (selectedMethod !== 'ALL') qp.append('method', selectedMethod);
      if (selectedStatus !== 'ALL') qp.append('statusClass', selectedStatus);
      if (selectedSpeed !== 'ALL') qp.append('speed', selectedSpeed);
      qp.append('page', String(page));
      qp.append('limit', '50');
      return api.get(`/v1/observability/logs?${qp.toString()}`);
    },
    enabled: !sandboxMode
  });

  const { data: serverStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['observability', 'stats'],
    queryFn: () => api.get<ObservabilityStats>('/v1/observability/stats'),
    refetchInterval: liveStreamActive && !sandboxMode ? 5000 : false, // Poll stats every 5s if active
    enabled: !sandboxMode
  });

  // Real-time EventSource connection for live stream
  useEffect(() => {
    if (sandboxMode || !liveStreamActive) return;

    let eventSource: EventSource | null = null;
    try {
      // Connect to SSE stream
      eventSource = new EventSource('/api/v1/observability/stream', {
        withCredentials: true
      });

      eventSource.onmessage = (event) => {
        try {
          const newLog: LogEntry = JSON.parse(event.data);
          // Manually update log cache in query client to show new log instantly
          queryClient.setQueryData(['observability', 'logs', searchTerm, selectedMethod, selectedStatus, selectedSpeed, page], (oldData: any) => {
            if (!oldData || !oldData.data) return oldData;
            return {
              ...oldData,
              data: [newLog, ...oldData.data.slice(0, 49)] // Prepend and slice to maintain length
            };
          });
          // Stats are fetched periodically (every 5s) by React Query's refetchInterval when active.
          // Invalidation here is disabled to avoid flooding the server with HTTP requests on every SSE event.
        } catch (err) {
          console.error('Failed to parse SSE payload', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE Connection failed. Will automatically retry...', err);
      };
    } catch (err) {
      console.error('EventSource connection error:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [sandboxMode, liveStreamActive, queryClient, searchTerm, selectedMethod, selectedStatus, selectedSpeed, page]);

  // Clear in-memory logs mutation
  const clearLogsMutation = useMutation({
    mutationFn: () => api.delete('/v1/observability/logs'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observability'] });
      showToast('System observability circular buffer cleared successfully.', 'success');
    },
    onError: () => {
      showToast('Failed to clear observability buffer.', 'error');
    }
  });

  // Handle clear triggers
  const handleClearBuffer = () => {
    if (sandboxMode) {
      setSandboxLogs([]);
      showToast('Sandbox circular buffer cleared.', 'info');
    } else {
      clearLogsMutation.mutate();
    }
  };

  // Compile Active Logs
  let logs: LogEntry[] = [];
  let stats: ObservabilityStats = {
    totalRequests: 0,
    avgResponseTime: 0,
    errorRate: 0,
    slowCount: 0,
    criticalCount: 0,
    methodDistribution: {},
    statusDistribution: {},
    recentTraffic: [],
  };
  let totalLogsCount = 0;
  let totalPagesCount = 1;

  if (sandboxMode) {
    // Filter locally
    let filtered = [...sandboxLogs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.url.toLowerCase().includes(term) ||
          e.method.toLowerCase().includes(term) ||
          String(e.statusCode).includes(term) ||
          e.traceId?.toLowerCase().includes(term) ||
          (e.error && e.error.message.toLowerCase().includes(term))
      );
    }

    if (selectedMethod !== 'ALL') {
      filtered = filtered.filter((e) => e.method === selectedMethod);
    }

    if (selectedStatus !== 'ALL') {
      const prefix = selectedStatus.charAt(0);
      filtered = filtered.filter((e) => String(e.statusCode).startsWith(prefix));
    }

    if (selectedSpeed !== 'ALL') {
      filtered = filtered.filter((e) => {
        if (selectedSpeed === 'SLOW') return e.responseTime >= 1000;
        if (selectedSpeed === 'CRITICAL') return e.responseTime >= 3000;
        return true;
      });
    }

    totalLogsCount = filtered.length;
    totalPagesCount = Math.ceil(totalLogsCount / 20);
    const startIdx = (page - 1) * 20;
    logs = filtered.slice(startIdx, startIdx + 20);
    stats = getComputedSandboxStats();
  } else {
    // Read from queries
    logs = serverLogsResponse?.data || [];
    stats = serverStats || stats;
    totalLogsCount = serverLogsResponse?.meta?.total || 0;
    totalPagesCount = serverLogsResponse?.meta?.totalPages || 1;
  }

  // Helpers to color HTTP Methods
  const getMethodStyles = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'POST': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'PUT': return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'DELETE': return 'bg-rose-50 text-rose-600 border border-rose-100';
      case 'PATCH': return 'bg-purple-50 text-purple-600 border border-purple-100';
      default: return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-emerald-500';
    if (status >= 300 && status < 400) return 'bg-blue-500';
    if (status >= 400 && status < 500) return 'bg-amber-500';
    return 'bg-rose-500 animate-pulse';
  };

  const getSpeedLabel = (ms: number) => {
    if (ms < 300) return { text: 'Lightning', color: 'text-emerald-500 bg-emerald-50 border border-emerald-100' };
    if (ms >= 300 && ms < 1000) return { text: 'Nominal', color: 'text-slate-500 bg-slate-50 border border-slate-100' };
    if (ms >= 1000 && ms < 3000) return { text: 'Slow API', color: 'text-amber-500 bg-amber-50 border border-amber-100' };
    return { text: 'Critical Latency', color: 'text-rose-600 bg-rose-50 border border-rose-100 animate-pulse' };
  };

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`${field} copied to clipboard`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <AdminLayout>
      <div className="space-y-8 font-sans antialiased text-slate-800">
        
        {/* TOP STATUS AND MODE CONTROLLER BAR */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  liveStreamActive ? "bg-emerald-400" : "bg-slate-400"
                )}></span>
                <span className={cn(
                  "relative inline-flex rounded-full h-2.5 w-2.5",
                  liveStreamActive ? "bg-emerald-500" : "bg-slate-500"
                )}></span>
              </span>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {sandboxMode ? 'Offline Sandbox Mode' : liveStreamActive ? 'Connected Live SSE Stream' : 'Live Stream Suspended'}
              </p>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-600" />
              Observability Intelligence Command
            </h2>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Real / Sandbox Toggle */}
            <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1.5">
              <button
                onClick={() => {
                  setSandboxMode(false);
                  showToast('Switched to live backend observability data.', 'info');
                }}
                className={cn(
                  "px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                  !sandboxMode 
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20" 
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                Live Production
              </button>
              <button
                onClick={() => {
                  setSandboxMode(true);
                  showToast('Switched to high-traffic sandbox simulation.', 'info');
                }}
                className={cn(
                  "px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                  sandboxMode 
                    ? "bg-slate-900 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                Sandbox
              </button>
            </div>

            {/* Stream Active Toggle */}
            <button
              onClick={() => setLiveStreamActive(!liveStreamActive)}
              className={cn(
                "p-2.5 rounded-xl border transition-all flex items-center gap-2",
                liveStreamActive 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100" 
                  : "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200"
              )}
              title={liveStreamActive ? 'Pause stream' : 'Resume stream'}
            >
              {liveStreamActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-emerald-600" />}
              <span className="text-xs font-black uppercase tracking-wider">{liveStreamActive ? 'Streaming' : 'Paused'}</span>
            </button>

            {/* Clear logs */}
            <button
              onClick={handleClearBuffer}
              className="p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all flex items-center gap-2"
              title="Clear circular buffer"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-wider">Flush Log Buffer</span>
            </button>
          </div>
        </div>

        {/* 4 STAGGERED KPI STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Traffic */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Total Requests</span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.totalRequests.toLocaleString()}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                Active circular buffer
              </p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Server className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Card 2: Latency */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Avg Response Velocity</span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.avgResponseTime} <span className="text-xs text-slate-400 font-medium">ms</span>
              </h3>
              <span className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full inline-block",
                stats.avgResponseTime < 300 ? "text-emerald-600 bg-emerald-50 border border-emerald-100" :
                stats.avgResponseTime < 1000 ? "text-slate-500 bg-slate-50 border border-slate-100" : "text-rose-600 bg-rose-50"
              )}>
                {stats.avgResponseTime < 300 ? 'Lightning Velocity' : stats.avgResponseTime < 1000 ? 'Nominal Speed' : 'System Degradation'}
              </span>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Card 3: Reliability */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">System Reliability</span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {(100 - stats.errorRate).toFixed(1)}<span className="text-xs text-slate-400 font-medium">%</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                {stats.errorRate === 0 ? (
                  <span className="text-emerald-500 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" /> No active incidents
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 animate-bounce" /> {stats.errorRate}% Failure rate
                  </span>
                )}
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Card 4: Slow calls */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Latency Overages</span>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.slowCount} <span className="text-xs text-slate-400 font-medium">slow</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold">
                Critical (&gt;3s): <span className="font-bold text-rose-500">{stats.criticalCount}</span>
              </p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
          </motion.div>
        </div>

        {/* METRICS CHARTS (RECHARTS AREA CHART) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Performance Analysis</span>
              <h3 className="text-base font-bold text-slate-900">Traffic & Response Velocity Trend</h3>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-blue-500 opacity-80 inline-block"></span>
                <span>Throughput (req/bucket)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-indigo-500 inline-block"></span>
                <span>Avg Latency (ms)</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full relative">
            {isMounted ? (
              <ObservabilityChart data={stats.recentTraffic} />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-2xl">
                <Activity className="w-8 h-8 animate-pulse text-slate-300" />
                <p className="text-xs font-bold uppercase tracking-wider">
                  Initializing performance chart...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* LOG FILTER TOOLBAR */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-grow max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs by URI, method, status code, trace ID, user email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-medium"
              />
            </div>
            
            {/* Filter pills description */}
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest self-center">
              Active Logs filtered: <span className="text-slate-900 font-black">{totalLogsCount}</span>
            </span>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            
            {/* HTTP Method Pills */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">HTTP Method</span>
              <div className="flex items-center gap-1 flex-wrap">
                {(['ALL', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => {
                      setSelectedMethod(method);
                      setPage(1);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all cursor-pointer",
                      selectedMethod === method
                        ? "bg-slate-900 text-white shadow-sm scale-102"
                        : "bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Class Pills */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Status Range</span>
              <div className="flex items-center gap-1 flex-wrap">
                {(['ALL', '2XX', '3XX', '4XX', '5XX'] as const).map((stat) => (
                  <button
                    key={stat}
                    onClick={() => {
                      setSelectedStatus(stat);
                      setPage(1);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all cursor-pointer",
                      selectedStatus === stat
                        ? "bg-slate-900 text-white shadow-sm scale-102"
                        : "bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    {stat}
                  </button>
                ))}
              </div>
            </div>

            {/* Latency Threshold Pills */}
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Latency Threshold</span>
              <div className="flex items-center gap-1 flex-wrap">
                {(['ALL', 'SLOW', 'CRITICAL'] as const).map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      setSelectedSpeed(speed);
                      setPage(1);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all cursor-pointer",
                      selectedSpeed === speed
                        ? "bg-rose-600 text-white shadow-sm border border-rose-700 font-black"
                        : "bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    {speed === 'ALL' ? 'ALL SPEEDS' : speed === 'SLOW' ? 'SLOW (>1s)' : 'CRITICAL (>3s)'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* LIVE LOGS TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[300px] relative">
            {(!sandboxMode && isLogsLoading) && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 gap-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading stream logs...</p>
              </div>
            )}

            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Method</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">URI Endpoint</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-center">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Response Latency</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Active User</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Trace ID</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Captured</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <AnimatePresence mode="popLayout">
                  {logs.length > 0 ? (
                    logs.map((log) => {
                      const speed = getSpeedLabel(log.responseTime);
                      return (
                        <motion.tr
                          layoutId={log.id}
                          key={log.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                          onClick={() => {
                            setSelectedLog(log);
                            setActiveTab('overview');
                          }}
                          className={cn(
                            "hover:bg-slate-50/70 transition-all cursor-pointer group",
                            selectedLog?.id === log.id ? "bg-blue-50/50 hover:bg-blue-50" : "",
                            log.statusCode >= 500 ? "bg-rose-50/20 hover:bg-rose-50/40" : ""
                          )}
                        >
                          {/* Method */}
                          <td className="p-4">
                            <span className={cn(
                              "text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider block w-fit shadow-xs",
                              getMethodStyles(log.method)
                            )}>
                              {log.method}
                            </span>
                          </td>

                          {/* URI URL */}
                          <td className="p-4 max-w-xs xl:max-w-md">
                            <div className="flex flex-col">
                              <span className="font-mono text-xs font-bold text-slate-900 select-all truncate block">
                                {log.url}
                              </span>
                              {log.error && (
                                <span className="text-[10px] text-rose-500 font-semibold truncate block mt-0.5">
                                  {log.error.name}: {log.error.message}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className={cn("h-2 w-2 rounded-full", getStatusColor(log.statusCode))}></span>
                              <span className="font-mono text-xs font-bold text-slate-800">{log.statusCode}</span>
                            </div>
                          </td>

                          {/* Latency */}
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-slate-900">{log.responseTime}ms</span>
                              <span className={cn(
                                "text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-95",
                                speed.color
                              )}>
                                {speed.text}
                              </span>
                            </div>
                          </td>

                          {/* User */}
                          <td className="p-4">
                            <span className="text-xs font-bold text-slate-700 block truncate max-w-[120px]">
                              {log.user ? log.user.email : <span className="text-slate-400 italic">anonymous</span>}
                            </span>
                          </td>

                          {/* Trace ID */}
                          <td className="p-4">
                            <span className="font-mono text-[10px] font-medium text-slate-400">
                              {log.traceId ? log.traceId.slice(0, 10) + '...' : 'none'}
                            </span>
                          </td>

                          {/* Captured */}
                          <td className="p-4 text-right">
                            <span className="text-xs text-slate-400 font-semibold block">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-slate-400">
                        <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3 animate-pulse" />
                        <h4 className="font-black uppercase tracking-wider text-xs text-slate-400">No Observability Logs Found</h4>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto">No traffic captured within these parameters. Toggle Sandbox mode or run network calls to register traffic.</p>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Page {page} of {totalPagesCount || 1}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPagesCount}
                onClick={() => setPage((p) => p + 1)}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* LOG DETAILS SIDE DRAWER */}
        <AnimatePresence>
          {selectedLog && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedLog(null)}
                className="fixed inset-0 bg-slate-900 z-[250] backdrop-blur-xs"
              />

              {/* Spring Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[260] overflow-y-auto border-l border-slate-200 flex flex-col"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
                  <div className="space-y-1.5 flex-grow pr-4">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs",
                        getMethodStyles(selectedLog.method)
                      )}>
                        {selectedLog.method}
                      </span>
                      <span className={cn(
                        "h-2.5 w-2.5 rounded-full inline-block",
                        getStatusColor(selectedLog.statusCode)
                      )}></span>
                      <span className="font-mono text-sm font-black text-slate-900">{selectedLog.statusCode}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">• Captured {new Date(selectedLog.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <h3 className="font-mono text-sm font-black text-slate-900 select-all break-all leading-relaxed">
                      {selectedLog.url}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="p-2 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-slate-900"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Tabs selection bar */}
                <div className="flex border-b border-slate-200 px-4 bg-slate-50/50">
                  {([
                    { id: 'overview', label: 'Telemetry Overview' },
                    { id: 'headers', label: 'Headers & Query' },
                    { id: 'payload', label: 'Request Payload' },
                    { id: 'response', label: 'Response Body' },
                    { id: 'error', label: 'Error Stack', hidden: !selectedLog.error }
                  ] as { id: 'overview' | 'headers' | 'payload' | 'response' | 'error'; label: string; hidden?: boolean }[]).map((tab) => {
                    if (tab.hidden) return null;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "px-4 py-3.5 text-xs font-bold transition-all border-b-2 cursor-pointer",
                          activeTab === tab.id
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-slate-400 hover:text-slate-700"
                        )}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab content area */}
                <div className="flex-grow p-6 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Trace Context ID</span>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs font-bold text-slate-800 break-all select-all">{selectedLog.traceId || 'none'}</span>
                              {selectedLog.traceId && (
                                <button
                                  onClick={() => handleCopy('Trace ID', selectedLog.traceId!)}
                                  className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-900 transition-colors"
                                >
                                  {copiedField === 'Trace ID' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Performance Latency</span>
                            <p className="font-mono text-sm font-black text-slate-900">
                              {selectedLog.responseTime} ms
                            </p>
                          </div>
                        </div>

                        {/* User details */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Request Context Principal</h4>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
                            {selectedLog.user ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                                    {selectedLog.user.email.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900 select-all">{selectedLog.user.email}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{selectedLog.user.role}</p>
                                  </div>
                                </div>
                                <div className="border-t border-slate-200/60 pt-2.5 flex justify-between text-[10px] font-medium text-slate-500">
                                  <span>User ID: <code className="font-mono font-bold select-all">{selectedLog.user.id}</code></span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic">No user Principal attached to this thread context (Public Anonymous request).</p>
                            )}
                          </div>
                        </div>

                        {/* Summary breakdown of log */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Captured Metadata Summary</h4>
                          <div className="p-5 rounded-2xl border border-slate-200/80 bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed space-y-2 select-text shadow-inner">
                            <p><span className="text-blue-400">Timestamp:</span> {selectedLog.timestamp}</p>
                            <p><span className="text-purple-400">Endpoint:</span> [{selectedLog.method}] {selectedLog.url}</p>
                            <p>
                              <span className="text-emerald-400">Execution Status:</span> {selectedLog.statusCode}{' '}
                              {selectedLog.statusCode >= 200 && selectedLog.statusCode < 300 ? '✅ Success' : '❌ Failure'}
                            </p>
                            <p><span className="text-amber-400">Memory latency:</span> {selectedLog.responseTime}ms</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* HEADERS & QUERY TAB */}
                    {activeTab === 'headers' && (
                      <motion.div
                        key="headers"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-6"
                      >
                        {/* Query Params */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">URL Query Parameters</h4>
                          {selectedLog.query && Object.keys(selectedLog.query).length > 0 ? (
                            <div className="overflow-hidden border border-slate-200 rounded-2xl divide-y divide-slate-100">
                              {Object.entries(selectedLog.query).map(([key, val]) => (
                                <div key={key} className="flex p-3 text-xs">
                                  <span className="w-1/3 font-mono font-bold text-slate-500 select-all">{key}</span>
                                  <span className="w-2/3 font-mono text-slate-950 select-all break-all font-semibold">{String(val)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No query variables captured in URL path.</p>
                          )}
                        </div>

                        {/* Headers */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sanitized HTTP Headers</h4>
                          {selectedLog.headers && Object.keys(selectedLog.headers).length > 0 ? (
                            <div className="overflow-hidden border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white">
                              {Object.entries(selectedLog.headers).map(([key, val]) => (
                                <div key={key} className="flex p-3.5 text-xs hover:bg-slate-50/50 transition-colors">
                                  <span className="w-1/3 font-mono font-bold text-slate-500 capitalize select-all">{key}</span>
                                  <span className="w-2/3 font-mono text-slate-950 select-all break-all font-semibold">{String(val)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No headers captured.</p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* REQUEST PAYLOAD TAB */}
                    {activeTab === 'payload' && (
                      <motion.div
                        key="payload"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-4 h-full flex flex-col"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">HTTP Request JSON Body</h4>
                          {selectedLog.body && (
                            <button
                              onClick={() => handleCopy('Payload', JSON.stringify(selectedLog.body, null, 2))}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {copiedField === 'Payload' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedField === 'Payload' ? 'Copied' : 'Copy'}</span>
                            </button>
                          )}
                        </div>
                        {selectedLog.body ? (
                          <pre className="p-5 rounded-2xl border border-slate-200 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto overflow-y-auto max-h-[450px] shadow-inner select-text">
                            <code>{JSON.stringify(selectedLog.body, null, 2)}</code>
                          </pre>
                        ) : (
                          <p className="text-xs text-slate-400 italic">Empty body (GET, DELETE, or bodyless request).</p>
                        )}
                      </motion.div>
                    )}

                    {/* RESPONSE BODY TAB */}
                    {activeTab === 'response' && (
                      <motion.div
                        key="response"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Returned JSON Response Payload</h4>
                          {selectedLog.responseBody && (
                            <button
                              onClick={() => handleCopy('Response', JSON.stringify(selectedLog.responseBody, null, 2))}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {copiedField === 'Response' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedField === 'Response' ? 'Copied' : 'Copy'}</span>
                            </button>
                          )}
                        </div>
                        {selectedLog.responseBody ? (
                          <pre className="p-5 rounded-2xl border border-slate-200 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-[450px] shadow-inner select-text">
                            <code>{JSON.stringify(selectedLog.responseBody, null, 2)}</code>
                          </pre>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No response body captured.</p>
                        )}
                      </motion.div>
                    )}

                    {/* ERROR STACK TAB */}
                    {activeTab === 'error' && selectedLog.error && (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-4"
                      >
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-bold text-rose-800">{selectedLog.error.name}</h4>
                            <p className="text-xs text-rose-600 font-semibold mt-0.5">{selectedLog.error.message}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Thread Call Stack</h4>
                          <button
                            onClick={() => handleCopy('Error Stack', selectedLog.error?.stack || '')}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-black uppercase tracking-wider text-rose-600 hover:text-rose-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            {copiedField === 'Error Stack' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedField === 'Error Stack' ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>

                        {selectedLog.error.stack ? (
                          <pre className="p-5 rounded-2xl border border-rose-100 bg-slate-950 text-rose-400 font-mono text-xs overflow-x-auto overflow-y-auto max-h-[400px] shadow-inner select-text">
                            <code>{selectedLog.error.stack}</code>
                          </pre>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No stack trace available in production environments.</p>
                        )}
                      </motion.div>
                    )}

                  </AnimatePresence>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}
