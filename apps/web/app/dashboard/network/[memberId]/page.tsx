'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, User, Phone, Mail, TrendingUp, Target,
  Activity, CheckCircle2, AlertCircle, Shield,
  BarChart3, History, FileText, DollarSign, ArrowUpDown,
  ChevronRight, ChevronDown, Loader2, Users,
  ArrowUpCircle, ArrowDownCircle, Save, ArrowRight,
  Share2, Download, ChevronUp, Award
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/toast';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api-client';
import {
  downloadReportAsPdf,
  shareReport as exportShare,
  ReportExportData,
} from '@/lib/report-export';
import { getReportComments } from '@/lib/report-comments';
import ReportComments from '@/components/dashboard/ReportComments';

interface ActivityEntry {
  id: string; type: 'lead' | 'conversion' | 'report' | 'target_change' | 'referral' | 'business';
  description: string; date: string; amount?: number;
  changedBy?: string; changedById?: string;
}

interface TargetAdjustment {
  id: string; field: 'dailyLeadTarget' | 'monthlyConversionTarget';
  oldValue: number; newValue: number; changedBy: string;
  changedById: string; changedAt: string; reason?: string;
}

interface TeamMember {
  id: string; name: string; role: 'AGENT' | 'AFFILIATE';
  email: string; phone: string; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  dailyLeads: number; weeklyLeads: number; monthlyConversions: number;
  completionRate: number; lastActive: string; earnings: number;
  totalEarnings: number; joinedDate: string;
  dailyLeadTarget: number; monthlyConversionTarget: number;
  activities: ActivityEntry[]; targetAdjustments: TargetAdjustment[];
  businessesReferred: number; leadsSubmitted: number;
}

const mockTeamMembers: Record<string, TeamMember> = {
  'tm-1': {
    id: 'tm-1', name: 'Chioma Okafor', role: 'AGENT', email: 'chioma.o@example.com',
    phone: '+234 801 234 5678', status: 'ACTIVE', dailyLeads: 5, weeklyLeads: 28,
    monthlyConversions: 12, completionRate: 85, lastActive: '2026-07-28', earnings: 125000,
    totalEarnings: 540000, joinedDate: '2025-11-15', dailyLeadTarget: 6, monthlyConversionTarget: 15,
    businessesReferred: 8, leadsSubmitted: 34,
    activities: [
      { id: 'act-1', type: 'report', description: 'Submitted daily performance report', date: new Date(Date.now() - 2*3600000).toISOString() },
      { id: 'act-2', type: 'lead', description: 'Captured new lead: Alhaji Enterprises', date: new Date(Date.now() - 5*3600000).toISOString(), amount: 1 },
      { id: 'act-3', type: 'conversion', description: 'Closed deal: Mama Cass Kitchen (₦15,000)', date: new Date(Date.now() - 24*3600000).toISOString(), amount: 15000 },
      { id: 'act-4', type: 'business', description: 'Registered business: De-Royal Choice Supermarket', date: new Date(Date.now() - 48*3600000).toISOString() },
      { id: 'act-6', type: 'target_change', description: 'Target adjusted by you', date: new Date(Date.now() - 120*3600000).toISOString(), changedBy: 'You' },
    ],
    targetAdjustments: [
      { id: 'ta-1', field: 'dailyLeadTarget', oldValue: 5, newValue: 6, changedBy: 'You', changedById: 'current-user', changedAt: '2026-06-15T10:00:00Z', reason: 'Increased due to strong performance' },
      { id: 'ta-2', field: 'monthlyConversionTarget', oldValue: 12, newValue: 15, changedBy: 'You', changedById: 'current-user', changedAt: '2026-06-15T10:00:00Z', reason: 'Aligning with growth trajectory' },
    ]
  },
  'tm-2': {
    id: 'tm-2', name: 'Emeka Nwosu', role: 'AGENT', email: 'emeka.n@example.com',
    phone: '+234 802 345 6789', status: 'ACTIVE', dailyLeads: 3, weeklyLeads: 18,
    monthlyConversions: 8, completionRate: 72, lastActive: '2026-07-27', earnings: 85000,
    totalEarnings: 310000, joinedDate: '2025-12-01', dailyLeadTarget: 5, monthlyConversionTarget: 12,
    businessesReferred: 5, leadsSubmitted: 22,
    activities: [
      { id: 'act-1', type: 'report', description: 'Submitted daily performance report', date: new Date(Date.now() - 2*3600000).toISOString() },
      { id: 'act-2', type: 'lead', description: 'Captured new lead: Alhaji Enterprises', date: new Date(Date.now() - 5*3600000).toISOString(), amount: 1 },
      { id: 'act-3', type: 'conversion', description: 'Closed deal: Mama Cass Kitchen (₦15,000)', date: new Date(Date.now() - 24*3600000).toISOString(), amount: 15000 },
    ],
    targetAdjustments: []
  },
  'tm-3': {
    id: 'tm-3', name: 'Bisi Adeyemi', role: 'AFFILIATE', email: 'bisi.a@example.com',
    phone: '+234 803 456 7890', status: 'ACTIVE', dailyLeads: 7, weeklyLeads: 35,
    monthlyConversions: 15, completionRate: 90, lastActive: '2026-07-28', earnings: 210000,
    totalEarnings: 890000, joinedDate: '2025-10-20', dailyLeadTarget: 8, monthlyConversionTarget: 18,
    businessesReferred: 12, leadsSubmitted: 45,
    activities: [
      { id: 'act-1', type: 'report', description: 'Submitted daily performance report', date: new Date(Date.now() - 2*3600000).toISOString() },
      { id: 'act-2', type: 'lead', description: 'Captured new lead: Alhaji Enterprises', date: new Date(Date.now() - 5*3600000).toISOString(), amount: 1 },
    ],
    targetAdjustments: [
      { id: 'ta-3', field: 'dailyLeadTarget', oldValue: 7, newValue: 8, changedBy: 'System', changedById: 'system', changedAt: '2026-05-01T08:00:00Z', reason: '' },
    ]
  },
  'tm-4': {
    id: 'tm-4', name: 'David Mark', role: 'AGENT', email: 'david.m@example.com',
    phone: '+234 804 567 8901', status: 'ACTIVE', dailyLeads: 4, weeklyLeads: 22,
    monthlyConversions: 10, completionRate: 78, lastActive: '2026-07-26', earnings: 98000,
    totalEarnings: 425000, joinedDate: '2026-01-10', dailyLeadTarget: 5, monthlyConversionTarget: 12,
    businessesReferred: 6, leadsSubmitted: 28,
    activities: [
      { id: 'act-1', type: 'report', description: 'Submitted daily performance report', date: new Date(Date.now() - 2*3600000).toISOString() },
    ],
    targetAdjustments: []
  },
  'tm-5': {
    id: 'tm-5', name: 'Fatima Usman', role: 'AFFILIATE', email: 'fatima.u@example.com',
    phone: '+234 805 678 9012', status: 'ACTIVE', dailyLeads: 6, weeklyLeads: 30,
    monthlyConversions: 14, completionRate: 88, lastActive: '2026-07-28', earnings: 175000,
    totalEarnings: 720000, joinedDate: '2025-11-01', dailyLeadTarget: 7, monthlyConversionTarget: 15,
    businessesReferred: 10, leadsSubmitted: 38,
    activities: [
      { id: 'act-1', type: 'report', description: 'Submitted daily performance report', date: new Date(Date.now() - 2*3600000).toISOString() },
    ],
    targetAdjustments: [
      { id: 'ta-4', field: 'monthlyConversionTarget', oldValue: 12, newValue: 15, changedBy: 'You', changedById: 'current-user', changedAt: '2026-07-01T09:00:00Z', reason: 'Top performer, increasing challenge' },
    ]
  },
};

const mockEarningsHistory = [
  { month: 'Feb 2026', amount: 45000, leads: 12, conversions: 3 },
  { month: 'Mar 2026', amount: 72000, leads: 18, conversions: 5 },
  { month: 'Apr 2026', amount: 38000, leads: 10, conversions: 2 },
  { month: 'May 2026', amount: 95000, leads: 22, conversions: 7 },
  { month: 'Jun 2026', amount: 125000, leads: 28, conversions: 10 },
  { month: 'Jul 2026', amount: 85000, leads: 20, conversions: 6 },
];

type Tab = 'overview' | 'activity' | 'history' | 'reports' | 'targets';

export default function TeamMemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberId = params.memberId as string;
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [isSavingTarget, setIsSavingTarget] = useState(false);
  const [openReport, setOpenReport] = useState<'daily' | 'weekly' | 'monthly' | null>('daily');
  const [member, setMember] = useState<TeamMember | null>(null);
  const [targetForm, setTargetForm] = useState({ dailyLeadTarget: 0, monthlyConversionTarget: 0, reason: '' });

  useEffect(() => {
    const tab = searchParams.get('tab') as Tab | null;
    if (tab && ['overview', 'activity', 'history', 'reports', 'targets'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    api.get(`/network/team-member/${memberId}`)
      .then((data) => {
        if (data) {
          setMember({
            id: data.id || memberId,
            name: data.fullName || data.name || 'Team Member',
            role: (data.role === 'AFFILIATE' ? 'AFFILIATE' : 'AGENT') as any,
            email: data.email || '',
            phone: data.phone || '',
            status: data.status || 'ACTIVE',
            dailyLeads: data.todayLeadsCount || 4,
            weeklyLeads: data.weeklyLeadsCount || 20,
            monthlyConversions: data.monthlyConversionsCount || 8,
            completionRate: data.completionRate || 80,
            lastActive: data.updatedAt ? new Date(data.updatedAt).toISOString().split('T')[0] : 'Today',
            earnings: data.totalEarnings || data.earnings || 0,
            totalEarnings: data.totalEarnings || 0,
            joinedDate: data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : '',
            dailyLeadTarget: data.dailyLeadTarget || 5,
            monthlyConversionTarget: data.monthlyConversionTarget || 15,
            businessesReferred: data.activeBusinessesCount || 0,
            leadsSubmitted: data.todayLeadsCount || 0,
            activities: data.activityFeed || mockTeamMembers['tm-1']?.activities || [],
            targetAdjustments: data.targetHistory || mockTeamMembers['tm-1']?.targetAdjustments || [],
          });
        }
      })
      .catch(() => {
        const found = mockTeamMembers[memberId] || mockTeamMembers['tm-1'];
        setMember(found);
      });
  }, [memberId]);

  const buildMemberReportData = (type: 'daily' | 'weekly' | 'monthly', m: TeamMember): ReportExportData => {
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const commentKey = `network:member:${m.id}:${type}`;
    const storedComments = getReportComments(commentKey);
    const comments = storedComments.map((c) => ({ author: c.author, role: c.role, text: c.text, date: c.date }));

    let summary: string;
    if (type === 'daily') {
      summary = m.dailyLeads >= (m.dailyLeadTarget * 0.8)
        ? `${m.name} had a productive day collecting ${m.dailyLeads} leads, surpassing ${Math.round((m.dailyLeads / m.dailyLeadTarget) * 100)}% of their daily target.`
        : `${m.name} collected ${m.dailyLeads} leads today, below their target of ${m.dailyLeadTarget}.`;
    } else if (type === 'weekly') {
      summary = m.weeklyLeads >= 25 ? `Strong week with ${m.weeklyLeads} leads.` : m.weeklyLeads >= 15 ? `Moderate week with ${m.weeklyLeads} leads.` : `Slow week with ${m.weeklyLeads} leads.`;
    } else {
      const avgLeads = Math.round(mockEarningsHistory.reduce((s, r) => s + r.leads, 0) / mockEarningsHistory.length);
      const total = mockEarningsHistory.reduce((s, r) => s + r.amount, 0);
      summary = `Over 6 months, ${m.name} averaged ${avgLeads} leads/mo with total earnings of ₦${total.toLocaleString()}.`;
    }

    return {
      reportTitle: `${type === 'daily' ? 'Daily' : type === 'weekly' ? 'Weekly' : 'Monthly'} Report — ${m.name}`,
      author: m.name,
      role: m.role === 'AGENT' ? 'Agent' : 'Affiliate',
      dateLabel: type === 'daily' ? dateStr : type === 'weekly' ? `Week of ${dateStr}` : dateStr,
      summaryCards: [
        { label: 'Daily Leads', value: `${m.dailyLeads}` },
        { label: 'Weekly Leads', value: `${m.weeklyLeads}` },
        { label: 'Conversions', value: `${m.monthlyConversions}` },
        { label: 'Completion', value: `${m.completionRate}%` },
        { label: 'Earnings', value: `₦${m.earnings.toLocaleString()}` },
      ],
      summary,
      sections: [
        {
          title: 'Performance Details',
          lines: [
            `Daily Lead Target: ${m.dailyLeadTarget}`,
            `Monthly Conversion Target: ${m.monthlyConversionTarget}`,
            `Businesses Referred: ${m.businessesReferred}`,
            `Leads Submitted: ${m.leadsSubmitted}`,
            `Total Earnings: ₦${m.totalEarnings.toLocaleString()}`,
            `Last Active: ${m.lastActive}`,
            `Status: ${m.status}`,
          ],
        },
        {
          title: 'Earnings History',
          lines: mockEarningsHistory.map((r) => `${r.month}: ${r.leads} leads, ${r.conversions} convs, ₦${r.amount.toLocaleString()}`),
        },
      ],
      businesses: [],
      notes: [],
      comments,
    };
  };

  const shareReport = async (type: 'daily' | 'weekly' | 'monthly', m: TeamMember) => {
    try {
      await exportShare(buildMemberReportData(type, m));
      showToast(`${type} report shared`, 'success');
    } catch {
      showToast('Sharing cancelled', 'info');
    }
  };

  const downloadReport = (type: 'daily' | 'weekly' | 'monthly', m: TeamMember) => {
    const ok = downloadReportAsPdf(buildMemberReportData(type, m));
    showToast(ok ? 'Opening PDF preview — choose "Save as PDF" to download' : 'Could not open PDF preview', ok ? 'success' : 'error');
  };

  if (!member) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </DashboardLayout>
    );
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: User },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
    { key: 'activity', label: 'Activity', icon: Activity },
    { key: 'history', label: 'History', icon: History },
    { key: 'targets', label: 'Targets', icon: Target },
  ];

  const stats = [
    { label: 'Daily Leads', value: member.dailyLeads, target: member.dailyLeadTarget, icon: TrendingUp, color: 'blue' },
    { label: 'Weekly Leads', value: member.weeklyLeads, icon: TrendingUp, color: 'indigo' },
    { label: 'Monthly Conv.', value: member.monthlyConversions, target: member.monthlyConversionTarget, icon: CheckCircle2, color: 'emerald' },
    { label: 'Earnings', value: `₦${member.earnings.toLocaleString()}`, icon: DollarSign, color: 'amber' },
  ];

  const handleOpenTargetForm = () => {
    setTargetForm({ dailyLeadTarget: member.dailyLeadTarget, monthlyConversionTarget: member.monthlyConversionTarget, reason: '' });
    setShowTargetForm(true);
  };

  const handleSaveTargets = async () => {
    setIsSavingTarget(true);
    try {
      await api.post('/network/update-targets', {
        memberId: member.id, dailyLeadTarget: targetForm.dailyLeadTarget,
        monthlyConversionTarget: targetForm.monthlyConversionTarget,
        reason: targetForm.reason, changedBy: user?.fullName || 'Unknown', changedById: user?.id
      });
      setMember(prev => prev ? {
        ...prev,
        dailyLeadTarget: targetForm.dailyLeadTarget,
        monthlyConversionTarget: targetForm.monthlyConversionTarget,
        targetAdjustments: [{
          id: `ta-${Date.now()}`,
          field: 'dailyLeadTarget',
          oldValue: prev.dailyLeadTarget,
          newValue: targetForm.dailyLeadTarget,
          changedBy: user?.fullName || 'You',
          changedById: user?.id || 'current-user',
          changedAt: new Date().toISOString(),
          reason: targetForm.reason || 'Adjusted by Line Manager'
        }, ...prev.targetAdjustments]
      } : prev);
      showToast('Targets updated! Change recorded in audit log.', 'success');
      setShowTargetForm(false);
    } catch (e) { showToast('Failed to update targets', 'error'); }
    finally { setIsSavingTarget(false); }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        {/* Back */}
        <button onClick={() => router.push('/dashboard/network')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Network
        </button>

        {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[32px] p-6 sm:p-8 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mt-24" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mb-32" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 shrink-0">
                <span className="text-2xl sm:text-3xl font-black">{member.name.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black truncate">{member.name}</h1>
                  <span className={cn("text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest", member.role === 'AGENT' ? "bg-violet-400/30 text-violet-100" : "bg-blue-400/30 text-blue-100")}>{member.role}</span>
                  <span className={cn("text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest", member.status === 'ACTIVE' ? "bg-emerald-400/30 text-emerald-100" : "bg-slate-400/30 text-slate-100")}>{member.status}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm text-white/80">
                  <span className="flex items-center gap-1 min-w-0"><Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{member.email}</span></span>
                  <span className="hidden sm:inline">|</span>
                  <span className="flex items-center gap-1 min-w-0"><Phone className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{member.phone}</span></span>
                </div>
              </div>
              <div className="sm:text-right shrink-0">
                <p className="text-xs sm:text-sm text-white/60">Total Earnings</p>
                <p className="text-2xl sm:text-3xl font-black">₦{member.totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl border border-slate-200 p-1.5 shadow-sm overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key} onClick={() => { setActiveTab(tab.key); if (tab.key === 'reports') setOpenReport('daily'); }}
              className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                activeTab === tab.key ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              )}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }}>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map((stat, idx) => (
                    <div key={idx} className={cn("p-4 rounded-2xl border",
                      stat.color === 'blue' ? "bg-blue-50/50 border-blue-100" :
                      stat.color === 'indigo' ? "bg-indigo-50/50 border-indigo-100" :
                      stat.color === 'emerald' ? "bg-emerald-50/50 border-emerald-100" : "bg-amber-50/50 border-amber-100"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon className={cn("w-4 h-4", stat.color === 'blue' ? "text-blue-600" : stat.color === 'indigo' ? "text-indigo-600" : stat.color === 'emerald' ? "text-emerald-600" : "text-amber-600")} />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                      </div>
                      <p className="text-lg font-black text-slate-900">{stat.value}</p>
                      {'target' in stat && stat.target && <p className="text-[10px] text-slate-400 mt-0.5">Target: {stat.target}</p>}
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" /> Completion Rate
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                        <circle cx="36" cy="36" r="30" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                        <circle cx="36" cy="36" r="30" fill="none" stroke={member.completionRate >= 80 ? "#059669" : member.completionRate >= 60 ? "#d97706" : "#dc2626"} strokeWidth="6" strokeDasharray={`${member.completionRate * 1.884} 188.4`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-black text-slate-900">{member.completionRate}%</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-700">{member.completionRate >= 80 ? 'Excellent Performance' : member.completionRate >= 60 ? 'Needs Improvement' : 'At Risk'}</p>
                      <p className="text-xs text-slate-500">
                        {member.completionRate >= 80 ? `${member.name} is meeting targets consistently.` :
                         member.completionRate >= 60 ? `${member.name} needs coaching to improve.` :
                         `${member.name} is underperforming. Consider intervention.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" /> Recent Activity
                </h3>
                <div className="space-y-3">
                  {member.activities.slice(0, 10).map(activity => (
                    <div key={activity.id} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        activity.type === 'lead' ? "bg-blue-100 text-blue-600" :
                        activity.type === 'conversion' ? "bg-emerald-100 text-emerald-600" :
                        activity.type === 'report' ? "bg-purple-100 text-purple-600" :
                        activity.type === 'business' ? "bg-amber-100 text-amber-600" :
                        activity.type === 'referral' ? "bg-indigo-100 text-indigo-600" : "bg-orange-100 text-orange-600"
                      )}>
                        {activity.type === 'lead' ? <TrendingUp className="w-4 h-4" /> :
                         activity.type === 'conversion' ? <CheckCircle2 className="w-4 h-4" /> :
                         activity.type === 'report' ? <FileText className="w-4 h-4" /> :
                         activity.type === 'business' ? <Shield className="w-4 h-4" /> :
                         activity.type === 'referral' ? <Users className="w-4 h-4" /> : <ArrowUpDown className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400">{new Date(activity.date).toLocaleString()}</span>
                          {activity.changedBy && <><span className="w-1 h-1 rounded-full bg-slate-300" /><span className="text-[10px] text-blue-600 font-semibold">by {activity.changedBy}</span></>}
                        </div>
                      </div>
                      {activity.amount && <div className="text-right shrink-0"><span className="text-xs font-bold text-emerald-600">₦{activity.amount.toLocaleString()}</span></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-600" /> Target Adjustment History
                  </h3>
                  {member.targetAdjustments.length > 0 ? (
                    <div className="space-y-2">
                      {member.targetAdjustments.map(adj => (
                        <div key={adj.id} className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-900">
                                {adj.field === 'dailyLeadTarget' ? 'Daily Lead Target' : 'Monthly Conversion Target'}:
                                <span className="text-red-500 mx-1">{adj.oldValue}</span>
                                <ArrowRight className="w-3 h-3 inline mx-1 text-slate-400" />
                                <span className="text-emerald-600">{adj.newValue}</span>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">Changed by {adj.changedBy} on {new Date(adj.changedAt).toLocaleString()}</p>
                              {adj.reason && <p className="text-[10px] text-slate-500 mt-0.5">Reason: {adj.reason}</p>}
                            </div>
                            <div className="flex items-center gap-1">
                              {adj.newValue > adj.oldValue ? <ArrowUpCircle className="w-4 h-4 text-emerald-600" /> : <ArrowDownCircle className="w-4 h-4 text-red-500" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-xl text-center">
                      <ArrowUpDown className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-400">No target adjustments yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-4">
                {[
                  { key: 'daily' as const, icon: BarChart3, color: 'blue', title: `Daily Report — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`,
                    content: (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center"><p className="text-lg font-black text-blue-600">{member.dailyLeads}</p><p className="text-[10px] font-bold text-slate-500">Leads</p></div>
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center"><p className="text-lg font-black text-emerald-600">{Math.round(member.dailyLeads * 0.4)}</p><p className="text-[10px] font-bold text-slate-500">Convs</p></div>
                        <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center"><p className="text-lg font-black text-purple-600">{Math.round(member.dailyLeads * 1.6)}</p><p className="text-[10px] font-bold text-slate-500">Visits</p></div>
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center"><p className="text-lg font-black text-amber-600">{member.completionRate}%</p><p className="text-[10px] font-bold text-slate-500">Rate</p></div>
                      </div>
                    ),
                    summary: member.dailyLeads >= (member.dailyLeadTarget * 0.8)
                      ? `${member.name} had a productive day collecting ${member.dailyLeads} leads, surpassing ${Math.round((member.dailyLeads / member.dailyLeadTarget) * 100)}% of their daily target.`
                      : `${member.name} collected ${member.dailyLeads} leads today, below their target of ${member.dailyLeadTarget}.`
                  },
                  { key: 'weekly' as const, icon: Activity, color: 'indigo', title: `Weekly Report — ${(() => { const n=new Date();const s=new Date(n);s.setDate(n.getDate()-n.getDay());const e=new Date(s);e.setDate(s.getDate()+6);return `${s.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${e.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;})()}`,
                    content: (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-center"><p className="text-lg font-black text-indigo-600">{member.weeklyLeads}</p><p className="text-[10px] font-bold text-slate-500">Leads</p></div>
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center"><p className="text-lg font-black text-emerald-600">{member.monthlyConversions}</p><p className="text-[10px] font-bold text-slate-500">Convs</p></div>
                        <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center"><p className="text-lg font-black text-purple-600">{member.completionRate}%</p><p className="text-[10px] font-bold text-slate-500">Rate</p></div>
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center"><p className="text-lg font-black text-amber-600">₦{member.earnings.toLocaleString()}</p><p className="text-[10px] font-bold text-slate-500">Earnings</p></div>
                      </div>
                    ),
                    summary: member.weeklyLeads >= 25 ? `Strong week with ${member.weeklyLeads} leads.` : member.weeklyLeads >= 15 ? `Moderate week with ${member.weeklyLeads} leads.` : `Slow week with ${member.weeklyLeads} leads.`
                  },
                  { key: 'monthly' as const, icon: TrendingUp, color: 'emerald', title: 'Monthly Breakdown',
                    content: (
                      <div className="overflow-x-auto pt-4">
                        <table className="w-full text-left text-xs">
                          <thead><tr className="border-b border-slate-100">
                            <th className="pb-2 font-bold text-slate-400 uppercase tracking-wider">Month</th>
                            <th className="pb-2 font-bold text-slate-400 uppercase tracking-wider text-center">Leads</th>
                            <th className="pb-2 font-bold text-slate-400 uppercase tracking-wider text-center">Convs</th>
                            <th className="pb-2 font-bold text-slate-400 uppercase tracking-wider text-right">Earnings</th>
                          </tr></thead>
                          <tbody>{mockEarningsHistory.map((m,i) => (
                            <tr key={i} className="border-b border-slate-50 last:border-0">
                              <td className="py-2.5 font-bold text-slate-900">{m.month}</td>
                              <td className="py-2.5 text-center text-slate-600">{m.leads}</td>
                              <td className="py-2.5 text-center text-slate-600">{m.conversions}</td>
                              <td className="py-2.5 text-right font-bold text-emerald-600">₦{m.amount.toLocaleString()}</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                    ),
                    summary: `Over 6 months, avg ${Math.round(mockEarningsHistory.reduce((s,r) => s+r.leads,0)/mockEarningsHistory.length)} leads/mo.`
                  },
                ].map(section => (
                  <div key={section.key} className="bg-white rounded-2xl border border-slate-200 relative">
                    <button
                      onClick={() => {
                        if (openReport === section.key) setOpenReport(null);
                        else setOpenReport(section.key);
                      }}
                      className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                    >
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <section.icon className={`w-4 h-4 text-${section.color}-600`} />
                        {section.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {openReport === section.key ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>
                    {openReport === section.key && (
                      <div className="p-5 pt-0 border-t border-slate-100">
                        {section.content}
                        <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-700"><span className="font-bold">Summary:</span> {section.summary}</p>
                        </div>
                        <div className="mt-3 flex items-center gap-2 justify-end">
                          <button onClick={() => shareReport(section.key, member)} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-${section.color}-50 hover:bg-${section.color}-100 text-${section.color}-600 font-bold text-xs transition-colors`}><Share2 className="w-3.5 h-3.5" /> Share</button>
                          <button onClick={() => downloadReport(section.key, member)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-xs transition-colors"><Download className="w-3.5 h-3.5" /> Download PDF</button>
                        </div>
                        <ReportComments
                          reportKey={`network:member:${member.id}:${section.key}`}
                          currentUser={user ? { name: user.fullName, role: 'LINE MANAGER' } : null}
                          className="mt-3"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'targets' && (
              <div className="space-y-6">
                {!showTargetForm ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Target className="w-4 h-4 text-blue-600" /> Current Performance Targets</h3>
                      <Button onClick={handleOpenTargetForm} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <ArrowUpDown className="w-4 h-4 mr-1" /> Adjust Targets
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Lead Target</p>
                        <p className="text-3xl font-black text-slate-900 mt-2">{member.dailyLeadTarget}</p>
                        <div className="flex items-center gap-2 text-xs mt-2">
                          <span className="font-bold text-blue-600">Current: {member.dailyLeads}</span>
                          <span className="text-slate-300">/</span>
                          <span className="font-bold text-slate-900">{member.dailyLeadTarget}</span>
                        </div>
                      </div>
                      <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Conversion Target</p>
                        <p className="text-3xl font-black text-slate-900 mt-2">{member.monthlyConversionTarget}</p>
                        <div className="flex items-center gap-2 text-xs mt-2">
                          <span className="font-bold text-emerald-600">Current: {member.monthlyConversions}</span>
                          <span className="text-slate-300">/</span>
                          <span className="font-bold text-slate-900">{member.monthlyConversionTarget}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-5 bg-white rounded-2xl border border-slate-200">
                      <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><History className="w-4 h-4 text-orange-600" /> Change Log</h3>
                      {member.targetAdjustments.length > 0 ? (
                        <div className="space-y-2">
                          {member.targetAdjustments.map(adj => (
                            <div key={adj.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                              <div className="flex items-center gap-2">
                                {adj.newValue > adj.oldValue ? <ArrowUpCircle className="w-4 h-4 text-emerald-600" /> : <ArrowDownCircle className="w-4 h-4 text-red-500" />}
                                <span className="text-xs"><span className="font-bold text-slate-900">{adj.changedBy}</span><span className="text-slate-400"> changed {adj.field === 'dailyLeadTarget' ? 'daily leads' : 'monthly convs'} from </span><span className="font-bold text-slate-900">{adj.oldValue}</span><span className="text-slate-400"> to </span><span className="font-bold text-emerald-600">{adj.newValue}</span></span>
                              </div>
                              <span className="text-[10px] text-slate-400">{new Date(adj.changedAt).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-4">No changes recorded yet</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><ArrowUpDown className="w-4 h-4 text-blue-600" /> Adjust Targets for {member.name}</h3>
                      <Button variant="outline" size="sm" onClick={() => setShowTargetForm(false)}>Cancel</Button>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div><p className="text-xs font-bold text-amber-800">Changes are tracked</p><p className="text-[10px] text-amber-600">All adjustments are logged with your name.</p></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700">Daily Lead Target</label>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => setTargetForm(p => ({...p, dailyLeadTarget: Math.max(0, p.dailyLeadTarget - 1)}))} className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-100"><ArrowDownCircle className="w-5 h-5" /></button>
                          <input type="number" value={targetForm.dailyLeadTarget} onChange={(e) => setTargetForm(p => ({...p, dailyLeadTarget: Number(e.target.value)}))} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center font-bold text-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none" />
                          <button type="button" onClick={() => setTargetForm(p => ({...p, dailyLeadTarget: p.dailyLeadTarget + 1}))} className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 hover:bg-emerald-100"><ArrowUpCircle className="w-5 h-5" /></button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700">Monthly Conversion Target</label>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => setTargetForm(p => ({...p, monthlyConversionTarget: Math.max(0, p.monthlyConversionTarget - 1)}))} className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-100"><ArrowDownCircle className="w-5 h-5" /></button>
                          <input type="number" value={targetForm.monthlyConversionTarget} onChange={(e) => setTargetForm(p => ({...p, monthlyConversionTarget: Number(e.target.value)}))} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center font-bold text-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none" />
                          <button type="button" onClick={() => setTargetForm(p => ({...p, monthlyConversionTarget: p.monthlyConversionTarget + 1}))} className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 hover:bg-emerald-100"><ArrowUpCircle className="w-5 h-5" /></button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700">Reason <span className="text-slate-400 font-normal">(optional)</span></label>
                      <textarea value={targetForm.reason} onChange={(e) => setTargetForm(p => ({...p, reason: e.target.value}))} placeholder="Why are you adjusting these targets?" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none resize-none text-sm" rows={3} />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleSaveTargets} disabled={isSavingTarget} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg">
                        {isSavingTarget ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                      </Button>
                      <Button variant="outline" onClick={() => setShowTargetForm(false)} className="h-12">Discard</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
