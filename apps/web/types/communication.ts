import { Lead, LeadStatus } from './api';
export type { Lead, LeadStatus };

export type CommunicationChannel = 'WHATSAPP' | 'SMS';

// WhatsApp assisted-send lifecycle
export type WhatsAppItemStatus = 'PENDING' | 'OPENED' | 'SENT' | 'SKIPPED' | 'FAILED';

// SMS lifecycle
export type SmsMessageStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type QueueStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type TemplateStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'ARCHIVED';
export type RuleTarget = 'LEAD' | 'CUSTOMER';
export type NotInterestedPolicy = 'QUIET' | 'RE_ENGAGEMENT';

export type VariableField = 'businessName' | 'contactName' | 'location' | 'agentName';

export interface TemplateVariable {
  token: string;
  field: VariableField;
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: CommunicationChannel;
  body: string;
  description?: string;
  variables: TemplateVariable[];
  status: TemplateStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AudienceDateAdded {
  range: 'today' | 'week' | 'month' | 'custom';
  from?: string;
  to?: string;
}

export interface AudienceFilter {
  statuses?: LeadStatus[];
  salespeople?: string[];
  locations?: string[];
  dateAdded?: AudienceDateAdded;
  hasPhone?: boolean;
  excludeSubscribed?: boolean;
  excludeNotInterested?: boolean;
}

export const EMPTY_AUDIENCE: AudienceFilter = {
  statuses: [],
  salespeople: [],
  locations: [],
  dateAdded: undefined,
  hasPhone: true,
  excludeSubscribed: true,
  excludeNotInterested: true,
};

export interface AudienceEstimate {
  count: number;
  overMessagingCount: number;
  warnings: string[];
}

export interface CommunicationQueueItem {
  id: string;
  queueId: string;
  lead: Lead;
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

export interface OutboundMessage {
  id: string;
  leadId: string;
  lead?: Pick<Lead, 'id' | 'businessName' | 'phone' | 'contactName' | 'location'>;
  channel: CommunicationChannel;
  templateId?: string;
  body: string;
  status: SmsMessageStatus | WhatsAppItemStatus;
  scheduledAt?: string;
  sentAt?: string;
  externalId?: string;
  sentBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  audience: AudienceFilter;
  channels: CommunicationChannel[];
  templateIds: string[];
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  target: RuleTarget;
  trigger:
    | { type: 'STATUS_CHANGED'; toStatus: LeadStatus }
    | { type: 'STATUS_STILL_AFTER_DAYS'; status: LeadStatus; waitDays: number; andNotSubscribed: boolean }
    | { type: 'SUBSCRIBED' };
  channel: CommunicationChannel;
  templateId: string;
  enabled: boolean;
}

export interface CommunicationSettings {
  smsEnabled: boolean;
  smsProviderConfigured: boolean;
  marketingPaused: boolean;
  frequencyMaxPerWindow: number;
  frequencyWindowDays: number;
  notInterestedPolicy: NotInterestedPolicy;
  autoSmsOnStatus: LeadStatus | null;
  defaultSenderLabel?: string;
}

export interface LeadCommunication {
  leadId: string;
  salesStatus: LeadStatus;
  whatsapp: { sentCount: number; pendingCount: number; lastSent?: string };
  sms: { sentCount: number; pendingCount: number; lastSent?: string; nextScheduled?: string };
  history: OutboundMessage[];
}

export interface CommunicationOverview {
  totalContacts: number;
  whatsappEligible: number;
  whatsappPending: number;
  whatsappSent: number;
  smsSent: number;
  smsPending: number;
  smsFailed: number;
  scheduledMessages: number;
  activeCampaigns: number;
}

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

export const WHATSAPP_STATUS_LABELS: Record<WhatsAppItemStatus, string> = {
  PENDING: 'Pending',
  OPENED: 'Opened',
  SENT: 'Sent',
  SKIPPED: 'Skipped',
  FAILED: 'Failed',
};

export const WHATSAPP_STATUS_COLORS: Record<WhatsAppItemStatus, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  OPENED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  SENT: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  SKIPPED: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' },
  FAILED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export const SMS_STATUS_LABELS: Record<SmsMessageStatus, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  SENDING: 'Sending',
  SENT: 'Sent',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

export const SMS_STATUS_COLORS: Record<SmsMessageStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  SCHEDULED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  SENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  SENT: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  DELIVERED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  FAILED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  CANCELLED: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' },
};

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
  ENDED: 'Ended',
  ARCHIVED: 'Archived',
};

export const CAMPAIGN_STATUS_COLORS: Record<CampaignStatus, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  ACTIVE: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  PAUSED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ENDED: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  ARCHIVED: { bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-200' },
};

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { token: '[Business Name]', field: 'businessName' },
  { token: '[Contact Name]', field: 'contactName' },
  { token: '[Area]', field: 'location' },
  { token: '[Agent Name]', field: 'agentName' },
];

// Customer Journey stages
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