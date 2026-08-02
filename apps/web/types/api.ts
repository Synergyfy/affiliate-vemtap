export type Role = 'AFFILIATE' | 'ADMIN' | 'SUPER_ADMIN' | 'AGENT' | 'SUPERVISOR' | 'MANAGER';
export type BusinessStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type PlanType = 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
export type CommissionType = 'DIRECT' | 'INDIRECT' | 'BONUS';
export type CommissionStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
export type FraudStatus = 'OPEN' | 'CONFIRMED' | 'RESOLVED';
export type NotificationType = 'SYSTEM' | 'COMMISSION' | 'REFERRAL' | 'SECURITY';
export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type LeadStatus = 'POTENTIAL' | 'CONTACTED' | 'INTERESTED' | 'NOT_INTERESTED' | 'COMPLETED';

export interface Lead {
  id: string;
  businessName: string;
  industry: string;
  businessAddress?: string;
  location?: string;
  website?: string;
  contactName: string;
  contactRole?: string;
  phone: string;
  email?: string;
  source: string;
  otherSource?: string;
  priority: LeadPriority;
  status: LeadStatus;
  followUpDate?: string;
  comments?: string;
  affiliateId: string;
  assignedAgentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadStats {
  total: number;
  contacted: number;
  interested: number;
  potential: number;
}

export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: Meta;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  status: 'ACTIVE' | 'SUSPENDED';
  referralCode: string;
  createdAt: string;
  totalEarnings: number;
  pendingEarnings?: number;
  referralCount?: number;
  avatar?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  nin?: string;
  bvn?: string;
  kycStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  isManagerMode?: boolean;
  isTourCompleted?: boolean;
  driversLicense?: string;
  dailyLeadTarget?: number;
  monthlyConversionTarget?: number;
  reportingScore?: number;
  attendanceRate?: number;
  territoryId?: string;
  _count?: {
    referrals?: number;
    businesses?: number;
    leads?: number;
  };
}

export interface PlatformSettings {
  id: string;
  directCommissionRate: number;
  indirectCommissionRate: number;
  minWithdrawal: number;
  withdrawalFee: number;
  subAffiliateUnlockCount: number;
  fraudThresholdScore: number;
  earningDurationMonths: number;
  agreementTemplate?: string;
  agreementVersion?: number;
  updatedAt: string;
  reqAgentActiveDays?: number;
  reqAgentActiveBusinesses?: number;
  reqAgentMinReportingScore?: number;
  reqAgentMinAttendanceRate?: number;
  reqAffiliateActiveAgents?: number;
  reqAffiliateNetworkBusinesses?: number;
  reqSupervisorActiveAgents?: number;
  reqSupervisorActiveSupervisors?: number;
  reqSupervisorNetworkBusinesses?: number;
  dailyTarget?: number;
  weeklyTarget?: number;
  monthlyTarget?: number;
  recurringAgentCommission?: number;
  recurringAffiliateCommission?: number;
  recurringLineManagerCommission?: number;
  recurringDurationMonths?: number;
  recurringYear2Rate?: number;
  marketMappingConfig?: MarketMappingConfig;
}

export interface PipelineStatusConfig {
  id: string;
  name: string;
  color: string;
  bg: string;
  text: string;
}

export interface CustomerRangeConfig {
  value: string;
  label: string;
  min: number;
  max: number;
}

export interface BusinessSizeConfig {
  value: string;
  label: string;
  minStaff: number;
  maxStaff: number;
}

export interface MarketMappingConfig {
  businessCategories: string[];
  openingDays: string[];
  customerRanges: CustomerRangeConfig[];
  businessSizes: BusinessSizeConfig[];
  contactPositions: string[];
  pipelineStatuses: PipelineStatusConfig[];
  interestOptions: { value: string; label: string }[];
  planTypes: { value: string; label: string }[];
  faqs: { id: string; question: string; answer: string; category: string }[];
  ticketStatuses: { id: string; label: string; color: string; bg: string }[];
  businessStatuses: { id: string; label: string; color: string; bg: string }[];
  paymentStatuses: { id: string; label: string; color: string; bg: string }[];
  dailyTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
}

export interface Agreement {
  agreementTemplate: string;
  agreementVersion: number;
}

export interface Business {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  planType: PlanType;
  status: BusinessStatus;
  subscriptionAmount: number;
  commissionRate: number;
  commissionAmount: number;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  category?: string;
  affiliateId: string;
  affiliate?: User;
}

export interface Commission {
  id: string;
  amount: number;
  type: CommissionType;
  status: CommissionStatus;
  description: string;
  createdAt: string;
  paidAt?: string;
  userId: string;
  businessId: string;
  subAffiliateId?: string;
  user?: User;
  business?: Business;
}

export interface Withdrawal {
  id: string;
  amount: number;
  fee?: number;
  netAmount?: number;
  status: WithdrawalStatus;
  bankName: string;
  accountNumber: string;
  accountName: string;
  adminNotes?: string;
  processedAt?: string;
  processedBy?: string;
  createdAt: string;
  userId: string;
  user?: User;
}

export interface FraudAlert {
  id: string;
  userId: string;
  type: string;
  severity: string;
  description: string;
  status: FraudStatus;
  createdAt: string;
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  user?: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  user?: User;
}

export interface Quiz {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  audience?: string[];
  order: number;
}

export interface Scenario {
  title: string;
  situation: string;
  objection: string;
  idealResponse: string;
  options?: string[];
  correctAnswerIndex?: number;
  audience?: string[];
  order: number;
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  pdfUrl?: string;
  order: number;
  category: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  quizzes?: Quiz[];
  scenarios?: Scenario[];
}

export interface AdminStats {
  totalAffiliates: number;
  activeAffiliates: number;
  totalRevenue: number;
  commissionsPaid: number;
  pendingPayouts: number;
  approvedPayouts: number;
  completedPayouts: number;
  fraudAlerts: number;
  commissionsTrendPercentage: number;
  totalRevenueGrowth: number;
  totalAffiliatesGrowth: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface AffiliateStats {
  totalEarnings: number;
  pendingEarnings: number;
  todayEarnings: number;
  todayClicks: number;
  currentLevel: string;
  activeReferrals: number;
  referralCount: number;
  totalClicks: number;
  referralSignupUrl: string;
  // Agent target metrics
  dailyLeadTarget: number;
  monthlyConversionTarget: number;
  todayLeadsCount: number;
  monthlyLeadsCount: number;
  monthlyConversionsCount: number;
}

export interface AffiliateForecast {
  monthlyRecurringRevenue: number;
  activeBusinessCount: number;
  projectedEarnings: number;
}

export interface LeaderboardEntry {
  rank: number;
  fullName: string;
  totalEarnings: number;
  referralCount: number;
  trend?: 'up' | 'down' | 'stable';
  avatar?: string;
}

export interface NetworkStats {
  activeAgentsCount: number;
  newNetworkBusinessesCount: number;
  networkSize: number;
  isQualified: boolean;
  targetAgents: number;
  targetBusinesses: number;
}

export interface CustomAgreement {
  id: string;
  title: string;
  description: string;
  content: string;
  targetRoles: Role[];
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgreementSignature {
  id: string;
  agreementId: string;
  agreement?: CustomAgreement;
  userId: string;
  user?: User;
  version: number;
  signedAt: string;
}

export interface AgreementStats {
  agreementId: string;
  title: string;
  description: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  stats: {
    totalTargeted: number;
    totalSigned: number;
    totalPending: number;
    signedPercentage: number;
  };
  signatures: {
    userId: string;
    fullName: string;
    email: string;
    role: Role;
    signed: boolean;
    signedVersion: number | null;
    signedAt: string | null;
    isUpToDate: boolean;
  }[];
}

