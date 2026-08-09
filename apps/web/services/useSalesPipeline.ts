import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import {
  SalesPipelineEntry,
  SalesMetricsResponse,
  DuplicateWarning,
  DuplicateCheckRequest,
  FollowUp,
  Demo,
  SalesPipelineStage,
  SalesExitState,
} from '@/types/sales-pipeline';

const IS_MOCK = process.env.NEXT_PUBLIC_ADMIN_MOCK === 'true';

// ---------------------------------------------------------------------------
// Mock state — module-level for mock mode persistence
// ---------------------------------------------------------------------------

let mockPipelineEntries: SalesPipelineEntry[] = [
  {
    id: 'pip-001',
    businessName: 'ABC Pharmacy',
    industry: 'Pharmacy',
    location: 'Wuse 2, Abuja',
    contactName: 'Mr. Johnson',
    phone: '08012345678',
    source: 'Direct Referral',
    pipelineStage: 'INTERESTED',
    leadQuality: 'QUALIFIED',
    priority: 'HIGH',
    subscriptionInterest: true,
    followUpDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    createdAt: '2026-08-06T10:30:00Z',
    updatedAt: '2026-08-06T15:20:00Z',
    activities: [
      { id: 'act-001', type: 'VISIT', title: 'Initial visit', createdAt: '2026-08-06T10:30:00Z', duration: 15 },
    ],
  },
  {
    id: 'pip-002',
    businessName: 'Grand Square Supermarket',
    industry: 'Supermarket / Grocery',
    location: 'Wuse, Abuja',
    contactName: 'Mrs. Adeola',
    phone: '08023456789',
    source: 'Cold Outreach',
    pipelineStage: 'VISITED',
    leadQuality: 'QUALIFIED',
    priority: 'HIGH',
    subscriptionInterest: false,
    createdAt: '2026-08-05T09:00:00Z',
    updatedAt: '2026-08-05T09:30:00Z',
  },
  {
    id: 'pip-003',
    businessName: 'TechHub Phone Accessories',
    industry: 'Electronics / Phone Accessories',
    location: 'Wuse 2, Abuja',
    contactName: 'Mr. Emeka',
    phone: '08034567890',
    source: 'Market Mapping',
    pipelineStage: 'NEW_LEAD',
    leadQuality: 'NEW',
    priority: 'MEDIUM',
    subscriptionInterest: false,
    createdAt: '2026-08-07T08:00:00Z',
    updatedAt: '2026-08-07T08:00:00Z',
  },
  {
    id: 'pip-004',
    businessName: 'HealthPlus Pharmacy',
    industry: 'Pharmacy',
    location: 'Maitama, Abuja',
    contactName: 'Pharm. Sarah',
    phone: '08045678901',
    source: 'Direct Referral',
    pipelineStage: 'CUSTOMER',
    leadQuality: 'CONVERTED',
    priority: 'HIGH',
    subscriptionInterest: true,
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-07-25T14:30:00Z',
    activities: [
      { id: 'act-004', type: 'VISIT', title: 'Initial visit', createdAt: '2026-07-20T10:00:00Z', duration: 20 },
      { id: 'act-005', type: 'MEETING', title: 'Demo call', createdAt: '2026-07-22T11:00:00Z', duration: 45 },
    ],
  },
  {
    id: 'pip-005',
    businessName: 'Elite Beauty Salon',
    industry: 'Beauty / Salon / Barbing',
    location: 'Area 1, Abuja',
    contactName: 'Ms. Grace',
    phone: '08056789012',
    source: 'Event/Networking',
    pipelineStage: 'CONTACTED',
    exitState: 'NOT_INTERESTED',
    leadQuality: 'UNQUALIFIED',
    priority: 'LOW',
    subscriptionInterest: false,
    createdAt: '2026-08-03T11:00:00Z',
    updatedAt: '2026-08-03T14:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useSalesPipeline(filters?: { stage?: SalesPipelineStage; search?: string; limit?: number }) {
  return useQuery({
    queryKey: ['sales-pipeline', filters],
    queryFn: async () => {
      if (IS_MOCK) {
        let entries = [...mockPipelineEntries];
        if (filters?.stage) {
          entries = entries.filter(e => e.pipelineStage === filters.stage || e.exitState === filters.stage);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          entries = entries.filter(
            e =>
              e.businessName.toLowerCase().includes(q) ||
              (e.contactName || '').toLowerCase().includes(q) ||
              (e.location || '').toLowerCase().includes(q),
          );
        }
        return { data: entries, meta: { total: entries.length } };
      }
      const response = await api.get('/sales/pipeline', { params: filters });
      return response.data;
    },
  });
}

export function useSalesMetrics() {
  return useQuery({
    queryKey: ['sales-metrics'],
    queryFn: async () => {
      if (IS_MOCK) {
        const entries = mockPipelineEntries;
        return {
          metrics: {
            leadsSubmitted: entries.length,
            validLeads: entries.filter(e => e.leadQuality && !['INVALID', 'DUPLICATE'].includes(e.leadQuality)).length,
            qualifiedLeads: entries.filter(e => e.leadQuality === 'QUALIFIED' || e.leadQuality === 'CONVERTED').length,
            interestedLeads: entries.filter(e => e.leadQuality === 'INTERESTED').length,
            followUps: entries.filter(e => e.followUpDate).length,
            demos: entries.filter(e => e.demoScheduledDate).length,
            conversions: entries.filter(e => e.pipelineStage === 'CUSTOMER').length,
            notInterested: entries.filter(e => e.exitState === 'NOT_INTERESTED').length,
            lost: entries.filter(e => e.exitState === 'LOST').length,
            invalid: entries.filter(e => e.leadQuality === 'INVALID' || e.exitState === 'INVALID').length,
            duplicate: entries.filter(e => e.leadQuality === 'DUPLICATE' || e.exitState === 'DUPLICATE').length,
          },
          date: new Date().toISOString(),
        };
      }
      const response = await api.get<SalesMetricsResponse>('/sales/metrics');
      return response.data;
    },
  });
}

export function useSalesLead(leadId: string) {
  return useQuery({
    queryKey: ['sales-pipeline', leadId],
    queryFn: async () => {
      if (IS_MOCK) {
        return mockPipelineEntries.find(e => e.id === leadId) || null;
      }
      const response = await api.get(`/sales/pipeline/${leadId}`);
      return response.data;
    },
    enabled: !!leadId,
  });
}

export function useCheckDuplicate(request: DuplicateCheckRequest) {
  return useQuery({
    queryKey: ['sales-duplicate-check', request],
    queryFn: async (): Promise<DuplicateWarning> => {
      if (IS_MOCK) {
        const existing = mockPipelineEntries.find(
          e =>
            e.businessName.toLowerCase() === request.businessName?.toLowerCase() ||
            (request.phone && e.phone && e.phone.replace(/[^0-9]/g, '') === request.phone.replace(/[^0-9]/g, '')),
        );
        if (existing) {
          return {
            isMatch: true,
            existingBusiness: {
              id: existing.id,
              businessName: existing.businessName,
              status: existing.pipelineStage,
              leadQuality: existing.leadQuality,
              contactName: existing.contactName,
              phone: existing.phone,
            },
            confidence: 'HIGH',
            reason: 'Business name or phone number matches an existing record',
          };
        }
        return { isMatch: false, confidence: 'LOW' };
      }
      const response = await api.post<DuplicateWarning>('/sales/leads/check-duplicate', request);
      return response.data;
    },
    enabled: !!request.businessName || !!request.phone,
  });
}

export function useSalesFollowUps(flushKey?: number) {
  return useQuery({
    queryKey: ['sales-follow-ups', flushKey],
    queryFn: async () => {
      if (IS_MOCK) {
        const now = new Date();
        const today = now.toLocaleDateString();
        const followUps: FollowUp[] = [];

        mockPipelineEntries.forEach(entry => {
          if (entry.followUpDate) {
            const followUpDate = new Date(entry.followUpDate);
            if (followUpDate.toLocaleDateString() === today) {
              followUps.push({
                id: `fu-${entry.id}`,
                leadId: entry.id,
                scheduledDate: entry.followUpDate,
                status: 'PENDING',
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
              });
            }
          }
        });

        return {
          dueToday: followUps.filter(f => f.status === 'PENDING'),
          overdue: [] as FollowUp[],
          upcoming: [] as FollowUp[],
        };
      }
      const response = await api.get('/sales/follow-ups');
      return response.data;
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useQualifyLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, quality }: { leadId: string; quality: string; reason?: string }) => {
      if (IS_MOCK) {
        mockPipelineEntries = mockPipelineEntries.map(e =>
          e.id === leadId
            ? { ...e, leadQuality: quality as any, updatedAt: new Date().toISOString() }
            : e,
        );
        return mockPipelineEntries.find(e => e.id === leadId);
      }
      const response = await api.post(`/sales/leads/${leadId}/qualify`, { quality });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['sales-metrics'] });
    },
  });
}

export function useUpdatePipelineStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, stage }: { leadId: string; stage: SalesPipelineStage }) => {
      if (IS_MOCK) {
        mockPipelineEntries = mockPipelineEntries.map(e =>
          e.id === leadId
            ? {
                ...e,
                pipelineStage: stage,
                updatedAt: new Date().toISOString(),
                leadQuality: stage === 'CUSTOMER' ? 'CONVERTED' : e.leadQuality,
              }
            : e,
        );
        return mockPipelineEntries.find(e => e.id === leadId);
      }
      const response = await api.patch(`/sales/pipeline/${leadId}/stage`, { stage });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['sales-metrics'] });
    },
  });
}

export function useSetExitState() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, exitState, quality }: { leadId: string; exitState: SalesExitState; quality?: string }) => {
      if (IS_MOCK) {
        mockPipelineEntries = mockPipelineEntries.map(e =>
          e.id === leadId
            ? {
                ...e,
                exitState,
                pipelineStage: 'NEW_LEAD' as any,
                leadQuality: (quality || exitState.toLowerCase()) as any,
                updatedAt: new Date().toISOString(),
              }
            : e,
        );
        return mockPipelineEntries.find(e => e.id === leadId);
      }
      const response = await api.patch(`/sales/pipeline/${leadId}/exit`, { exitState, quality });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['sales-metrics'] });
    },
  });
}

export function useScheduleFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, scheduledDate, scheduledTime, notes }: { leadId: string; scheduledDate: string; scheduledTime?: string; notes?: string }) => {
      if (IS_MOCK) {
        mockPipelineEntries = mockPipelineEntries.map(e =>
          e.id === leadId
            ? {
                ...e,
                followUpDate: scheduledDate,
                updatedAt: new Date().toISOString(),
              }
            : e,
        );
        return mockPipelineEntries.find(e => e.id === leadId);
      }
      const response = await api.post(`/sales/pipeline/${leadId}/follow-up`, { scheduledDate, scheduledTime, notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['sales-follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['sales-metrics'] });
    },
  });
}

export function useCompleteFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, outcome, notes }: { leadId: string; outcome: string; notes?: string }) => {
      if (IS_MOCK) {
        mockPipelineEntries = mockPipelineEntries.map(e =>
          e.id === leadId
            ? { ...e, updatedAt: new Date().toISOString() }
            : e,
        );
        return { success: true };
      }
      const response = await api.post(`/sales/pipeline/${leadId}/follow-up/complete`, { outcome, notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['sales-follow-ups'] });
      queryClient.invalidateQueries({ queryKey: ['sales-metrics'] });
    },
  });
}

export function useScheduleDemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, scheduledDate, scheduledTime, type, meetingUrl, notes }: { leadId: string; scheduledDate: string; scheduledTime?: string; type: 'VIRTUAL' | 'ONSITE'; meetingUrl?: string; notes?: string }) => {
      if (IS_MOCK) {
        mockPipelineEntries = mockPipelineEntries.map(e =>
          e.id === leadId
            ? {
                ...e,
                demoScheduledDate: scheduledDate,
                updatedAt: new Date().toISOString(),
              }
            : e,
        );
        return mockPipelineEntries.find(e => e.id === leadId);
      }
      const response = await api.post(`/sales/pipeline/${leadId}/demo`, { scheduledDate, scheduledTime, type, meetingUrl, notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['sales-metrics'] });
    },
  });
}

export function useCompleteDemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, outcome, notes }: { leadId: string; outcome: string; notes?: string }) => {
      if (IS_MOCK) {
        mockPipelineEntries = mockPipelineEntries.map(e =>
          e.id === leadId
            ? {
                ...e,
                pipelineStage: 'CUSTOMER' as SalesPipelineStage,
                leadQuality: 'CONVERTED',
                updatedAt: new Date().toISOString(),
              }
            : e,
        );
        return mockPipelineEntries.find(e => e.id === leadId);
      }
      const response = await api.post(`/sales/pipeline/${leadId}/demo/complete`, { outcome, notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['sales-metrics'] });
    },
  });
}

export function useCreateSalesLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SalesPipelineEntry>) => {
      if (IS_MOCK) {
        const newEntry: SalesPipelineEntry = {
          id: `pip-${Date.now()}`,
          businessName: data.businessName || '',
          industry: data.industry || '',
          location: data.location || '',
          contactName: data.contactName || '',
          phone: data.phone || '',
          email: data.email,
          source: data.source || 'Direct Referral',
          pipelineStage: 'NEW_LEAD',
          leadQuality: 'NEW',
          priority: data.priority || 'MEDIUM',
          subscriptionInterest: data.subscriptionInterest || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockPipelineEntries = [newEntry, ...mockPipelineEntries];
        return newEntry;
      }
      const response = await api.post('/sales/pipeline', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-pipeline'] });
      queryClient.invalidateQueries({ queryKey: ['sales-metrics'] });
    },
  });
}

export function resetMockSalesPipeline() {
  mockPipelineEntries = mockPipelineEntries.slice();
}
