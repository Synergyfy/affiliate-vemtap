'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, Phone, Mail, TrendingUp, Target, Calendar,
  Activity, Clock, CheckCircle2, AlertCircle, Shield,
  BarChart3, History, FileText, DollarSign, ArrowUpDown,
  ChevronRight, ChevronDown, Loader2, Users,
  Plus, Gift, ArrowUpCircle, ArrowDownCircle, Save, ArrowRight,
  Share2, Download, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/toast';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api-client';

interface ActivityEntry {
  id: string;
  type: 'lead' | 'conversion' | 'report' | 'target_change' | 'referral' | 'business';
  description: string;
  date: string;
  amount?: number;
  changedBy?: string;
  changedById?: string;
}

interface TargetAdjustment {
  id: string;
  field: 'dailyLeadTarget' | 'monthlyConversionTarget';
  oldValue: number;
  newValue: number;
  changedBy: string;
  changedById: string;
  changedAt: string;
  reason?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: 'AGENT' | 'AFFILIATE';
  email: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  dailyLeads: number;
  weeklyLeads: number;
  monthlyConversions: number;
  completionRate: number;
  lastActive: string;
  earnings: number;
  totalEarnings: number;
  avatar?: string;
  joinedDate: string;
  dailyLeadTarget: number;
  monthlyConversionTarget: number;
  activities: ActivityEntry[];
  targetAdjustments: TargetAdjustment[];
  businessesReferred: number;
  leadsSubmitted: number;
}

interface TeamMemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
  onTargetUpdated?: (memberId: string, field: string, oldValue: number, newValue: number) => void;
}

// Mock activity data generator
const generateMockActivities = (member: TeamMember): ActivityEntry[] => [
  { id: 'act-1', type: 'report', description: 'Submitted daily performance report', date: new Date(Date.now() - 2*3600000).toISOString() },
  { id: 'act-2', type: 'lead', description: 'Captured new lead: Alhaji Enterprises', date: new Date(Date.now() - 5*3600000).toISOString(), amount: 1 },
  { id: 'act-3', type: 'conversion', description: 'Closed deal: Mama Cass Kitchen (₦15,000)', date: new Date(Date.now() - 24*3600000).toISOString(), amount: 15000 },
  { id: 'act-4', type: 'business', description: 'Registered business: De-Royal Choice Supermarket', date: new Date(Date.now() - 48*3600000).toISOString() },
  { id: 'act-5', type: 'referral', description: `Referred by Line Manager to ${['Alhaji Enterprises', 'Mama Cass Kitchen', 'De-Royal Supermarket'][Math.floor(Math.random()*3)]}`, date: new Date(Date.now() - 72*3600000).toISOString() },
  { id: 'act-6', type: 'target_change', description: `Target adjusted by you`, date: new Date(Date.now() - 120*3600000).toISOString(), changedBy: 'You', changedById: 'current-user' },
];

const mockEarningsHistory = [
  { month: 'Feb 2026', amount: 45000, leads: 12, conversions: 3 },
  { month: 'Mar 2026', amount: 72000, leads: 18, conversions: 5 },
  { month: 'Apr 2026', amount: 38000, leads: 10, conversions: 2 },
  { month: 'May 2026', amount: 95000, leads: 22, conversions: 7 },
  { month: 'Jun 2026', amount: 125000, leads: 28, conversions: 10 },
  { month: 'Jul 2026', amount: 85000, leads: 20, conversions: 6 },
];

const mockReferralHistory = [
  { id: 'ref-1', businessName: 'Alhaji Enterprises', type: 'lead', date: '2026-07-25', status: 'pending', assignedBy: 'You' },
  { id: 'ref-2', businessName: 'Mama Cass Kitchen', type: 'conversion', date: '2026-07-24', status: 'completed', assignedBy: 'You' },
  { id: 'ref-3', businessName: 'De-Royal Choice Supermarket', type: 'business', date: '2026-07-22', status: 'completed', assignedBy: 'Self' },
  { id: 'ref-4', businessName: 'Grace & Mercy Ventures', type: 'lead', date: '2026-07-20', status: 'completed', assignedBy: 'System' },
];

export default function TeamMemberDetailModal({ isOpen, onClose, member, onTargetUpdated }: TeamMemberDetailModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'history' | 'reports' | 'targets'>('overview');
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [showAssignReferral, setShowAssignReferral] = useState(false);
  const [isSavingTarget, setIsSavingTarget] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [openReport, setOpenReport] = useState<'daily' | 'weekly' | 'monthly' | null>('daily');
  const [targetForm, setTargetForm] = useState({ dailyLeadTarget: 0, monthlyConversionTarget: 0, reason: '' });

  const getReportText = (type: 'daily' | 'weekly' | 'monthly', m: TeamMember): string => {
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    if (type === 'daily') {
      return `📊 Daily Report for ${m.name} — ${dateStr}\n\nLeads Collected: ${m.dailyLeads}\nConversions: ${Math.round(m.dailyLeads * 0.4)}\nBusinesses Visited: ${Math.round(m.dailyLeads * 1.6)}\nCompletion Rate: ${m.completionRate}%\n\n${m.dailyLeads >= (m.dailyLeadTarget * 0.8) ? `✅ ${m.name} had a productive day collecting ${m.dailyLeads} leads, surpassing ${Math.round((m.dailyLeads / m.dailyLeadTarget) * 100)}% of target.` : `⚠️ ${m.name} collected ${m.dailyLeads} leads, below the target of ${m.dailyLeadTarget}.`}`;
    }
    if (type === 'weekly') {
      return `📈 Weekly Report for ${m.name} — Week of ${dateStr}\n\nTotal Leads: ${m.weeklyLeads}\nConversions: ${m.monthlyConversions}\nAvg Completion Rate: ${m.completionRate}%\nEarnings: ₦${m.earnings.toLocaleString()}\n\n${m.weeklyLeads >= 25 ? `✅ Strong week with ${m.weeklyLeads} leads generated.` : m.weeklyLeads >= 15 ? `📊 Moderate week with ${m.weeklyLeads} leads.` : `⚠️ Slow week with only ${m.weeklyLeads} leads.`}`;
    }
    const avgLeads = Math.round(mockEarningsHistory.reduce((s, r) => s + r.leads, 0) / mockEarningsHistory.length);
    const avgConvRate = Math.round(mockEarningsHistory.reduce((s, r) => s + (r.conversions / r.leads) * 100, 0) / mockEarningsHistory.length);
    return `📅 Monthly Performance Report for ${m.name}\n\n6-Month Avg Leads/Month: ${avgLeads}\nAvg Conversion Rate: ${avgConvRate}%\nCurrent Completion Rate: ${m.completionRate}%\nTotal Earnings (6mo): ₦${mockEarningsHistory.reduce((s, r) => s + r.amount, 0).toLocaleString()}\n\n${m.completionRate >= 80 ? `✅ ${m.name} continues to be a top performer.` : m.completionRate >= 60 ? `📊 ${m.name} has room to grow but shows dedication.` : `⚠️ ${m.name} would benefit from additional training.`}`;
  };

  const shareReport = async (type: 'daily' | 'weekly' | 'monthly', m: TeamMember) => {
    const text = getReportText(type, m);
    if (navigator.share) {
      await navigator.share({ title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report — ${m.name}`, text });
    } else {
      await navigator.clipboard.writeText(text);
      showToast('Report copied to clipboard — you can paste it into WhatsApp, email, or any app', 'success');
    }
  };

  const downloadReport = (type: 'daily' | 'weekly' | 'monthly', m: TeamMember) => {
    const text = getReportText(type, m);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${m.name.replace(/\s+/g, '_')}_${type}_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded`, 'success');
  };

  if (!member) return null;

  const activities = member.activities.length > 0 ? member.activities : generateMockActivities(member);

  const handleOpenTargetForm = () => {
    setTargetForm({
      dailyLeadTarget: member.dailyLeadTarget,
      monthlyConversionTarget: member.monthlyConversionTarget,
      reason: ''
    });
    setShowTargetForm(true);
  };

  const handleSaveTargets = async () => {
    setIsSavingTarget(true);
    try {
      await api.post('/network/update-targets', {
        memberId: member.id,
        dailyLeadTarget: targetForm.dailyLeadTarget,
        monthlyConversionTarget: targetForm.monthlyConversionTarget,
        reason: targetForm.reason,
        changedBy: user?.fullName || 'Unknown',
        changedById: user?.id
      });

      if (onTargetUpdated) {
        if (member.dailyLeadTarget !== targetForm.dailyLeadTarget) {
          onTargetUpdated(member.id, 'dailyLeadTarget', member.dailyLeadTarget, targetForm.dailyLeadTarget);
        }
        if (member.monthlyConversionTarget !== targetForm.monthlyConversionTarget) {
          onTargetUpdated(member.id, 'monthlyConversionTarget', member.monthlyConversionTarget, targetForm.monthlyConversionTarget);
        }
      }

      showToast('Targets updated successfully! Change recorded in audit log.', 'success');
      setShowTargetForm(false);
    } catch (e) {
      showToast('Failed to update targets', 'error');
    } finally {
      setIsSavingTarget(false);
    }
  };

  const handleAssignReferral = async (type: 'lead' | 'business') => {
    setIsAssigning(true);
    try {
      await api.post('/network/assign-referral', {
        memberId: member.id,
        type,
        assignedBy: user?.id
      });
      showToast(`${type === 'lead' ? 'Lead' : 'Business referral'} assigned to ${member.name}`, 'success');
      setShowAssignReferral(false);
    } catch (e) {
      showToast('Failed to assign referral', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: User },
    { key: 'activity' as const, label: 'Activity', icon: Activity },
    { key: 'history' as const, label: 'History', icon: History },
    { key: 'reports' as const, label: 'Reports', icon: BarChart3 },
    { key: 'targets' as const, label: 'Targets', icon: Target },
  ];

  const stats = [
    { label: 'Daily Leads', value: member.dailyLeads, target: member.dailyLeadTarget, icon: TrendingUp, color: 'blue' },
    { label: 'Weekly Leads', value: member.weeklyLeads, icon: TrendingUp, color: 'indigo' },
    { label: 'Monthly Conv.', value: member.monthlyConversions, target: member.monthlyConversionTarget, icon: CheckCircle2, color: 'emerald' },
    { label: 'Earnings', value: `₦${member.earnings.toLocaleString()}`, icon: DollarSign, color: 'amber' },
  ] as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="relative h-40 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center overflow-hidden shrink-0">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-48 h-48 bg-white rounded-full -ml-24 -mt-24" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full -mr-32 -mb-32" />
              </div>
              <div className="relative z-10 text-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/30">
                  <span className="text-2xl font-black">{member.name.charAt(0)}</span>
                </div>
                <h2 className="text-xl font-black">{member.name}</h2>
                <div className="flex items-center justify-center gap-3 mt-1">
                  <span className={cn("text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest", member.role === 'AGENT' ? "bg-violet-400/30 text-violet-100" : "bg-blue-400/30 text-blue-100")}>
                    {member.role}
                  </span>
                  <span className={cn("text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest", member.status === 'ACTIVE' ? "bg-emerald-400/30 text-emerald-100" : "bg-slate-400/30 text-slate-100")}>
                    {member.status}
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 rounded-full text-white transition-colors z-20">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Info Bar */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-4 text-xs shrink-0">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Mail className="w-3.5 h-3.5" /> {member.email}
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5 text-slate-500">
                <Phone className="w-3.5 h-3.5" /> {member.phone}
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5 text-slate-500">
                <Calendar className="w-3.5 h-3.5" /> Joined {new Date(member.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5 text-slate-500">
                <Clock className="w-3.5 h-3.5" /> Last active {new Date(member.lastActive).toLocaleDateString()}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="font-bold text-emerald-600 text-sm">₦{member.totalEarnings.toLocaleString()}</span>
                <span className="text-slate-400">total earned</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-6 shrink-0 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap",
                    activeTab === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat, idx) => (
                      <div key={idx} className={cn(
                        "p-4 rounded-2xl border",
                        stat.color === 'blue' ? "bg-blue-50/50 border-blue-100" :
                        stat.color === 'indigo' ? "bg-indigo-50/50 border-indigo-100" :
                        stat.color === 'emerald' ? "bg-emerald-50/50 border-emerald-100" :
                        "bg-amber-50/50 border-amber-100"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          <stat.icon className={cn("w-4 h-4", stat.color === 'blue' ? "text-blue-600" : stat.color === 'indigo' ? "text-indigo-600" : stat.color === 'emerald' ? "text-emerald-600" : "text-amber-600")} />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <p className="text-lg font-black text-slate-900">{stat.value}</p>
                        {'target' in stat && stat.target && (
                          <p className="text-[10px] text-slate-400 mt-0.5">Target: {stat.target}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <ArrowUpDown className="w-4 h-4 text-blue-600" />
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button onClick={handleOpenTargetForm} className="p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors text-left group">
                        <ArrowUpCircle className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-bold text-slate-900">Adjust Targets</p>
                        <p className="text-[10px] text-slate-500">Increase or decrease</p>
                      </button>
                      <button onClick={() => setShowAssignReferral(true)} className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors text-left group">
                        <Gift className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-bold text-slate-900">Assign Referral</p>
                        <p className="text-[10px] text-slate-500">Give lead/business</p>
                      </button>
                      <button className="p-4 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors text-left group">
                        <FileText className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-bold text-slate-900">View Reports</p>
                        <p className="text-[10px] text-slate-500">Full performance</p>
                      </button>
                      <button className="p-4 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors text-left group">
                        <DollarSign className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-bold text-slate-900">Earnings</p>
                        <p className="text-[10px] text-slate-500">Breakdown & history</p>
                      </button>
                    </div>
                  </div>

                  {/* Top Stats */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      Completion Rate
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
                          {member.completionRate >= 80
                            ? `${member.name} is meeting targets consistently.`
                            : member.completionRate >= 60
                            ? `${member.name} needs coaching to improve.`
                            : `${member.name} is underperforming. Consider intervention.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      Recent Activity
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">{activities.length} entries</span>
                  </div>
                  <div className="space-y-3">
                    {activities.slice(0, 10).map((activity) => (
                      <div key={activity.id} className="flex gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          activity.type === 'lead' ? "bg-blue-100 text-blue-600" :
                          activity.type === 'conversion' ? "bg-emerald-100 text-emerald-600" :
                          activity.type === 'report' ? "bg-purple-100 text-purple-600" :
                          activity.type === 'business' ? "bg-amber-100 text-amber-600" :
                          activity.type === 'referral' ? "bg-indigo-100 text-indigo-600" :
                          "bg-orange-100 text-orange-600"
                        )}>
                          {activity.type === 'lead' ? <TrendingUp className="w-4 h-4" /> :
                           activity.type === 'conversion' ? <CheckCircle2 className="w-4 h-4" /> :
                           activity.type === 'report' ? <FileText className="w-4 h-4" /> :
                           activity.type === 'business' ? <Shield className="w-4 h-4" /> :
                           activity.type === 'referral' ? <Users className="w-4 h-4" /> :
                           <ArrowUpDown className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900">{activity.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400">{new Date(activity.date).toLocaleString()}</span>
                            {activity.changedBy && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="text-[10px] text-blue-600 font-semibold">by {activity.changedBy}</span>
                              </>
                            )}
                          </div>
                        </div>
                        {activity.amount && (
                          <div className="text-right shrink-0">
                            <span className="text-xs font-bold text-emerald-600">₦{activity.amount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <History className="w-4 h-4 text-blue-600" />
                      Target Adjustment History
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
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Changed by {adj.changedBy} on {new Date(adj.changedAt).toLocaleString()}
                                </p>
                                {adj.reason && (
                                  <p className="text-[10px] text-slate-500 mt-0.5">Reason: {adj.reason}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {adj.newValue > adj.oldValue ? (
                                  <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <ArrowDownCircle className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 rounded-xl text-center">
                        <ArrowUpDown className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-400">No target adjustments yet</p>
                        <p className="text-[10px] text-slate-400 mt-1">Adjust targets to start tracking changes here</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-emerald-600" />
                      Referral & Assignment History
                    </h3>
                    <div className="space-y-2">
                      {mockReferralHistory.map(ref => (
                        <div key={ref.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                              ref.type === 'lead' ? "bg-blue-100 text-blue-600" :
                              ref.type === 'conversion' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                            )}>{ref.type === 'lead' ? 'L' : ref.type === 'conversion' ? 'C' : 'B'}</div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{ref.businessName}</p>
                              <p className="text-[10px] text-slate-400">Assigned by {ref.assignedBy} • {new Date(ref.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            ref.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                            ref.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                          )}>{ref.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div className="space-y-4">
                  {/* Daily Report */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setOpenReport(openReport === 'daily' ? null : 'daily')}
                      className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                    >
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        Daily Report — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </h3>
                      <div className="flex items-center gap-2">
                        {openReport === 'daily' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); shareReport('daily', member); }}
                              className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                              title="Share report"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); downloadReport('daily', member); }}
                              className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
                              title="Download report"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {openReport === 'daily' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>
                    {openReport === 'daily' && (
                      <div className="p-5 pt-0 space-y-4 border-t border-slate-100">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
                            <p className="text-lg font-black text-blue-600">{member.dailyLeads}</p>
                            <p className="text-[10px] font-bold text-slate-500">Leads Collected</p>
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                            <p className="text-lg font-black text-emerald-600">{Math.round(member.dailyLeads * 0.4)}</p>
                            <p className="text-[10px] font-bold text-slate-500">Conversions</p>
                          </div>
                          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
                            <p className="text-lg font-black text-purple-600">{Math.round(member.dailyLeads * 1.6)}</p>
                            <p className="text-[10px] font-bold text-slate-500">Businesses Visited</p>
                          </div>
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                            <p className="text-lg font-black text-amber-600">{member.completionRate}%</p>
                            <p className="text-[10px] font-bold text-slate-500">Completion</p>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold">Daily Summary:</span>{' '}
                            {member.name}{' '}
                            {member.dailyLeads >= (member.dailyLeadTarget * 0.8)
                              ? `had a productive day collecting ${member.dailyLeads} leads, surpassing ${Math.round((member.dailyLeads / member.dailyLeadTarget) * 100)}% of their daily target. They closed ${Math.round(member.dailyLeads * 0.4)} conversions and visited ${Math.round(member.dailyLeads * 1.6)} businesses. Their completion rate of ${member.completionRate}% is ${member.completionRate >= 80 ? 'excellent and shows consistent effort throughout the day.' : member.completionRate >= 60 ? 'acceptable but there is room for improvement in meeting scheduling.' : 'below expectations and may need additional support or coaching.'}`
                              : `${member.name} collected ${member.dailyLeads} leads today, which is below their daily target of ${member.dailyLeadTarget}. Only ${Math.round(member.dailyLeads * 0.4)} conversions were recorded from ${Math.round(member.dailyLeads * 1.6)} business visits. The completion rate stands at ${member.completionRate}%, ${member.completionRate >= 60 ? 'which is fair but needs improvement in lead generation.' : 'which requires immediate attention and possible intervention.'}`
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Weekly Report */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => {
                        setOpenReport(openReport === 'weekly' ? null : 'weekly');
                        if (openReport === 'daily') setOpenReport('weekly');
                      }}
                      className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                    >
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-600" />
                        Weekly Report — {(() => {
                          const now = new Date();
                          const weekStart = new Date(now);
                          weekStart.setDate(now.getDate() - now.getDay());
                          const weekEnd = new Date(weekStart);
                          weekEnd.setDate(weekStart.getDate() + 6);
                          return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                        })()}
                      </h3>
                      <div className="flex items-center gap-2">
                        {openReport === 'weekly' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); shareReport('weekly', member); }}
                              className="p-2 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-colors"
                              title="Share report"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); downloadReport('weekly', member); }}
                              className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
                              title="Download report"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {openReport === 'weekly' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>
                    {openReport === 'weekly' && (
                      <div className="p-5 pt-0 space-y-4 border-t border-slate-100">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-center">
                            <p className="text-lg font-black text-indigo-600">{member.weeklyLeads}</p>
                            <p className="text-[10px] font-bold text-slate-500">Total Leads</p>
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                            <p className="text-lg font-black text-emerald-600">{member.monthlyConversions}</p>
                            <p className="text-[10px] font-bold text-slate-500">Conversions</p>
                          </div>
                          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
                            <p className="text-lg font-black text-purple-600">{member.completionRate}%</p>
                            <p className="text-[10px] font-bold text-slate-500">Avg Rate</p>
                          </div>
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                            <p className="text-lg font-black text-amber-600">₦{member.earnings.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-slate-500">Earnings</p>
                          </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold">Weekly Summary:</span>{' '}
                            {member.name}{' '}
                            {member.weeklyLeads >= 25
                              ? `had a strong week generating ${member.weeklyLeads} leads with ${member.monthlyConversions} conversions. This puts them on track for a solid monthly performance. Their average completion rate of ${member.completionRate}% indicates ${member.completionRate >= 80 ? 'a highly consistent and reliable team member who is adding significant value to the network.' : 'good effort, though there are opportunities to improve conversion rates through better follow-up.'}`
                              : member.weeklyLeads >= 15
                              ? `generated ${member.weeklyLeads} leads this week with ${member.monthlyConversions} conversions. Performance is moderate with a ${member.completionRate}% completion rate. ${member.completionRate >= 70 ? 'They are maintaining acceptable standards but could benefit from additional leads generation strategies.' : 'They may need coaching on lead generation techniques to improve weekly output.'}`
                              : `had a slower week with only ${member.weeklyLeads} leads generated and ${member.monthlyConversions} conversions. The ${member.completionRate}% completion rate ${member.completionRate >= 60 ? 'is decent but the low volume suggests they need more field activity.' : 'combined with low volume indicates a need for performance improvement planning.'}`
                            }{' '}
                            Their top-performing period for lead generation has been mid-week, and focusing on high-traffic periods could boost next week's numbers.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Monthly Breakdown */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => setOpenReport(openReport === 'monthly' ? null : 'monthly')}
                      className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                    >
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        Monthly Breakdown
                      </h3>
                      <div className="flex items-center gap-2">
                        {openReport === 'monthly' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); shareReport('monthly', member); }}
                              className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
                              title="Share report"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); downloadReport('monthly', member); }}
                              className="p-2 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
                              title="Download report"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {openReport === 'monthly' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>
                    {openReport === 'monthly' && (
                      <div className="p-5 pt-0 border-t border-slate-100">
                        <div className="overflow-x-auto pt-4">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-100">
                                <th className="pb-2 font-bold text-slate-400 uppercase tracking-wider">Month</th>
                                <th className="pb-2 font-bold text-slate-400 uppercase tracking-wider text-center">Leads</th>
                                <th className="pb-2 font-bold text-slate-400 uppercase tracking-wider text-center">Daily Avg</th>
                                <th className="pb-2 font-bold text-slate-400 uppercase tracking-wider text-center">Conversions</th>
                                <th className="pb-2 font-bold text-slate-400 uppercase tracking-wider text-center">Conv Rate</th>
                                <th className="pb-2 font-bold text-slate-400 uppercase tracking-wider text-center">Businesses</th>
                                <th className="pb-2 font-bold text-slate-400 uppercase tracking-wider text-right">Earnings</th>
                                <th className="pb-2 font-bold text-slate-400 uppercase tracking-wider text-center">Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mockEarningsHistory.map((month, idx) => (
                                <tr key={idx} className="border-b border-slate-50 last:border-0">
                                  <td className="py-2.5 font-bold text-slate-900">{month.month}</td>
                                  <td className="py-2.5 text-center text-slate-600">{month.leads}</td>
                                  <td className="py-2.5 text-center text-slate-600">{Math.round(month.leads / 30)}</td>
                                  <td className="py-2.5 text-center text-slate-600">{month.conversions}</td>
                                  <td className="py-2.5 text-center text-slate-600">{Math.round((month.conversions / month.leads) * 100)}%</td>
                                  <td className="py-2.5 text-center text-slate-600">{Math.round(month.conversions * 0.7)}</td>
                                  <td className="py-2.5 text-right font-bold text-emerald-600">₦{month.amount.toLocaleString()}</td>
                                  <td className="py-2.5 text-center">
                                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", month.amount >= 80000 ? "bg-emerald-100 text-emerald-700" : month.amount >= 50000 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700")}>
                                      {month.amount >= 80000 ? 'A' : month.amount >= 50000 ? 'B' : 'C'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-slate-100">
                          <p className="text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold">Monthly Performance Summary:</span>{' '}
                            Over the last 6 months, {member.name} has shown {
                              mockEarningsHistory.length >= 2 && mockEarningsHistory[mockEarningsHistory.length - 1].amount > mockEarningsHistory[0].amount
                                ? 'consistent growth'
                                : 'fluctuating performance'
                            } in earnings, starting at ₦{mockEarningsHistory[0]?.amount.toLocaleString()} in {mockEarningsHistory[0]?.month} and peaking at ₦{[...mockEarningsHistory].sort((a, b) => b.amount - a.amount)[0]?.amount.toLocaleString()} in {[...mockEarningsHistory].sort((a, b) => b.amount - a.amount)[0]?.month}. Their average monthly conversion rate is {
                              Math.round(mockEarningsHistory.reduce((sum, m) => sum + (m.conversions / m.leads) * 100, 0) / mockEarningsHistory.length)
                            }% with an average of {
                              Math.round(mockEarningsHistory.reduce((sum, m) => sum + m.leads, 0) / mockEarningsHistory.length)
                            } leads per month. {
                              member.completionRate >= 80
                                ? `${member.name} continues to be a top performer with strong consistency.`
                                : member.completionRate >= 60
                                ? `${member.name} has room to grow but shows promising dedication.`
                                : `${member.name} would benefit from additional training and support.`
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Targets Tab */}
              {activeTab === 'targets' && (
                <div className="space-y-6">
                  {!showTargetForm ? (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Target className="w-4 h-4 text-blue-600" />
                          Current Performance Targets
                        </h3>
                        <Button onClick={handleOpenTargetForm} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                          <ArrowUpDown className="w-4 h-4 mr-1" />
                          Adjust Targets
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm">
                              <TrendingUp className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Lead Target</p>
                              <p className="text-2xl font-black text-slate-900">{member.dailyLeadTarget}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-blue-600">Current: {member.dailyLeads}</span>
                            <span className="text-slate-300">/</span>
                            <span className="font-bold text-slate-900">{member.dailyLeadTarget}</span>
                            <span className={cn("ml-auto font-bold", member.dailyLeads >= member.dailyLeadTarget ? "text-emerald-600" : "text-amber-600")}>
                              {Math.round((member.dailyLeads / member.dailyLeadTarget) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Conversion Target</p>
                              <p className="text-2xl font-black text-slate-900">{member.monthlyConversionTarget}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-emerald-600">Current: {member.monthlyConversions}</span>
                            <span className="text-slate-300">/</span>
                            <span className="font-bold text-slate-900">{member.monthlyConversionTarget}</span>
                            <span className={cn("ml-auto font-bold", member.monthlyConversions >= member.monthlyConversionTarget ? "text-emerald-600" : "text-amber-600")}>
                              {Math.round((member.monthlyConversions / member.monthlyConversionTarget) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Audit trail */}
                      <div className="p-5 bg-white rounded-2xl border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                          <History className="w-4 h-4 text-orange-600" />
                          Change Log
                        </h3>
                        {member.targetAdjustments.length > 0 ? (
                          <div className="space-y-2">
                            {member.targetAdjustments.map(adj => (
                              <div key={adj.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                                <div className="flex items-center gap-2">
                                  {adj.newValue > adj.oldValue ? (
                                    <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <ArrowDownCircle className="w-4 h-4 text-red-500" />
                                  )}
                                  <span className="text-xs">
                                    <span className="font-bold text-slate-900">{adj.changedBy}</span>
                                    <span className="text-slate-400"> changed {adj.field === 'dailyLeadTarget' ? 'daily leads' : 'monthly convs'} from </span>
                                    <span className="font-bold text-slate-900">{adj.oldValue}</span>
                                    <span className="text-slate-400"> to </span>
                                    <span className="font-bold text-emerald-600">{adj.newValue}</span>
                                  </span>
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
                    /* Target Adjustment Form */
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <ArrowUpDown className="w-4 h-4 text-blue-600" />
                          Adjust Targets for {member.name}
                        </h3>
                        <Button variant="outline" size="sm" onClick={() => setShowTargetForm(false)}>
                          Cancel
                        </Button>
                      </div>

                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-amber-800">Changes are tracked</p>
                          <p className="text-[10px] text-amber-600">All adjustments are logged with your name and will appear in both the admin dashboard and {member.name}'s activity log.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700">Daily Lead Target</label>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setTargetForm(prev => ({ ...prev, dailyLeadTarget: Math.max(0, prev.dailyLeadTarget - 1) }))}
                              className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                            >
                              <ArrowDownCircle className="w-5 h-5" />
                            </button>
                            <input
                              type="number"
                              value={targetForm.dailyLeadTarget}
                              onChange={(e) => setTargetForm(prev => ({ ...prev, dailyLeadTarget: Number(e.target.value) }))}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center font-bold text-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setTargetForm(prev => ({ ...prev, dailyLeadTarget: prev.dailyLeadTarget + 1 }))}
                              className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 hover:bg-emerald-100 transition-colors"
                            >
                              <ArrowUpCircle className="w-5 h-5" />
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400">Current: {member.dailyLeadTarget}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-700">Monthly Conversion Target</label>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setTargetForm(prev => ({ ...prev, monthlyConversionTarget: Math.max(0, prev.monthlyConversionTarget - 1) }))}
                              className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                            >
                              <ArrowDownCircle className="w-5 h-5" />
                            </button>
                            <input
                              type="number"
                              value={targetForm.monthlyConversionTarget}
                              onChange={(e) => setTargetForm(prev => ({ ...prev, monthlyConversionTarget: Number(e.target.value) }))}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center font-bold text-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setTargetForm(prev => ({ ...prev, monthlyConversionTarget: prev.monthlyConversionTarget + 1 }))}
                              className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 hover:bg-emerald-100 transition-colors"
                            >
                              <ArrowUpCircle className="w-5 h-5" />
                            </button>
                          </div>
                          <p className="text-[10px] text-slate-400">Current: {member.monthlyConversionTarget}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700">Reason for Change <span className="text-slate-400 font-normal">(optional)</span></label>
                        <textarea
                          value={targetForm.reason}
                          onChange={(e) => setTargetForm(prev => ({ ...prev, reason: e.target.value }))}
                          placeholder="Why are you adjusting these targets? This will be saved in the audit log."
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none resize-none text-sm"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={handleSaveTargets}
                          disabled={isSavingTarget}
                          className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg"
                        >
                          {isSavingTarget ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
                          ) : (
                            <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                          )}
                        </Button>
                        <Button variant="outline" onClick={() => setShowTargetForm(false)} className="h-12">
                          Discard
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Assign Referral Sub-Modal */}
          <AnimatePresence>
            {showAssignReferral && (
              <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAssignReferral(false)}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl p-6 space-y-4"
                >
                  <h3 className="text-sm font-black text-slate-900">Assign Referral to {member.name}</h3>
                  <p className="text-xs text-slate-500">Choose what to assign. The referral will be credited to their account.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAssignReferral('lead')}
                      disabled={isAssigning}
                      className="p-5 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors text-center group disabled:opacity-50"
                    >
                      <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">Assign a Lead</p>
                      <p className="text-[10px] text-slate-500">Give an incoming lead</p>
                    </button>
                    <button
                      onClick={() => handleAssignReferral('business')}
                      disabled={isAssigning}
                      className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors text-center group disabled:opacity-50"
                    >
                      <Shield className="w-8 h-8 text-emerald-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-xs font-bold text-slate-900">Assign a Business</p>
                      <p className="text-[10px] text-slate-500">Give a business referral</p>
                    </button>
                  </div>
                  {isAssigning && (
                    <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-bold">
                      <Loader2 className="w-4 h-4 animate-spin" /> Assigning...
                    </div>
                  )}
                  <Button variant="outline" onClick={() => setShowAssignReferral(false)} className="w-full h-10">
                    Cancel
                  </Button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
