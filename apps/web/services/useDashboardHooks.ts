import { useQuery } from '@tanstack/react-query';
import api from './api';
import { 
  AffiliateStats, 
  AffiliateForecast, 
  ChartDataPoint, 
  LeaderboardEntry,
  NetworkStats
} from '@/types/api';

export const useAffiliateStats = () => {
  return useQuery<AffiliateStats>({
    queryKey: ['affiliate', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/affiliate/dashboard/stats');
      return data;
    },
  });
};

export const useAffiliateForecast = () => {
  return useQuery<AffiliateForecast>({
    queryKey: ['affiliate', 'forecast'],
    queryFn: async () => {
      const { data } = await api.get('/affiliate/dashboard/forecast');
      return data;
    },
  });
};

export const useAffiliateActions = () => {
  return useQuery<any[]>({
    queryKey: ['affiliate', 'actions'],
    queryFn: async () => {
      const { data } = await api.get('/affiliate/dashboard/actions');
      return data;
    },
  });
};

export const useAffiliateAlerts = () => {
  return useQuery<any[]>({
    queryKey: ['affiliate', 'alerts'],
    queryFn: async () => {
      const { data } = await api.get('/affiliate/dashboard/alerts');
      return data;
    },
  });
};

export const useAffiliateCharts = () => {
  return useQuery<{ earningsHistory: ChartDataPoint[]; referralTrends: ChartDataPoint[] }>({
    queryKey: ['affiliate', 'charts'],
    queryFn: async () => {
      const { data } = await api.get('/affiliate/dashboard/charts');
      return data;
    },
  });
};

export const useLeaderboard = (params?: { limit?: number; timeframe?: string }) => {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ['affiliate', 'leaderboard', params],
    queryFn: async () => {
      const { data } = await api.get('/affiliate/dashboard/leaderboard', { params });
      return data;
    },
  });
};

export const useNetworkStats = () => {
  return useQuery<NetworkStats>({
    queryKey: ['affiliate', 'network-stats'],
    queryFn: async () => {
      const { data } = await api.get('/network/stats');
      return data;
    },
  });
};
