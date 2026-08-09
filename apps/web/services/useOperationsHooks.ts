import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Business, BusinessStatus, Role } from '@/types/api';
import type { GeographicHierarchyNode } from '@/types/market-mapping';

export interface OperationalTask {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  dueDate?: string;
  assignedTo?: {
    fullName: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface Demo {
  id: string;
  businessName: string;
  date: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  agent?: {
    fullName: string;
    avatar?: string;
  };
  meetingUrl?: string;
  notes?: string;
}

export interface Onboarding {
  id: string;
  business: {
    businessName: string;
    ownerName: string;
    affiliate: { fullName: string };
  };
  stage: 'QR_DESIGN' | 'SHIPMENT' | 'SETUP' | 'ACTIVATION';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  updatedAt: string;
}

export interface OperationalActivity {
  id: string;
  type: string;
  title: string;
  businessName?: string;
  createdAt: string;
}

export interface OperationalStats {
  pendingTasks: number;
  upcomingDemos: number;
  activeOnboarding: number;
  leadConversion: number;
  teamRevenue: number;
}

export function useOperationsStats() {
  return useQuery<OperationalStats>({
    queryKey: ['operations-stats'],
    queryFn: () => api.get('/operations/stats'),
  });
}

export function useTasks() {
  return useQuery<OperationalTask[]>({
    queryKey: ['operations-tasks'],
    queryFn: () => api.get('/operations/tasks'),
  });
}

export function useDemos() {
  return useQuery<Demo[]>({
    queryKey: ['operations-demos'],
    queryFn: () => api.get('/operations/demos'),
  });
}

export function useOnboarding() {
  return useQuery<Onboarding[]>({
    queryKey: ['operations-onboarding'],
    queryFn: () => api.get('/operations/onboarding'),
  });
}

export function useActivities() {
  return useQuery<OperationalActivity[]>({
    queryKey: ['operations-activities'],
    queryFn: () => api.get('/operations/activities'),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; priority?: string; dueDate?: string }) => 
      api.post('/operations/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['operations-stats'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.patch(`/operations/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['operations-stats'] });
    },
  });
}

export function useCreateDemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { businessName: string; date: string; meetingUrl?: string; notes?: string; leadId?: string }) => 
      api.post('/operations/demos', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-demos'] });
      queryClient.invalidateQueries({ queryKey: ['operations-stats'] });
    },
  });
}

export function useUpdateDemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.patch(`/operations/demos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-demos'] });
      queryClient.invalidateQueries({ queryKey: ['operations-stats'] });
    },
  });
}

export interface BusinessHealthItem {
  businessId: string;
  businessName: string;
  status: string;
  healthScore: number;
  churnRisk: string;
  lastActivity: string | null;
  affiliateName: string;
}

export interface BusinessHealthResponse {
  businesses: BusinessHealthItem[];
  summary: {
    totalBusinesses: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    averageHealthScore: number;
  };
}

export interface BusinessStatusHistoryEntry {
  id: string;
  fromStatus: BusinessStatus | null;
  toStatus: BusinessStatus;
  createdAt: string;
  changedBy: { id: string; fullName: string };
}

export type AdminBusinessDetail = Business & {
  name?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  address?: string;
  assignedAffiliateName?: string;
  lastVisit?: string;
  clusterName?: string;
  nextVisit?: string;
  notes?: string;
  documents?: Array<{ id: string; title: string; type: string; uploadedAt: string }>;
  statusHistory: BusinessStatusHistoryEntry[];
};

export interface OperationsReportRow {
  id: string;
  name: string;
  role: Role | 'TEAM' | 'LOCATION';
  region?: string;
  level?: string;
  leads: number;
  conversions: number;
  earnings: number;
  conversionRate: number;
}

export interface OperationsReportAggregates {
  summary: {
    totalLeads: number;
    conversions: number;
    totalEarnings: number;
    conversionRate: number;
    totalMembers: number;
    activeMembers: number;
  };
  rows: OperationsReportRow[];
}

export interface OperationsReportTrendPoint {
  period: string;
  leads: number;
  conversions: number;
  earnings: number;
}

export interface OperationsReportActivity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: string;
  user: { fullName: string; role: Role };
}

export interface OperationsReportDetail {
  subjectId: string | null;
  trend: OperationsReportTrendPoint[];
  summary: {
    leads: number;
    conversions: number;
    earnings: number;
    conversionRate: number;
  };
  recentActivities: OperationsReportActivity[];
}

export function useBusinessHealth() {
  return useQuery<BusinessHealthResponse>({
    queryKey: ['operations-business-health'],
    queryFn: async () => {
      return api.get<BusinessHealthResponse>('/operations/business-health');
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useOnboardingBonus() {
  return useQuery<{ amount: number }>({
    queryKey: ['operations-onboarding-bonus'],
    queryFn: () => api.get('/operations/onboarding/bonus'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.patch(`/operations/onboarding/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['operations-stats'] });
    },
  });
}

export function useOperationsReportsHierarchy() {
  return useQuery<GeographicHierarchyNode[]>({
    queryKey: ['operations-reports-hierarchy'],
    queryFn: () => api.get<GeographicHierarchyNode[]>('/operations/reports/hierarchy'),
  });
}

export function useOperationsBusiness(businessId?: string) {
  return useQuery<AdminBusinessDetail>({
    queryKey: ['operations-business', businessId],
    queryFn: () => api.get<AdminBusinessDetail>(`/businesses/${businessId}`),
    enabled: Boolean(businessId),
  });
}

export interface OperationsReportFilters {
  period: 'daily' | 'weekly' | 'monthly';
  tab: 'teams' | 'agents' | 'affiliates' | 'line-managers' | 'locations';
  country?: string;
  state?: string;
  city?: string;
  area?: string;
  cluster?: string;
}

export function useOperationsReportsAggregates(params: OperationsReportFilters) {
  return useQuery<OperationsReportAggregates>({
    queryKey: ['operations-reports-aggregates', params],
    queryFn: () => api.get<OperationsReportAggregates>('/operations/reports/aggregates', { params }),
  });
}

export function useOperationsReportsDetail(params: {
  subjectId?: string;
  type: 'agent' | 'affiliate' | 'line-manager' | 'team' | 'location';
  period: 'daily' | 'weekly' | 'monthly';
  locationId?: string;
}) {
  return useQuery<OperationsReportDetail>({
    queryKey: ['operations-reports-detail', params],
    queryFn: () => api.get<OperationsReportDetail>('/operations/reports/detail', { params }),
  });
}

