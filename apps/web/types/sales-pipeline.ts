export type LeadQuality =
  | 'NEW'
  | 'QUALIFIED'
  | 'UNQUALIFIED'
  | 'INVALID'
  | 'DUPLICATE'
  | 'INTERESTED'
  | 'CONVERTED';

export type SalesPipelineStage =
  | 'NEW_LEAD'
  | 'VISITED'
  | 'CONTACTED'
  | 'INTERESTED'
  | 'DEMO_SCHEDULED'
  | 'PROPOSAL_SENT'
  | 'CUSTOMER';

export type SalesExitState =
  | 'NOT_INTERESTED'
  | 'LOST'
  | 'INVALID'
  | 'DUPLICATE';

export type FollowUpStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'RESCHEDULED'
  | 'CANCELLED';

export type FollowUpOutcome =
  | 'INTERESTED'
  | 'NEEDS_INFO'
  | 'DEMO_REQUESTED'
  | 'NOT_INTERESTED'
  | 'RESCHEDULE'
  | 'CONVERTED'
  | 'LOST';

export type DemoStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type DemoOutcome =
  | 'INTERESTED'
  | 'NEEDS_FOLLOW_UP'
  | 'NOT_INTERESTED'
  | 'READY_TO_SUBSCRIBE';

export interface LeadQualityInfo {
  quality: LeadQuality;
  score: number;
  assessedAt?: string;
  assessedBy?: string;
  reason?: string;
}

export interface SalesActivity {
  id: string;
  type: 'VISIT' | 'CALL' | 'EMAIL' | 'MESSAGE' | 'MEETING';
  title: string;
  description?: string;
  createdAt: string;
  duration?: number;
}

export interface FollowUp {
  id: string;
  leadId: string;
  scheduledDate: string;
  scheduledTime?: string;
  actualDate?: string;
  status: FollowUpStatus;
  outcome?: FollowUpOutcome;
  notes?: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Demo {
  id: string;
  leadId: string;
  scheduledDate: string;
  scheduledTime?: string;
  type: 'VIRTUAL' | 'ONSITE';
  meetingUrl?: string;
  status: DemoStatus;
  outcome?: DemoOutcome;
  notes?: string;
  completedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesPipelineEntry {
  id: string;
  businessName: string;
  brandName?: string;
  industry: string;
  businessAddress?: string;
  location?: string;
  website?: string;
  contactName?: string;
  contactRole?: string;
  phone: string;
  email?: string;
  source: string;
  pipelineStage: SalesPipelineStage;
  exitState?: SalesExitState;
  leadQuality?: LeadQuality;
  leadQualityInfo?: LeadQualityInfo;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  subscriptionInterest?: boolean;
  followUpDate?: string;
  demoScheduledDate?: string;
  assignedAgentId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  activities?: SalesActivity[];
  followUps?: FollowUp[];
  demos?: Demo[];
}

export interface SalesMetrics {
  leadsSubmitted: number;
  validLeads: number;
  qualifiedLeads: number;
  interestedLeads: number;
  followUps: number;
  demos: number;
  conversions: number;
  notInterested: number;
  lost: number;
  invalid: number;
  duplicate: number;
}

export interface SalesMetricsResponse {
  metrics: SalesMetrics;
  date: string;
  agentId?: string;
}

export interface DuplicateWarning {
  isMatch: boolean;
  existingBusiness?: {
    id: string;
    businessName: string;
    status: string;
    leadQuality?: LeadQuality;
    contactName?: string;
    phone?: string;
  };
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reason?: string;
}

export interface DuplicateCheckRequest {
  businessName: string;
  phone?: string;
  email?: string;
  address?: string;
}

export const LEAD_QUALITY_LABELS: Record<LeadQuality, string> = {
  NEW: 'New',
  QUALIFIED: 'Qualified',
  UNQUALIFIED: 'Unqualified',
  INVALID: 'Invalid',
  DUPLICATE: 'Duplicate',
  INTERESTED: 'Interested',
  CONVERTED: 'Converted',
};

export const LEAD_QUALITY_COLORS: Record<LeadQuality, { bg: string; text: string; border: string }> = {
  NEW: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  QUALIFIED: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  UNQUALIFIED: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
  INVALID: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  DUPLICATE: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  INTERESTED: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  CONVERTED: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
};

export const PIPELINE_STAGES: Record<SalesPipelineStage, { label: string; color: string; icon: string }> = {
  NEW_LEAD: { label: 'New Lead', color: 'bg-slate-500', icon: 'Plus' },
  VISITED: { label: 'Visited', color: 'bg-blue-500', icon: 'MapPin' },
  CONTACTED: { label: 'Contacted', color: 'bg-purple-500', icon: 'Phone' },
  INTERESTED: { label: 'Interested', color: 'bg-emerald-500', icon: 'CheckCircle' },
  DEMO_SCHEDULED: { label: 'Demo Scheduled', color: 'bg-indigo-500', icon: 'PlayCircle' },
  PROPOSAL_SENT: { label: 'Proposal Sent', color: 'bg-orange-500', icon: 'Clock' },
  CUSTOMER: { label: 'Customer', color: 'bg-amber-500', icon: 'Star' },
};

export const PIPELINE_ORDER: SalesPipelineStage[] = [
  'NEW_LEAD',
  'VISITED',
  'CONTACTED',
  'INTERESTED',
  'DEMO_SCHEDULED',
  'PROPOSAL_SENT',
  'CUSTOMER',
];

export const EXIT_STATE_LABELS: Record<SalesExitState, string> = {
  NOT_INTERESTED: 'Not Interested',
  LOST: 'Lost',
  INVALID: 'Invalid',
  DUPLICATE: 'Duplicate',
};

export function getPipelineProgress(stage: SalesPipelineStage): { current: number; total: number } {
  const idx = PIPELINE_ORDER.indexOf(stage);
  return { current: idx + 1, total: PIPELINE_ORDER.length };
}

export function canTransitionToStage(current: SalesPipelineStage, next: SalesPipelineStage): boolean {
  const currentIndex = PIPELINE_ORDER.indexOf(current);
  const nextIndex = PIPELINE_ORDER.indexOf(next);
  return nextIndex > currentIndex;
}
