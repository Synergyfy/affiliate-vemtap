import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

const IS_MOCK = process.env.NEXT_PUBLIC_ADMIN_MOCK === 'true';

export interface SalesWorkSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startLatitude?: number;
  startLongitude?: number;
  startAccuracy?: number;
  endLatitude?: number;
  endLongitude?: number;
  endAccuracy?: number;
  startGpsStatus: 'GRANTED' | 'DENIED' | 'UNAVAILABLE' | 'UNKNOWN';
  endGpsStatus?: 'GRANTED' | 'DENIED' | 'UNAVAILABLE' | 'UNKNOWN';
  notes?: string;
  gpsEventCount?: number;
}

export interface StartWorkPayload {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  gpsStatus?: 'GRANTED' | 'DENIED' | 'UNAVAILABLE' | 'UNKNOWN';
  notes?: string;
}

export interface EndWorkPayload {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  gpsStatus?: 'GRANTED' | 'DENIED' | 'UNAVAILABLE' | 'UNKNOWN';
  notes?: string;
}

export interface SessionHistoryResponse {
  sessions: SalesWorkSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Mock session storage - persists for mock mode session
let mockActiveSession: SalesWorkSession | null = null;
let mockSessions: SalesWorkSession[] = [];

export function useActiveWorkSession() {
  return useQuery<SalesWorkSession | null>({
    queryKey: ['sales-work-session', 'active'],
    queryFn: async () => {
      if (IS_MOCK) {
        return mockActiveSession;
      }
      const response = await api.get('/sales-work-sessions/active');
      return response.data;
    },
    refetchInterval: 30000,
  });
}

export function useStartWork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: StartWorkPayload) => {
      if (IS_MOCK) {
        const session: SalesWorkSession = {
          id: `session-${Date.now()}`,
          startedAt: new Date().toISOString(),
          status: 'ACTIVE',
          startGpsStatus: payload.gpsStatus || 'UNKNOWN',
          startLatitude: payload.latitude,
          startLongitude: payload.longitude,
          startAccuracy: payload.accuracy,
          notes: payload.notes,
        };
        mockActiveSession = session;
        mockSessions.unshift(session);
        return session;
      }
      const response = await api.post('/sales-work-sessions/start', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-work-session'] });
    },
  });
}

export function useEndWork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: EndWorkPayload) => {
      if (IS_MOCK) {
        if (!mockActiveSession) {
          throw new Error('No active work session');
        }

        const endGpsStatus: 'GRANTED' | 'DENIED' | 'UNAVAILABLE' | 'UNKNOWN' | undefined = payload.gpsStatus;

        const session: SalesWorkSession = {
          ...mockActiveSession,
          endedAt: new Date().toISOString(),
          endGpsStatus: endGpsStatus || mockActiveSession.startGpsStatus,
          endLatitude: payload.latitude,
          endLongitude: payload.longitude,
          endAccuracy: payload.accuracy,
          status: 'COMPLETED',
        };

        mockSessions = mockSessions.map(s => s.id === session.id ? session : s);
        mockActiveSession = null;

        return session;
      }
      const response = await api.post('/sales-work-sessions/end', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-work-session'] });
    },
  });
}

export function useWorkSessionHistory(page = 1, limit = 20) {
  return useQuery<SessionHistoryResponse>({
    queryKey: ['sales-work-session', 'history', page, limit],
    queryFn: async () => {
      if (IS_MOCK) {
        const startIdx = (page - 1) * limit;
        const sessions = mockSessions.slice(startIdx, startIdx + limit);
        const total = mockSessions.length;
        return {
          sessions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      }
      const response = await api.get(
        `/sales-work-sessions/history?page=${page}&limit=${limit}`,
      );
      return response.data;
    },
  });
}

// Helper to reset mock state (useful for testing)
export function resetMockWorkSession() {
  mockActiveSession = null;
  mockSessions = [];
}
