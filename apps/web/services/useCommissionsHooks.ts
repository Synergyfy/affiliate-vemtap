import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { Commission, PaginatedResponse, CommissionStatus } from '@/types/api';

export const useCommissions = (params?: { limit?: number; status?: CommissionStatus; userId?: string }) => {
  return useQuery<PaginatedResponse<Commission>>({
    queryKey: ['commissions', params],
    queryFn: async () => {
      const { data } = await api.get('/commissions', { params });
      return data;
    },
  });
};

export const useMyCommissions = (params?: { limit?: number }) => {
  return useQuery<PaginatedResponse<Commission>>({
    queryKey: ['commissions', 'me', params],
    queryFn: async () => {
      const { data } = await api.get('/commissions/me', { params });
      return data;
    },
  });
};

export const useUpdateCommissionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CommissionStatus }) => {
      const { data } = await api.patch(`/commissions/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });
};
