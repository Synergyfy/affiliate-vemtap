import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import { Agreement, CustomAgreement, AgreementSignature, AgreementStats } from '@/types/api';

/**
   * LEGACY: Get platform settings agreement template
   */
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

/**
   * LEGACY: Update platform settings agreement template
   */
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

// ==========================================
// NEW ROLE-BASED TARGETED AGREEMENT HOOKS
// ==========================================

/**
 * Fetch all pending agreements that need signature for the current user
 */
export const usePendingAgreements = () => {
  return useQuery<CustomAgreement[]>({
    queryKey: ['agreements', 'pending'],
    queryFn: async () => {
      const { data } = await api.get('/agreements/pending');
      return data;
    },
    staleTime: 10 * 1000, // short stale time for real-time modal trigger
  });
};

/**
 * Submit signature for an agreement version
 */
export const useSignAgreement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, version }: { id: string; version: number }) => {
      const { data } = await api.post(`/agreements/${id}/sign`, { version });
      return data as AgreementSignature;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['agreements', 'my-signatures'] });
    },
  });
};

/**
 * Fetch user's personal signed agreements history
 */
export const useMySignatures = () => {
  return useQuery<AgreementSignature[]>({
    queryKey: ['agreements', 'my-signatures'],
    queryFn: async () => {
      const { data } = await api.get('/agreements/my-signatures');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Admin: Fetch all agreements (optionally filtered by role or active status)
 */
export const useAdminAgreements = (filters?: { role?: string; isActive?: boolean }) => {
  return useQuery<CustomAgreement[]>({
    queryKey: ['admin', 'agreements', filters],
    queryFn: async () => {
      const { data } = await api.get('/agreements', { params: filters });
      return data;
    },
    staleTime: 1 * 60 * 1000,
  });
};

/**
 * Admin: Fetch single agreement details
 */
export const useAdminAgreementDetail = (id: string) => {
  return useQuery<CustomAgreement>({
    queryKey: ['admin', 'agreements', 'detail', id],
    queryFn: async () => {
      const { data } = await api.get(`/agreements/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

/**
 * Admin: Create a new role-targeted agreement
 */
export const useCreateAgreementCustom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title: string; description: string; content: string; targetRoles: string[] }) => {
      const { data } = await api.post('/agreements', payload);
      return data as CustomAgreement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'agreements'] });
    },
  });
};

/**
 * Admin: Update an existing agreement (increments version if title, description, content or targetRoles change)
 */
export const useUpdateAgreementCustom = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: { title?: string; description?: string; content?: string; targetRoles?: string[]; isActive?: boolean } }) => {
      const { data } = await api.put(`/agreements/${id}`, payload);
      return data as CustomAgreement;
    },
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'agreements'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'agreements', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'agreements', 'stats', id] });
    },
  });
};

/**
 * Admin: Get detailed signature stats and user lists for a specific agreement
 */
export const useAgreementStats = (id: string) => {
  return useQuery<AgreementStats>({
    queryKey: ['admin', 'agreements', 'stats', id],
    queryFn: async () => {
      const { data } = await api.get(`/agreements/${id}/signatures`);
      return data;
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  });
};

/**
 * Admin: Get agreements and signature audit log for a specific user
 */
export const useUserAgreementHistory = (userId: string) => {
  return useQuery<{ userId: string; fullName: string; email: string; role: string; agreements: { agreementId: string; title: string; description: string; latestVersion: number; signed: boolean; signedVersion: number | null; signedAt: string | null; isUpToDate: boolean }[] }>({
    queryKey: ['admin', 'users', 'agreements', userId],
    queryFn: async () => {
      const { data } = await api.get(`/agreements/users/${userId}`);
      return data;
    },
    enabled: !!userId,
  });
};
