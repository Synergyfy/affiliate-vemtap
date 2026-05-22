import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { Agreement } from '@/types/api';

export const useAgreement = () => {
  return useQuery<Agreement>({
    queryKey: ['settings', 'agreement'],
    queryFn: async () => {
      const { data } = await api.get('/settings/agreement');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateAgreement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { agreementTemplate: string }) => {
      const { data } = await api.patch('/settings/agreement', payload);
      return data as Agreement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'agreement'] });
    },
  });
};
