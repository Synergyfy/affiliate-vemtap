import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { FraudAlert, PaginatedResponse, FraudStatus } from '@/types/api';
import { mockFraudAlerts } from '@/lib/admin-mock-data';

const IS_MOCK = process.env.NEXT_PUBLIC_ADMIN_MOCK === 'true';

export const useFraudAlerts = (params?: { 
  limit?: number; 
  status?: FraudStatus;
  search?: string;
}) => {
  return useQuery<PaginatedResponse<FraudAlert>>({
    queryKey: ['fraud', params],
    queryFn: async () => {
      if (IS_MOCK) return mockFraudAlerts;
      const { data } = await api.get('/fraud', { params });
      return data;
    },
  });
};

export const useUpdateFraudStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, resolution }: { id: string; status: FraudStatus; resolution?: string }) => {
      if (IS_MOCK) return { id, status, resolution };
      const { data } = await api.patch(`/fraud/${id}/status`, { status, resolution });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useFraudStats = () => {
  return useQuery<{
    alertCount?: number;
    highRiskCount?: number;
    pendingReviewCount?: number;
    [key: string]: any;
  }>({
    queryKey: ['fraud', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/fraud/stats');
      return data;
    },
  });
};

export const useFraudGuardStatus = () => {
  return useQuery<{ thresholdScore: number }>({
    queryKey: ['fraud', 'guard-status'],
    queryFn: async () => {
      const { data } = await api.get('/fraud/guard-status');
      return data;
    },
  });
};

export const useUpdateFraudGuardStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ thresholdScore }: { thresholdScore: number }) => {
      const { data } = await api.patch('/fraud/guard-status', { thresholdScore });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud', 'guard-status'] });
    },
  });
};


