import { Lead, LeadStatus } from './api';
export type { Lead, LeadStatus };

// ---------------------------------------------------------------------------
// Channel
// ---------------------------------------------------------------------------
export type CommunicationChannel = 'WHATSAPP' | 'SMS';

// ---------------------------------------------------------------------------
// Unified message status (used for both WhatsApp and SMS)
// Matches Prisma enum: CommunicationMessageStatus
// ---------------------------------------------------------------------------
export type CommunicationMessageStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'SENT'
  | 'FAILED'
  | 'CANCELLED';

// Legacy aliases kept for backward-compat in components that reference them
export type WhatsAppItemStatus = CommunicationMessageStatus;
export type SmsMessageStatus = CommunicationMessageStatus;

// ---------------------------------------------------------------------------
// Template status — matches Prisma: CommunicationTemplateStatus
// ---------------------------------------------------------------------------
export type TemplateStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

// ---------------------------------------------------------------------------
// Campaign status — matches Prisma: CampaignStatus
// ---------------------------------------------------------------------------
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

// ---------------------------------------------------------------------------
// Automation triggers — matches Prisma: AutomationTrigger
// ---------------------------------------------------------------------------
export type AutomationTrigger =
  | 'LEAD_CREATED'
  | 'STATUS_CHANGED_TO_INTERESTED'
  | 'STILL_INTERESTED_NOT_SUBSCRIBED'
  | 'BECAME_SUBSCRIBED'
  | 'BECAME_NOT_INTERESTED'
  | 'BEFORE_EXPIRY'
  | 'AFTER_EXPIRY';

// ---------------------------------------------------------------------------
// Automation actions — matches Prisma: AutomationAction
// ---------------------------------------------------------------------------
export type AutomationAction =
  | 'SEND_SMS'
  | 'CREATE_WHATSAPP_TASK'
  | 'STOP_LEAD_MESSAGES'
  | 'START_CUSTOMER_JOURNEY';

// ---------------------------------------------------------------------------
// Journey states (used for audience filtering)
// ---------------------------------------------------------------------------
export type JourneyState =
  | 'NEW'
  | 'CONTACTED'
  | 'VISITED'
  | 'INTERESTED'
  | 'FOLLOW_UP_REQUIRED'
  | 'NOT_INTERESTED'
  | 'SUBSCRIBED'
  | 'EXPIRED'
  | 'LOST_CLOSED';

// ---------------------------------------------------------------------------
// Not-interested policy — matches Prisma: NotInterestedPolicy
// ---------------------------------------------------------------------------
export type NotInterestedPolicy = 'NO_MESSAGES' | 'RE_ENGAGEMENT';

// ---------------------------------------------------------------------------
// Legacy types kept for backward-compat in components
// ---------------------------------------------------------------------------
export type QueueStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type RuleTarget = 'LEAD' | 'CUSTOMER';

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------
export type VariableField = 'businessName' | 'contactName' | 'location' | 'agentName';

export interface TemplateVariable {
  token: string;
  field: VariableField;
}

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { token: '[Business Name]', field: 'businessName' },
  { token: '[Contact Name]', field: 'contactName' },
  { token: '[Area]', field: 'location' },
  { token: '[Agent Name]', field: 'agentName' },
];

// ---------------------------------------------------------------------------
// Template — matches Prisma: CommunicationTemplate
// ---------------------------------------------------------------------------
export interface MessageTemplate {
  id: string;
  name: string;
  channel: CommunicationChannel;
  body: string;
  description?: string | null;
  status: TemplateStatus;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Backend wraps templates in: { data, total, smsMaxLength, supportedVariables, smsBlacklistedWords }
export interface TemplateListResponse {
  data: MessageTemplate[];
  total: number;
  smsMaxLength: number;
  supportedVariables: string[];
  smsBlacklistedWords: string[];
}

// ---------------------------------------------------------------------------
// Audience filter — matches backend AudienceFilterDto
// ---------------------------------------------------------------------------
export interface AudienceFilter {
  statuses?: JourneyState[];
  salespersonIds?: string[];
  location?: string;
  dateFilter?: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH';
  startDate?: string;
  endDate?: string;
  hasPhone?: boolean;
}

export const EMPTY_AUDIENCE: AudienceFilter = {
  statuses: [],
  salespersonIds: [],
  hasPhone: true,
};

// ---------------------------------------------------------------------------
// Audience estimate — matches backend GET /audience/preview response
// ---------------------------------------------------------------------------
export interface AudienceEstimate {
  totalMatches: number;
  eligibleCount: number;
  skippedFrequency: number;
  missingPhone: number;
}

// ---------------------------------------------------------------------------
// Outbound message — matches Prisma: CommunicationMessage + included lead
// ---------------------------------------------------------------------------
export interface OutboundMessage {
  id: string;
  leadId: string;
  lead?: {
    id: string;
    businessName: string | null;
    contactName: string | null;
    phone: string | null;
  } | null;
  phone?: string | null;
  channel: CommunicationChannel;
  type: string;
  status: CommunicationMessageStatus;
  body: string;
  variables?: Record<string, string | null> | null;
  templateId?: string | null;
  campaignId?: string | null;
  ruleId?: string | null;
  scheduledForAt?: string | null;
  preparedAt?: string | null;
  sentAt?: string | null;
  markedSentAt?: string | null;
  sentById?: string | null;
  createdById?: string | null;
  failureReason?: string | null;
  providerMessageId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Backend wraps messages in: { data, meta: { total, page, limit, totalPages } }
export interface MessageListResponse {
  data: OutboundMessage[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Legacy alias
export type PaginatedMessages = MessageListResponse;

// ---------------------------------------------------------------------------
// WhatsApp queue item — flat message object from GET /whatsapp/queue
// ---------------------------------------------------------------------------
export interface WhatsAppQueueItem {
  id: string;
  leadId: string;
  businessName: string | null;
  contactName: string | null;
  phone: string | null;
  location: string | null;
  body: string;
  deepLink: string | null;
  preparedAt: string | null;
  createdAt: string;
  type: string;
}

// Legacy queue types kept for backward-compat in components
export interface CommunicationQueueItem {
  id: string;
  queueId: string;
  lead: Partial<Lead> & { id: string; businessName: string | null };
  order: number;
  status: WhatsAppItemStatus;
  waLink: string;
  message: string;
  openedAt?: string;
  sentAt?: string;
}

export interface CommunicationQueue {
  id: string;
  name: string;
  channel: 'WHATSAPP';
  message: string;
  templateId?: string;
  totalItems: number;
  completedItems: number;
  status: QueueStatus;
  items: CommunicationQueueItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Campaign — matches Prisma: CommunicationCampaign
// ---------------------------------------------------------------------------
export interface Campaign {
  id: string;
  name: string;
  description?: string | null;
  channels: CommunicationChannel[];
  templateId?: string | null;
  body?: string | null;
  audienceFilters: AudienceFilter;
  status: CampaignStatus;
  startAt?: string | null;
  endAt?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Automation rule — matches Prisma: AutomationRule
// ---------------------------------------------------------------------------
export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  condition?: Record<string, unknown> | null;
  waitDays: number;
  action: AutomationAction;
  channel?: CommunicationChannel | null;
  templateId?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// Legacy alias for components that reference `enabled`
// (rule.enabled === rule.isActive in backend)
export interface AutomationRuleLegacy extends Omit<AutomationRule, 'isActive'> {
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Communication settings — matches Prisma: CommunicationSettings
// ---------------------------------------------------------------------------
export interface CommunicationSettings {
  id: string;
  smsEnabled: boolean;
  smsProvider: string;
  smsSenderId?: string | null;
  smsDailyCap: number;
  whatsappEnabled: boolean;
  minIntervalHours: number;
  maxMessagesPerContactPerDay: number;
  maxMessagesPerContactPerWeek: number;
  notInterestedPolicy: NotInterestedPolicy;
  reEngagementDelayDays: number;
  welcomeChannel: CommunicationChannel;
  welcomeBody?: string | null;
  smsBlacklistedWords: string[];
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Communication overview — matches backend GET /communication/overview
// ---------------------------------------------------------------------------
export interface CommunicationOverview {
  overview: {
    totalContacts: number;
    contactsEligibleForWhatsApp: number;
    whatsappFollowUpsPending: number;
    whatsappMessagesSent: number;
    smsSent: number;
    smsPending: number;
    smsFailed: number;
    scheduledMessages: number;
    activeCampaigns: number;
  };
  config: {
    totalTemplates: number;
    activeRules: number;
  };
}

// ---------------------------------------------------------------------------
// Sales today — matches backend GET /communication/sales/today
// ---------------------------------------------------------------------------
export interface SalesTodayItem {
  id: string;
  leadId: string;
  businessName: string | null;
  status: string | null;
  phone: string | null;
  channel: string;
  label: string;
  deepLink?: string | null;
  body: string;
  scheduledForAt?: string | null;
  createdAt: string;
}

export interface SalesTodayResponse {
  whatsappFollowUps: SalesTodayItem[];
  smsScheduled: SalesTodayItem[];
  total: number;
}

// ---------------------------------------------------------------------------
// Lead communication profile — matches backend GET /messages/contacts/:leadId
// ---------------------------------------------------------------------------
export interface LeadCommunication {
  lead: {
    id: string;
    businessName: string | null;
    contactName: string | null;
    phone: string | null;
    location: string | null;
    status: string;
    agentName: string | null;
    lastContactedAt: string | null;
    nextFollowUpAt: string | null;
  };
  communication: {
    whatsapp: {
      sent: number;
      pending: number;
      scheduled: number;
      failed: number;
      lastSent: string | null;
      nextScheduled: string | null;
    };
    sms: {
      sent: number;
      pending: number;
      scheduled: number;
      failed: number;
      lastSent: string | null;
      nextScheduled: string | null;
    };
  };
  history: {
    id: string;
    leadId: string;
    channel: CommunicationChannel;
    status: CommunicationMessageStatus;
    type: string;
    body: string;
    scheduledForAt?: string | null;
    sentAt?: string | null;
    preparedAt?: string | null;
    markedSentAt?: string | null;
    failureReason?: string | null;
    providerMessageId?: string | null;
    createdAt: string;
    updatedAt: string;
  }[];
}

// Legacy alias used by useLeadCommunication
export interface LeadCommunicationLegacy {
  leadId: string;
  salesStatus: LeadStatus;
  whatsapp: { sentCount: number; pendingCount: number; lastSent?: string };
  sms: { sentCount: number; pendingCount: number; lastSent?: string; nextScheduled?: string };
  history: OutboundMessage[];
}

// ---------------------------------------------------------------------------
// Customer Journey stages (frontend-only, no backend endpoint yet)
// ---------------------------------------------------------------------------
export interface CustomerJourneyStage {
  id: string;
  name: string;
  waitDays: number;
  channel: CommunicationChannel;
  templateId: string;
  enabled: boolean;
}

export const DEFAULT_JOURNEY_STAGES: Omit<CustomerJourneyStage, 'id'>[] = [
  { name: 'Welcome', waitDays: 0, channel: 'WHATSAPP', templateId: '', enabled: true },
  { name: 'Activation', waitDays: 3, channel: 'SMS', templateId: '', enabled: true },
  { name: 'Tips & Tricks', waitDays: 7, channel: 'WHATSAPP', templateId: '', enabled: true },
  { name: 'Feature Education', waitDays: 14, channel: 'SMS', templateId: '', enabled: true },
  { name: 'Referral', waitDays: 21, channel: 'WHATSAPP', templateId: '', enabled: true },
  { name: 'Renewal Reminder', waitDays: 28, channel: 'SMS', templateId: '', enabled: true },
  { name: 'Win-back', waitDays: 45, channel: 'WHATSAPP', templateId: '', enabled: true },
];

// ---------------------------------------------------------------------------
// Labels & colors
// ---------------------------------------------------------------------------

export const CHANNEL_LABELS: Record<CommunicationChannel, string> = {
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS',
};

export const CHANNEL_COLORS: Record<CommunicationChannel, { bg: string; text: string; border: string }> = {
  WHATSAPP: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  SMS: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
};

export const MESSAGE_STATUS_LABELS: Record<CommunicationMessageStatus, string> = {
  PENDING: 'Pending',
  SCHEDULED: 'Scheduled',
  SENT: 'Sent',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

export const MESSAGE_STATUS_COLORS: Record<CommunicationMessageStatus, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  SCHEDULED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  SENT: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  FAILED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  CANCELLED: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' },
};

// Legacy aliases
export const WHATSAPP_STATUS_LABELS = MESSAGE_STATUS_LABELS;
export const WHATSAPP_STATUS_COLORS = MESSAGE_STATUS_COLORS;
export const SMS_STATUS_LABELS = MESSAGE_STATUS_LABELS;
export const SMS_STATUS_COLORS = MESSAGE_STATUS_COLORS;

export const QUEUE_STATUS_LABELS: Record<QueueStatus, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const QUEUE_STATUS_COLORS: Record<QueueStatus, { bg: string; text: string; border: string }> = {
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  PAUSED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  COMPLETED: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export const TEMPLATE_STATUS_LABELS: Record<TemplateStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ARCHIVED: 'Archived',
};

export const TEMPLATE_STATUS_COLORS: Record<TemplateStatus, { bg: string; text: string; border: string }> = {
  ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  INACTIVE: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  ARCHIVED: { bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-200' },
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  ACTIVE: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  PAUSED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  COMPLETED: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export const AUTOMATION_TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  LEAD_CREATED: 'Lead Created',
  STATUS_CHANGED_TO_INTERESTED: 'Status Changed to Interested',
  STILL_INTERESTED_NOT_SUBSCRIBED: 'Still Interested, Not Subscribed',
  BECAME_SUBSCRIBED: 'Became Subscribed',
  BECAME_NOT_INTERESTED: 'Became Not Interested',
  BEFORE_EXPIRY: 'Before Expiry',
  AFTER_EXPIRY: 'After Expiry',
};

export const AUTOMATION_ACTION_LABELS: Record<AutomationAction, string> = {
  SEND_SMS: 'Send SMS',
  CREATE_WHATSAPP_TASK: 'Create WhatsApp Task',
  STOP_LEAD_MESSAGES: 'Stop Lead Messages',
  START_CUSTOMER_JOURNEY: 'Start Customer Journey',
};
