import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { FraudAlert, PaginatedResponse, FraudStatus } from '@/types/api';

export const useFraudAlerts = (params?: { 
  limit?: number; 
  status?: FraudStatus;
  search?: string;
}) => {
  return useQuery<PaginatedResponse<FraudAlert>>({
    queryKey: ['fraud', params],
    queryFn: async () => {
      const { data } = await api.get('/fraud', { params });
      return data;
    },
  });
};

export const useUpdateFraudStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, resolution }: { id: string; status: FraudStatus; resolution?: string }) => {
      const { data } = await api.patch(`/fraud/${id}/status`, { status, resolution });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};
