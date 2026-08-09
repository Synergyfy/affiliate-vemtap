export type VisitOutcome = 'INTERESTED' | 'NOT_INTERESTED' | 'MANAGER_UNAVAILABLE' | 'FOLLOW_UP_REQUIRED' | 'OTHER';

export type GpsVerificationStatus = 'VERIFIED' | 'CHECKING' | 'PERMISSION_DENIED' | 'UNAVAILABLE' | 'NETWORK_ERROR' | 'NOT_STARTED';

export type TransitionStatus = 'NORMAL' | 'UNUSUAL_DISTANCE' | 'UNUSUAL_TIME' | 'BOTH_UNUSUAL';

export interface FieldBusiness {
  id: string;
  name: string;
  category: string;
  address: string;
  exactAddress?: string;
  phone?: string;
  ownerName?: string;
  contactPosition?: string;
  contactEmail?: string;
  dailyCustomers?: string;
  businessSize?: string;
  isAnchor?: boolean;
  isPlaceholder?: boolean;
  status: 'NOT_YET' | 'VISITING' | 'VISITED' | 'COMPLETED';
  visitOutcome?: VisitOutcome;
  visitNotes?: string;
  gpsLat?: number;
  gpsLng?: number;
  gpsAccuracy?: number;
  gpsStatus?: GpsVerificationStatus;
  startedAt?: string;
  completedAt?: string;
  durationMinutes?: number;
}

export interface FieldMission {
  id: string;
  name: string;
  location: string;
  targetCount: number;
  businesses: FieldBusiness[];
  horizon: 'DAY' | 'WEEK';
  startedAt?: string;
  completedAt?: string;
}

export interface VisitTransition {
  previousVisit: {
    id: string;
    name: string;
    completedAt: string;
    gpsLat?: number;
    gpsLng?: number;
  } | null;
  currentVisit: {
    id: string;
    name: string;
    startedAt: string;
    gpsLat?: number;
    gpsLng?: number;
  } | null;
  distanceMeters?: number;
  timeBetweenMinutes?: number;
  status: TransitionStatus;
  exceptionSubmitted?: boolean;
}

export interface FieldActivityTimelineEvent {
  id: string;
  type: 'WORK_STARTED' | 'VISIT_STARTED' | 'VISIT_COMPLETED' | 'LEAD_CAPTURED' | 'TRANSITION_UNUSUAL' | 'WORK_ENDED';
  businessName?: string;
  timestamp: string;
  details?: string;
  status: 'NORMAL' | 'WARNING' | 'INFO';
}

export interface MissionProgress {
  totalBusinesses: number;
  visitedCount: number;
  leadsCaptured: number;
  interestedCount: number;
  followUps: number;
  conversions: number;
  remaining: number;
  percentComplete: number;
}

export interface StartVisitPayload {
  businessId: string;
  missionId: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

export interface CompleteVisitPayload {
  visitId: string;
  businessId: string;
  outcome: VisitOutcome;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  notes?: string;
  leadData?: {
    businessName: string;
    category: string;
    contactName: string;
    phone: string;
    email?: string;
    subscriptionInterest: boolean;
  };
}

export interface VisitStatusResponse {
  visitId: string;
  business: FieldBusiness;
  mission: FieldMission;
  transition?: VisitTransition;
  progress: MissionProgress;
}

export interface FieldActivityApi {
  getActiveMission: () => Promise<FieldMission | null>;
  startVisit: (payload: StartVisitPayload) => Promise<{ visitId: string }>;
  completeVisit: (payload: CompleteVisitPayload) => Promise<{ visitId: string; transition?: VisitTransition }>;
  getVisitStatus: (visitId: string) => Promise<VisitStatusResponse>;
  getMissionProgress: (missionId: string) => Promise<MissionProgress>;
  getTimeline: (missionId: string) => Promise<FieldActivityTimelineEvent[]>;
  submitTransitionExplanation: (visitId: string, explanation: { reason: string; notes?: string }) => Promise<void>;
}