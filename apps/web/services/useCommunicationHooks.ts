import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';
import {
  AudienceEstimate,
  AudienceFilter,
  AutomationRule,
  Campaign,
  CommunicationChannel,
  CommunicationOverview,
  CommunicationQueue,
  CommunicationQueueItem,
  CommunicationSettings,
  CustomerJourneyStage,
  LeadCommunication,
  MessageTemplate,
  OutboundMessage,
  QueueStatus,
  SmsMessageStatus,
  TemplateStatus,
  WhatsAppItemStatus,
} from '@/types/communication';
import { PaginatedResponse } from '@/types/api';
import {
  mockAudienceEstimate,
  mockCampaignsState,
  mockChannelMessages,
  mockJourneyState,
  mockLeadCommunication,
  mockLeadFixtures,
  mockMessagesState,
  mockOverviewState,
  mockQueuesState,
  mockRulesState,
  mockTemplatesState,
} from '@/lib/communication-mock';
import { buildWhatsAppLink, substituteVariables } from '@/lib/communication';

const IS_MOCK = process.env.NEXT_PUBLIC_ADMIN_MOCK === 'true';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useCommunicationOverview() {
  return useQuery({
    queryKey: ['communication', 'overview'],
    queryFn: async () => {
      if (IS_MOCK) return mockOverviewState;
      const response = await api.get<CommunicationOverview>('/communication/overview');
      return response.data;
    },
  });
}

export function useTemplates(params?: { channel?: CommunicationChannel; status?: TemplateStatus }) {
  return useQuery({
    queryKey: ['communication', 'templates', params],
    queryFn: async () => {
      if (IS_MOCK) {
        let templates = [...mockTemplatesState];
        if (params?.channel) templates = templates.filter((t) => t.channel === params.channel);
        if (params?.status) templates = templates.filter((t) => t.status === params.status);
        return templates;
      }
      const response = await api.get<{ data: MessageTemplate[]; total: number; smsMaxLength: number; supportedVariables: string[]; smsBlacklistedWords: string[] }>('/communication/templates', { params });
      return response.data.data;
    },
  });
}

export function useAudienceEstimate(filters: AudienceFilter | null) {
  return useQuery({
    queryKey: ['communication', 'audience', filters],
    enabled: !!filters,
    queryFn: async (): Promise<AudienceEstimate> => {
      if (!filters) return { totalMatches: 0, eligibleCount: 0, skippedFrequency: 0, missingPhone: 0 };
      if (IS_MOCK) return mockAudienceEstimate(filters);
      const response = await api.get<{ total: number; withPhone: number; eligible: number; filters: AudienceFilter }>('/communication/audience/preview', { params: filters });
      return {
        totalMatches: response.data.total,
        eligibleCount: response.data.eligible,
        skippedFrequency: 0,
        missingPhone: response.data.total - response.data.withPhone,
      };
    },
  });
}

export function useQueues(params?: { status?: QueueStatus }) {
  return useQuery({
    queryKey: ['communication', 'queues', params],
    queryFn: async () => {
      if (IS_MOCK) {
        let queues = [...mockQueuesState];
        if (params?.status) queues = queues.filter((q) => q.status === params.status);
        return queues;
      }
      // Backend returns flat WhatsAppQueueItem[] from GET /whatsapp/queue
      // For now, wrap into CommunicationQueue shape for frontend compatibility
      const response = await api.get('/communication/whatsapp/queue');
      const items = response.data as any[];
      if (!items || items.length === 0) return [];
      // Group by type/date to create virtual queues
      const queue: CommunicationQueue = {
        id: 'whatsapp-queue',
        name: 'WhatsApp Follow-ups',
        channel: 'WHATSAPP',
        message: '',
        totalItems: items.length,
        completedItems: 0,
        status: 'ACTIVE',
        items: items.map((item: any, idx: number) => ({
          id: item.id,
          queueId: 'whatsapp-queue',
          lead: { id: item.leadId, businessName: item.businessName, contactName: item.contactName, phone: item.phone, location: item.location },
          order: idx + 1,
          status: 'PENDING' as const,
          waLink: item.deepLink || '',
          message: item.body,
        })),
        createdBy: 'System',
        createdAt: items[0]?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return [queue];
    },
  });
}

export function useQueue(id: string | undefined) {
  return useQuery({
    queryKey: ['communication', 'queue', id],
    enabled: !!id,
    queryFn: async () => {
      if (IS_MOCK) return mockQueuesState.find((q) => q.id === id) || null;
      // Backend has no single-queue endpoint; fall back to finding in the list
      const queues = await api.get<CommunicationQueue[]>('/communication/whatsapp/queue');
      return (queues.data as any[]).length > 0 ? {
        id: id || 'whatsapp-queue',
        name: 'WhatsApp Follow-ups',
        channel: 'WHATSAPP' as const,
        message: '',
        totalItems: (queues.data as any[]).length,
        completedItems: 0,
        status: 'ACTIVE' as const,
        items: (queues.data as any[]).map((item: any, idx: number) => ({
          id: item.id,
          queueId: id || 'whatsapp-queue',
          lead: { id: item.leadId, businessName: item.businessName, contactName: item.contactName, phone: item.phone, location: item.location },
          order: idx + 1,
          status: 'PENDING' as const,
          waLink: item.deepLink || '',
          message: item.body,
        })),
        createdBy: 'System',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } : null;
    },
  });
}

export function useCommunicationMessages(params?: {
  channel?: CommunicationChannel;
  status?: SmsMessageStatus | WhatsAppItemStatus;
  page?: number;
  limit?: number;
}) {
  return useQuery<PaginatedResponse<OutboundMessage>>({
    queryKey: ['communication', 'messages', params],
    queryFn: async () => {
      if (IS_MOCK) {
        let messages = [...mockMessagesState];
        if (params?.channel) messages = mockChannelMessages(params.channel);
        return {
          data: messages,
          meta: { total: messages.length, page: 1, limit: 50, totalPages: 1 },
        };
      }
      const response = await api.get<PaginatedResponse<OutboundMessage>>('/communication/messages', {
        params,
      });
      return response.data;
    },
  });
}

export function useLeadCommunication(leadId: string | undefined) {
  return useQuery({
    queryKey: ['communication', 'lead', leadId],
    enabled: !!leadId,
    queryFn: async () => {
      if (IS_MOCK) return mockLeadCommunication(leadId!);
      const response = await api.get<LeadCommunication>(`/communication/messages/contacts/${leadId}`);
      return response.data;
    },
  });
}

export function useCampaigns() {
  return useQuery({
    queryKey: ['communication', 'campaigns'],
    queryFn: async () => {
      if (IS_MOCK) return [...mockCampaignsState];
      const response = await api.get<Campaign[]>('/communication/campaigns');
      return response.data;
    },
  });
}

export function useAutomationRules() {
  return useQuery({
    queryKey: ['communication', 'rules'],
    queryFn: async () => {
      if (IS_MOCK) return [...mockRulesState];
      const response = await api.get<AutomationRule[]>('/communication/rules');
      return response.data;
    },
  });
}

export interface MyCommunicationFollowUps {
  whatsappDue: CommunicationQueueItem[];
  smsScheduled: OutboundMessage[];
}

export function useMyCommunicationFollowUps() {
  return useQuery({
    queryKey: ['communication', 'my-follow-ups'],
    queryFn: async () => {
      if (IS_MOCK) {
        const whatsappDue = mockQueuesState
          .filter((q) => q.status === 'ACTIVE')
          .flatMap((q) => q.items)
          .filter((i) => i.status === 'PENDING');
        const smsScheduled = mockMessagesState.filter(
          (m) => m.channel === 'SMS' && m.status === 'SCHEDULED',
        );
        return { whatsappDue, smsScheduled } as MyCommunicationFollowUps;
      }
      const response = await api.get('/communication/sales/today');
      const data = response.data as { whatsappFollowUps: CommunicationQueueItem[]; smsScheduled: OutboundMessage[]; total: number };
      return { whatsappDue: data.whatsappFollowUps || [], smsScheduled: data.smsScheduled || [] } as MyCommunicationFollowUps;
    },
  });
}

export function useCommunicationSettings() {
  return useQuery({
    queryKey: ['communication', 'settings'],
    queryFn: async () => {
      if (IS_MOCK)
        return {
          id: 'set-001',
          smsEnabled: true,
          smsProvider: 'twilio',
          smsSenderId: 'VEMTAP',
          smsDailyCap: 500,
          whatsappEnabled: true,
          minIntervalHours: 4,
          maxMessagesPerContactPerDay: 3,
          maxMessagesPerContactPerWeek: 10,
          notInterestedPolicy: 'NO_MESSAGES',
          reEngagementDelayDays: 30,
          welcomeChannel: 'WHATSAPP',
          welcomeBody: null,
          smsBlacklistedWords: [],
          updatedAt: new Date().toISOString(),
        } as CommunicationSettings;
      const response = await api.get<CommunicationSettings>('/communication/settings');
      return response.data;
    },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

const INVALIDATE_PATHS = [
  ['communication', 'overview'],
  ['communication', 'queues'],
  ['communication', 'queue'],
  ['communication', 'messages'],
  ['communication', 'lead'],
  ['communication', 'templates'],
  ['communication', 'campaigns'],
  ['communication', 'settings'],
];

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  for (const key of INVALIDATE_PATHS) {
    qc.invalidateQueries({ queryKey: key });
  }
}

export function useCreateOrUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id?: string } & Partial<MessageTemplate>) => {
      if (IS_MOCK) {
        if (data.id) {
          const idx = mockTemplatesState.findIndex((t) => t.id === data.id);
          if (idx >= 0) mockTemplatesState[idx] = { ...mockTemplatesState[idx], ...data, updatedAt: new Date().toISOString() };
        } else {
          mockTemplatesState.unshift({
            ...data,
            id: `tpl-${Date.now()}`,
            status: data.status || 'INACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as MessageTemplate);
        }
        return mockTemplatesState[0];
      }
      if (data.id) {
        const response = await api.patch<MessageTemplate>(`/communication/templates/${data.id}`, data);
        return response.data;
      }
      const response = await api.post<MessageTemplate>('/communication/templates', data);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communication', 'templates'] });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (IS_MOCK) {
        const idx = mockTemplatesState.findIndex((t) => t.id === id);
        if (idx >= 0) mockTemplatesState.splice(idx, 1);
        return { id };
      }
      // Backend has no DELETE; archive via PATCH status
      const response = await api.patch(`/communication/templates/${id}/status`, { status: 'ARCHIVED' });
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communication', 'templates'] });
    },
  });
}

export function useCreateWhatsAppQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      filters: AudienceFilter;
      templateId?: string;
      message: string;
    }) => {
      if (IS_MOCK) {
        const pool = mockLeadFixtures.filter((l) => l.phone && l.status === 'INTERESTED').slice(0, 3);
        const queue: CommunicationQueue = {
          id: `que-${Date.now()}`,
          name: data.name,
          channel: 'WHATSAPP',
          message: data.message,
          templateId: data.templateId,
          totalItems: pool.length,
          completedItems: 0,
          status: 'ACTIVE',
          items: pool.map((lead, idx) => ({
            id: `que-${Date.now()}-item-${idx + 1}`,
            queueId: `que-${Date.now()}`,
            lead,
            order: idx + 1,
            status: 'PENDING',
            waLink: buildWhatsAppLink(lead.phone, substituteVariables(data.message, lead)),
            message: substituteVariables(data.message, lead),
          })),
          createdBy: 'Admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockQueuesState.unshift(queue);
        return queue;
      }
      const response = await api.post<CommunicationQueue>('/communication/queues', data);
      return response.data;
    },
    onSuccess: () => {
      invalidateAll(qc);
    },
  });
}

export function useQueueItemAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      queueId,
      itemId,
      action,
    }: {
      queueId: string;
      itemId: string;
      action: 'open' | 'sent' | 'skip';
    }) => {
      if (IS_MOCK) {
        const queue = mockQueuesState.find((q) => q.id === queueId);
        const item = queue?.items.find((i) => i.id === itemId);
        if (!queue || !item) throw new Error('Queue item not found');
        const now = new Date().toISOString();
        if (action === 'open') {
          item.status = 'SENT';
          item.sentAt = now;
        } else if (action === 'sent') {
          item.status = 'SENT';
          item.sentAt = now;
        } else if (action === 'skip') {
          item.status = 'CANCELLED';
        }
        const completed = queue.items.filter((i) => i.status === 'SENT' || i.status === 'CANCELLED').length;
        queue.completedItems = completed;
        queue.updatedAt = now;
        if (completed >= queue.totalItems) queue.status = 'COMPLETED';
        return { queueId, itemId, action };
      }
      const response = await api.post(
        `/communication/whatsapp/${itemId}/mark-sent`,
      );
      return response.data;
    },
    onSuccess: () => {
      invalidateAll(qc);
    },
  });
}

export function useQueueLifecycle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ queueId, action }: { queueId: string; action: 'pause' | 'resume' | 'cancel' }) => {
      if (IS_MOCK) {
        const queue = mockQueuesState.find((q) => q.id === queueId);
        if (!queue) throw new Error('Queue not found');
        queue.status =
          action === 'pause' ? 'PAUSED' : action === 'resume' ? 'ACTIVE' : 'CANCELLED';
        return queue;
      }
      // No backend endpoint for queue lifecycle; WhatsApp queue is flat message list
      throw new Error('Queue lifecycle management is not available via API');
    },
    onSuccess: () => {
      invalidateAll(qc);
    },
  });
}

export function useSendSms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      leadIds: string[];
      message: string;
      templateId?: string;
      scheduledAt?: string;
    }) => {
      if (IS_MOCK) {
        const channel: CommunicationChannel = 'SMS';
        const now = new Date().toISOString();
        const messages: OutboundMessage[] = data.leadIds.map((leadId, idx) => ({
          id: `msg-${Date.now()}-${idx}`,
          leadId,
          channel,
          type: 'MANUAL',
          templateId: data.templateId || null,
          body: data.message,
          status: data.scheduledAt ? 'SCHEDULED' : 'SENT',
          scheduledForAt: data.scheduledAt || null,
          sentAt: data.scheduledAt ? undefined : now,
          sentById: 'usr-mock',
          createdAt: now,
          updatedAt: now,
        }));
        mockMessagesState.unshift(...messages);
        return messages;
      }
      const response = await api.post('/communication/messages', data);
      return response.data;
    },
    onSuccess: () => {
      invalidateAll(qc);
    },
  });
}

export function useUpdateCommunicationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<CommunicationSettings>) => {
      if (IS_MOCK) {
        const current = qc.getQueryData<CommunicationSettings>(['communication', 'settings']);
        if (current) {
          const updated = { ...current, ...data };
          qc.setQueryData(['communication', 'settings'], updated);
          return updated;
        }
        return data as CommunicationSettings;
      }
      const response = await api.patch<CommunicationSettings>('/communication/settings', data);
      return response.data;
    },
    onSuccess: () => {
      invalidateAll(qc);
    },
  });
}

export function useCancelScheduledSms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (IS_MOCK) {
        const msg = mockMessagesState.find((m) => m.id === id);
        if (msg) msg.status = 'CANCELLED';
        return { id };
      }
      const response = await api.patch(`/communication/messages/${id}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      invalidateAll(qc);
    },
  });
}

export function useRetryFailedSms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (IS_MOCK) {
        const msg = mockMessagesState.find((m) => m.id === id);
        if (msg) {
          msg.status = 'PENDING';
          setTimeout(() => { msg.status = 'SENT'; msg.sentAt = new Date().toISOString(); }, 1000);
        }
        return { id };
      }
      const response = await api.post(`/communication/sms/${id}/retry`);
      return response.data;
    },
    onSuccess: () => {
      invalidateAll(qc);
    },
  });
}

// ---------------------------------------------------------------------------
// Campaign mutations
// ---------------------------------------------------------------------------

export function useCampaignMutations() {
  const qc = useQueryClient();
  return {
    create: useMutation({
      mutationFn: async (data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (IS_MOCK) {
          const campaign: Campaign = {
            ...data,
            id: `cmp-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          mockCampaignsState.unshift(campaign);
          return campaign;
        }
        const response = await api.post<Campaign>('/communication/campaigns', data);
        return response.data;
      },
      onSuccess: () => invalidateAll(qc),
    }),
    update: useMutation({
      mutationFn: async ({ id, ...data }: { id: string } & Partial<Campaign>) => {
        if (IS_MOCK) {
          const idx = mockCampaignsState.findIndex((c) => c.id === id);
          if (idx >= 0) mockCampaignsState[idx] = { ...mockCampaignsState[idx], ...data, updatedAt: new Date().toISOString() };
          return mockCampaignsState[idx];
        }
        const response = await api.patch<Campaign>(`/communication/campaigns/${id}`, data);
        return response.data;
      },
      onSuccess: () => invalidateAll(qc),
    }),
    updateStatus: useMutation({
      mutationFn: async ({ id, status }: { id: string; status: Campaign['status'] }) => {
        if (IS_MOCK) {
          const c = mockCampaignsState.find((c) => c.id === id);
          if (c) { c.status = status; c.updatedAt = new Date().toISOString(); }
          return c;
        }
        const response = await api.patch<Campaign>(`/communication/campaigns/${id}/status`, { action: status });
        return response.data;
      },
      onSuccess: () => invalidateAll(qc),
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        if (IS_MOCK) {
          const idx = mockCampaignsState.findIndex((c) => c.id === id);
          if (idx >= 0) mockCampaignsState.splice(idx, 1);
          return { id };
        }
        // Backend has no DELETE; cancel via PATCH status
        const response = await api.patch(`/communication/campaigns/${id}/status`, { action: 'CANCELLED' });
        return response.data;
      },
      onSuccess: () => invalidateAll(qc),
    }),
  };
}

// ---------------------------------------------------------------------------
// Automation rule mutations
// ---------------------------------------------------------------------------

export function useRuleMutations() {
  const qc = useQueryClient();
  return {
    create: useMutation({
      mutationFn: async (data: Omit<AutomationRule, 'id'>) => {
        if (IS_MOCK) {
          const rule: AutomationRule = { ...data, id: `rule-${Date.now()}`, isActive: data.isActive ?? true, sortOrder: data.sortOrder ?? 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
          mockRulesState.unshift(rule);
          return rule;
        }
        const response = await api.post<AutomationRule>('/communication/rules', data);
        return response.data;
      },
      onSuccess: () => invalidateAll(qc),
    }),
    update: useMutation({
      mutationFn: async ({ id, ...data }: { id: string } & Partial<AutomationRule>) => {
        if (IS_MOCK) {
          const idx = mockRulesState.findIndex((r) => r.id === id);
          if (idx >= 0) mockRulesState[idx] = { ...mockRulesState[idx], ...data };
          return mockRulesState[idx];
        }
        const response = await api.patch<AutomationRule>(`/communication/rules/${id}`, data);
        return response.data;
      },
      onSuccess: () => invalidateAll(qc),
    }),
    toggle: useMutation({
      mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
        if (IS_MOCK) {
          const r = mockRulesState.find((r) => r.id === id);
          if (r) r.isActive = enabled;
          return r;
        }
        const endpoint = enabled ? 'activate' : 'deactivate';
        const response = await api.patch<AutomationRule>(`/communication/rules/${id}/${endpoint}`);
        return response.data;
      },
      onSuccess: () => invalidateAll(qc),
    }),
    remove: useMutation({
      mutationFn: async (id: string) => {
        if (IS_MOCK) {
          const idx = mockRulesState.findIndex((r) => r.id === id);
          if (idx >= 0) mockRulesState.splice(idx, 1);
          return { id };
        }
        const response = await api.delete(`/communication/rules/${id}`);
        return response.data;
      },
      onSuccess: () => invalidateAll(qc),
    }),
  };
}

// ---------------------------------------------------------------------------
// Customer Journey
// ---------------------------------------------------------------------------

export function useCustomerJourney() {
  return useQuery<CustomerJourneyStage[]>({
    queryKey: ['communication', 'journey'],
    queryFn: async () => {
      if (IS_MOCK) return [...mockJourneyState];
      const response = await api.get('/communication/journey');
      return response.data;
    },
  });
}

export function useJourneyMutations() {
  const qc = useQueryClient();
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['communication', 'journey'] });
  };

  return {
    updateStages: useMutation({
      mutationFn: async (stages: CustomerJourneyStage[]) => {
        if (IS_MOCK) {
          mockJourneyState.length = 0;
          mockJourneyState.push(...stages);
          return stages;
        }
        const response = await api.put('/communication/journey', { stages });
        return response.data;
      },
      onSuccess: () => invalidateAll(),
    }),
  };
}