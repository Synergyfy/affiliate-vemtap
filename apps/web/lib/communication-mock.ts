import {
  AudienceEstimate,
  AudienceFilter,
  AutomationRule,
  Campaign,
  CommunicationChannel,
  CommunicationOverview,
  CommunicationQueue,
  CommunicationQueueItem,
  CustomerJourneyStage,
  LeadCommunication,
  MessageTemplate,
  OutboundMessage,
} from '@/types/communication';
import { Lead } from '@/types/api';
import { buildWhatsAppLink, substituteVariables } from './communication';

// ---------------------------------------------------------------------------
// Lead fixtures (mirror-of-Harvest style)
// ---------------------------------------------------------------------------

function leadFixture(
  partial: Partial<Lead> & { id: string; businessName: string; phone?: string | null },
  overrides?: Partial<Lead>,
): Lead {
  return {
    userId: 'usr-mock',
    user: { id: 'usr-mock', fullName: 'John', email: 'john@vemtap.com', phone: '08000000000', role: 'AGENT', status: 'ACTIVE', referralCode: 'JOHN', createdAt: new Date().toISOString(), totalEarnings: 0 },
    industry: '',
    businessAddress: null,
    location: 'Apo',
    contactName: null,
    contactRole: null,
    email: null,
    source: 'Market Mapping',
    priority: 'MEDIUM',
    status: 'INTERESTED',
    followUpDate: null,
    comments: null,
    assignedAgentId: null,
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    visited: false,
    ...partial,
    ...overrides,
  } as Lead;
}

export const mockLeadFixtures: Lead[] = [
  leadFixture({ id: 'ld-001', businessName: 'ABC Restaurant', phone: '08011111111', industry: 'Restaurant', contactName: 'Mr. Musa', location: 'Apo', status: 'INTERESTED' }),
  leadFixture({ id: 'ld-002', businessName: 'XYZ Fashion', phone: '08022222222', industry: 'Fashion / Boutique', contactName: 'Mrs. Bola', location: 'Apo', status: 'INTERESTED' }),
  leadFixture({ id: 'ld-003', businessName: 'John\'s Pharmacy', phone: '08033333333', industry: 'Pharmacy', contactName: 'Pharm. John', location: 'Apo', status: 'INTERESTED' }),
  leadFixture({ id: 'ld-004', businessName: 'Grand Square Supermarket', phone: '08044444444', industry: 'Supermarket / Grocery', contactName: 'Mrs. Adeola', location: 'Garki', status: 'INTERESTED' }),
  leadFixture({ id: 'ld-005', businessName: 'TechHub Accessories', phone: '08055555555', industry: 'Electronics', contactName: 'Mr. Emeka', location: 'Apo', status: 'VISITED' }),
  leadFixture({ id: 'ld-006', businessName: 'HealthPlus Pharmacy', phone: '08066666666', industry: 'Pharmacy', contactName: 'Pharm. Sarah', location: 'Guzape', status: 'CUSTOMER' }),
  leadFixture({ id: 'ld-007', businessName: 'Elite Beauty Salon', phone: '08077777777', industry: 'Beauty / Salon', contactName: 'Ms. Grace', location: 'Wuse', status: 'NOT_INTERESTED' }),
  leadFixture({ id: 'ld-008', businessName: 'Kings Fast Food', phone: null, industry: 'Restaurant', contactName: null, location: 'Apo', status: 'CONTACTED' }),
];

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export let mockTemplatesState: MessageTemplate[] = [
  {
    id: 'tpl-001',
    name: 'Interested Lead – First Follow-up',
    channel: 'WHATSAPP',
    body: 'Hi, thanks again for your interest in VEMTAP. We\'d love to have you onboard. Let us know if you have any questions.',
    status: 'ACTIVE',
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'tpl-002',
    name: 'Interested – Demo Invite',
    channel: 'WHATSAPP',
    body: 'Hi [Business Name], would you like a quick 10-minute demo of VEMTAP? [Agent Name] would be happy to walk you through it.',
    status: 'ACTIVE',
    createdAt: '2026-08-02T09:00:00Z',
    updatedAt: '2026-08-02T09:00:00Z',
  },
  {
    id: 'tpl-003',
    name: 'August New Business Offer',
    channel: 'SMS',
    body: 'Special offer: Get 20% off your first VEMTAP subscription when you register today.',
    status: 'ACTIVE',
    createdAt: '2026-08-03T09:00:00Z',
    updatedAt: '2026-08-03T09:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Queue state
// ---------------------------------------------------------------------------

const INTERESTED_POOL = mockLeadFixtures.filter((l) => l.status === 'INTERESTED' && l.phone);

function buildQueueItems(queueId: string, leads: Lead[], body: string): CommunicationQueueItem[] {
  return leads.map((lead, idx) => ({
    id: `${queueId}-item-${idx + 1}`,
    queueId,
    lead,
    order: idx + 1,
    status: 'SENT' as const,
    waLink: buildWhatsAppLink(lead.phone, substituteVariables(body, lead)),
    message: substituteVariables(body, lead),
    sentAt: new Date().toISOString(),
  }));
}

export let mockQueuesState: CommunicationQueue[] = [
  {
    id: 'que-001',
    name: 'Interested — Apo follow-up',
    channel: 'WHATSAPP',
    message:
      'Hi, thanks again for your interest in VEMTAP. We\'d love to have you onboard. Let us know if you have any questions.',
    templateId: 'tpl-001',
    totalItems: INTERESTED_POOL.length,
    completedItems: INTERESTED_POOL.length,
    status: 'COMPLETED',
    items: buildQueueItems('que-001', INTERESTED_POOL.slice(0, 2), 'Hi, thanks again for your interest in VEMTAP. We\'d love to have you onboard.'),
    createdBy: 'Admin',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Message log
// ---------------------------------------------------------------------------

export let mockMessagesState: OutboundMessage[] = [
  {
    id: 'msg-001',
    leadId: 'ld-001',
    lead: { id: 'ld-001', businessName: 'ABC Restaurant', phone: '08011111111', contactName: 'Mr. Musa' },
    channel: 'WHATSAPP',
    type: 'MANUAL',
    templateId: 'tpl-001',
    body: 'Hi, thanks again for your interest in VEMTAP...',
    status: 'SENT',
    sentAt: '2026-08-18T10:17:00Z',
    sentById: 'usr-mock',
    createdAt: '2026-08-18T10:15:00Z',
    updatedAt: '2026-08-18T10:17:00Z',
  },
  {
    id: 'msg-002',
    leadId: 'ld-001',
    lead: { id: 'ld-001', businessName: 'ABC Restaurant', phone: '08011111111', contactName: 'Mr. Musa' },
    channel: 'SMS',
    type: 'AUTOMATION',
    templateId: 'tpl-003',
    body: 'Special offer: Get 20% off...',
    status: 'SENT',
    sentAt: '2026-08-18T12:00:00Z',
    sentById: null,
    createdAt: '2026-08-18T12:00:00Z',
    updatedAt: '2026-08-18T12:00:00Z',
  },
  {
    id: 'msg-003',
    leadId: 'ld-002',
    lead: { id: 'ld-002', businessName: 'XYZ Fashion', phone: '08022222222', contactName: 'Mrs. Bola' },
    channel: 'SMS',
    type: 'AUTOMATION',
    templateId: 'tpl-003',
    body: 'Special offer: Get 20% off...',
    status: 'SCHEDULED',
    scheduledForAt: '2026-08-21T09:00:00Z',
    sentById: null,
    createdAt: '2026-08-18T12:05:00Z',
    updatedAt: '2026-08-18T12:05:00Z',
  },
];

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export const mockOverviewState: CommunicationOverview = {
  overview: {
    totalContacts: mockLeadFixtures.length,
    contactsEligibleForWhatsApp: mockLeadFixtures.filter((l) => l.phone).length,
    whatsappFollowUpsPending: 47,
    whatsappMessagesSent: 128,
    smsSent: 340,
    smsPending: 12,
    smsFailed: 3,
    scheduledMessages: 6,
    activeCampaigns: 1,
  },
  config: {
    totalTemplates: mockTemplatesState.length,
    activeRules: 2,
  },
};

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

export function mockAudienceEstimate(filters: AudienceFilter | null): AudienceEstimate {
  if (!filters) return { totalMatches: 0, eligibleCount: 0, skippedFrequency: 0, missingPhone: 0 };
  let pool = [...mockLeadFixtures];
  if (filters.statuses && filters.statuses.length > 0) {
    pool = pool.filter((l) => filters.statuses!.includes(l.status as any));
  }
  if (filters.location) {
    pool = pool.filter((l) => l.location === filters.location);
  }
  if (filters.hasPhone) {
    pool = pool.filter((l) => !!l.phone);
  }
  const missingPhone = [...mockLeadFixtures].filter((l) => !l.phone).length;
  return {
    totalMatches: pool.length * 3,
    eligibleCount: pool.length,
    skippedFrequency: filters.statuses?.includes('INTERESTED' as any) ? Math.max(0, pool.length - 4) : 0,
    missingPhone,
  };
}

export function mockLeadCommunication(leadId: string): LeadCommunication {
  const lead = mockLeadFixtures.find((l) => l.id === leadId) || mockLeadFixtures[0];
  const history = mockMessagesState
    .filter((m) => m.leadId === leadId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const whatsapp = history.filter((m) => m.channel === 'WHATSAPP');
  const sms = history.filter((m) => m.channel === 'SMS');
  return {
    lead: {
      id: lead.id,
      businessName: lead.businessName ?? null,
      contactName: lead.contactName ?? null,
      phone: lead.phone ?? null,
      location: lead.location ?? null,
      status: lead.status,
      agentName: null,
      lastContactedAt: whatsapp.find((m) => m.status === 'SENT')?.sentAt || null,
      nextFollowUpAt: null,
    },
    communication: {
      whatsapp: {
        sent: whatsapp.filter((m) => m.status === 'SENT').length,
        pending: whatsapp.filter((m) => m.status === 'PENDING').length,
        scheduled: whatsapp.filter((m) => m.status === 'SCHEDULED').length,
        failed: whatsapp.filter((m) => m.status === 'FAILED').length,
        lastSent: whatsapp.find((m) => m.status === 'SENT')?.sentAt || null,
        nextScheduled: null,
      },
      sms: {
        sent: sms.filter((m) => m.status === 'SENT').length,
        pending: sms.filter((m) => m.status === 'PENDING').length,
        scheduled: sms.filter((m) => m.status === 'SCHEDULED').length,
        failed: sms.filter((m) => m.status === 'FAILED').length,
        lastSent: sms.find((m) => m.status === 'SENT')?.sentAt || null,
        nextScheduled: sms.find((m) => m.status === 'SCHEDULED')?.scheduledForAt || null,
      },
    },
    history: history.map((m) => ({
      id: m.id,
      leadId: m.leadId,
      channel: m.channel,
      status: m.status,
      type: m.type,
      body: m.body,
      scheduledForAt: m.scheduledForAt,
      sentAt: m.sentAt,
      preparedAt: null,
      markedSentAt: null,
      failureReason: null,
      providerMessageId: null,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    })),
  };
}

export function mockChannelMessages(channel: CommunicationChannel) {
  return mockMessagesState
    .filter((m) => m.channel === channel)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export const MOCK_PROGRESS_MESSAGE =
  'Hi, thanks again for your interest in VEMTAP. We\'d love to have you onboard. Let us know if you have any questions.';

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export let mockCampaignsState: Campaign[] = [
  {
    id: 'cmp-001',
    name: 'August New Business Push',
    description: 'New business push for August',
    channels: ['WHATSAPP', 'SMS'],
    templateId: 'tpl-001',
    body: null,
    audienceFilters: { statuses: ['INTERESTED'], location: 'Apo', hasPhone: true },
    status: 'ACTIVE',
    startAt: '2026-08-01T00:00:00Z',
    endAt: '2026-08-31T23:59:59Z',
    createdById: 'usr-mock',
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'cmp-002',
    name: 'September Re-engagement',
    description: 'Re-engagement campaign',
    channels: ['SMS'],
    templateId: 'tpl-003',
    body: null,
    audienceFilters: { statuses: ['VISITED', 'CONTACTED'], hasPhone: true },
    status: 'DRAFT',
    startAt: '2026-09-01T00:00:00Z',
    endAt: '2026-09-30T23:59:59Z',
    createdById: 'usr-mock',
    createdAt: '2026-08-15T14:00:00Z',
    updatedAt: '2026-08-15T14:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Automation rules
// ---------------------------------------------------------------------------

export let mockRulesState: AutomationRule[] = [
  {
    id: 'rule-001',
    name: 'Welcome Interested Leads',
    trigger: 'STATUS_CHANGED_TO_INTERESTED',
    condition: null,
    waitDays: 0,
    action: 'SEND_SMS',
    channel: 'WHATSAPP',
    templateId: 'tpl-001',
    isActive: true,
    sortOrder: 0,
    createdAt: '2026-08-01T09:00:00Z',
    updatedAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 'rule-002',
    name: 'Follow-up after 3 days',
    trigger: 'STILL_INTERESTED_NOT_SUBSCRIBED',
    condition: null,
    waitDays: 3,
    action: 'SEND_SMS',
    channel: 'SMS',
    templateId: 'tpl-003',
    isActive: true,
    sortOrder: 1,
    createdAt: '2026-08-02T09:00:00Z',
    updatedAt: '2026-08-02T09:00:00Z',
  },
  {
    id: 'rule-003',
    name: 'Customer Welcome',
    trigger: 'BECAME_SUBSCRIBED',
    condition: null,
    waitDays: 0,
    action: 'START_CUSTOMER_JOURNEY',
    channel: 'WHATSAPP',
    templateId: 'tpl-001',
    isActive: false,
    sortOrder: 2,
    createdAt: '2026-08-03T09:00:00Z',
    updatedAt: '2026-08-03T09:00:00Z',
  },
];

// ---------------------------------------------------------------------------
// Customer Journey stages (mock)
// ---------------------------------------------------------------------------

export const mockJourneyState: CustomerJourneyStage[] = [
  { id: 'stage-001', name: 'Welcome', waitDays: 0, channel: 'WHATSAPP', templateId: 'tpl-001', enabled: true },
  { id: 'stage-002', name: 'Activation', waitDays: 3, channel: 'SMS', templateId: 'tpl-003', enabled: true },
  { id: 'stage-003', name: 'Tips & Tricks', waitDays: 7, channel: 'WHATSAPP', templateId: 'tpl-001', enabled: true },
  { id: 'stage-004', name: 'Feature Education', waitDays: 14, channel: 'SMS', templateId: 'tpl-003', enabled: false },
];