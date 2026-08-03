import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

export const useSupportTickets = () => useQuery<SupportTicket[]>({
  queryKey: ['support', 'tickets'],
  queryFn: async () => {
    const { data } = await api.get('/support/tickets');
    return Array.isArray(data) ? data : data?.data ?? [];
  },
});

export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { subject: string; message: string }) => {
      const { data } = await api.post('/support/tickets', payload);
      return data as SupportTicket;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] }),
  });
};

export const useFaqs = () => useQuery<FAQItem[]>({
  queryKey: ['faqs'],
  queryFn: async () => {
    const { data } = await api.get('/faqs');
    return Array.isArray(data) ? data : data?.data ?? [];
  },
});
