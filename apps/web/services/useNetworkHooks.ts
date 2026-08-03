import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { PaginatedResponse } from '@/types/api';

export interface RecruitsQueryParams {
  page?: number;
  limit?: number;
}

export interface RecruitMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  totalCommissions: number;
  activeBusinessesCount?: number;
  dailyLeadTarget?: number;
  monthlyConversionTarget?: number;
  [key: string]: any;
}

export interface TeamMemberDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  dailyLeadTarget: number;
  monthlyConversionTarget: number;
  totalEarnings: number;
  activeBusinessesCount: number;
  todayLeadsCount?: number;
  monthlyConversionsCount?: number;
  activityFeed?: any[];
  targetHistory?: any[];
  earningsBreakdown?: any[];
}

export interface UpdateTargetsPayload {
  memberId: string;
  dailyLeadTarget: number;
  monthlyConversionTarget: number;
  reason?: string;
}

export const useNetworkRecruits = (params?: RecruitsQueryParams) => {
  return useQuery<PaginatedResponse<RecruitMember>>({
    queryKey: ['network', 'recruits', params],
    queryFn: async () => {
      const { data } = await api.get('/network/recruits', { params });
      return data;
    },
  });
};

export const useTeamMemberDetail = (memberId: string) => {
  return useQuery<TeamMemberDetail>({
    queryKey: ['network', 'team-member', memberId],
    queryFn: async () => {
      const { data } = await api.get(`/network/team-member/${memberId}`);
      return data;
    },
    enabled: !!memberId,
  });
};

export const useUpdateMemberTargets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateTargetsPayload) => {
      const { data } = await api.post('/network/update-targets', payload);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['network', 'recruits'] });
      queryClient.invalidateQueries({ queryKey: ['network', 'team-member', variables.memberId] });
    },
  });
};

export const useNetworkEarningsHistory = (period: string = 'monthly') => {
  return useQuery<any[]>({
    queryKey: ['network', 'earnings-history', period],
    queryFn: async () => {
      const { data } = await api.get('/network/earnings-history', { params: { period } });
      return data;
    },
  });
};

export const useTeamReports = (period: string = 'monthly') => {
  return useQuery<any>({
    queryKey: ['network', 'team-reports', period],
    queryFn: async () => {
      const { data } = await api.get('/network/team-reports', { params: { period } });
      return data;
    },
  });
};

export const useClaimBonus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (type: string) => {
      const { data } = await api.post('/network/claim-bonus', { type });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate', 'network-stats'] });
    },
  });
};

export const useToggleManagerMode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/network/toggle-manager-mode');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate', 'network-stats'] });
    },
  });
};
