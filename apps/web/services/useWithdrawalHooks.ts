import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { Withdrawal, PaginatedResponse, WithdrawalStatus } from '@/types/api';

export const useMyWithdrawals = (params?: { limit?: number }) => {
  return useQuery<PaginatedResponse<Withdrawal>>({
    queryKey: ['withdrawals', 'me', params],
    queryFn: async () => {
      const { data } = await api.get('/withdrawals/me', { params });
      return data;
    },
  });
};

export const useRequestWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { amount: number; bankName: string; accountNumber: string; accountName: string }) => {
      const { data } = await api.post('/withdrawals', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate', 'stats'] });
    },
  });
};
