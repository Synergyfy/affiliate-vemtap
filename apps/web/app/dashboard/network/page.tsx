'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, CheckCircle2, Info, Trophy, Target, Gift,
  Clock, ArrowRight, Lock, TrendingUp, Users, UserPlus,
  BarChart3, DollarSign, Search, Loader2, Award, Star, BookOpen, Handshake,
  ChevronRight, Activity, FileText, Eye
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import LineManagerGuideModal from '@/components/dashboard/LineManagerGuideModal';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/toast';

const generateTeamActivities = (id: string, name: string) => [
  { id: `${id}-act-1`, type: 'report' as const, description: `${name} submitted daily performance report`, date: new Date(Date.now() - 2*3600000).toISOString() },
  { id: `${id}-act-2`, type: 'lead' as const, description: `${name} captured new lead: Alhaji Enterprises`, date: new Date(Date.now() - 5*3600000).toISOString(), amount: 1 },
  { id: `${id}-act-3`, type: 'conversion' as const, description: `${name} closed deal: Mama Cass Kitchen`, date: new Date(Date.now() - 24*3600000).toISOString(), amount: 15000 },
  { id: `${id}-act-4`, type: 'business' as const, description: `${name} registered business: De-Royal Choice Supermarket`, date: new Date(Date.now() - 48*3600000).toISOString() },
  { id: `${id}-act-5`, type: 'target_change' as const, description: `Target adjusted by you`, date: new Date(Date.now() - 120*3600000).toISOString(), changedBy: 'You' },
];

const mockTeamMembers = [
  {
    id: 'tm-1', name: 'Chioma Okafor', role: 'AGENT' as const, email: 'chioma.o@example.com',
    phone: '+234 801 234 5678', status: 'ACTIVE' as const, dailyLeads: 5, weeklyLeads: 28,
    monthlyConversions: 12, completionRate: 85, lastActive: '2026-07-28', earnings: 125000,
    totalEarnings: 540000, joinedDate: '2025-11-15', dailyLeadTarget: 6, monthlyConversionTarget: 15,
    businessesReferred: 8, leadsSubmitted: 34,
    activities: generateTeamActivities('tm-1', 'Chioma Okafor'),
    targetAdjustments: [
      { id: 'ta-1', field: 'dailyLeadTarget' as const, oldValue: 5, newValue: 6, changedBy: 'You', changedById: 'current-user', changedAt: '2026-06-15T10:00:00Z', reason: 'Increased due to strong performance' },
      { id: 'ta-2', field: 'monthlyConversionTarget' as const, oldValue: 12, newValue: 15, changedBy: 'You', changedById: 'current-user', changedAt: '2026-06-15T10:00:00Z', reason: 'Aligning with growth trajectory' },
    ]
  },
  {
    id: 'tm-2', name: 'Emeka Nwosu', role: 'AGENT' as const, email: 'emeka.n@example.com',
    phone: '+234 802 345 6789', status: 'ACTIVE' as const, dailyLeads: 3, weeklyLeads: 18,
    monthlyConversions: 8, completionRate: 72, lastActive: '2026-07-27', earnings: 85000,
    totalEarnings: 310000, joinedDate: '2025-12-01', dailyLeadTarget: 5, monthlyConversionTarget: 12,
    businessesReferred: 5, leadsSubmitted: 22,
    activities: generateTeamActivities('tm-2', 'Emeka Nwosu'),
    targetAdjustments: []
  },
  {
    id: 'tm-3', name: 'Bisi Adeyemi', role: 'AFFILIATE' as const, email: 'bisi.a@example.com',
    phone: '+234 803 456 7890', status: 'ACTIVE' as const, dailyLeads: 7, weeklyLeads: 35,
    monthlyConversions: 15, completionRate: 90, lastActive: '2026-07-28', earnings: 210000,
    totalEarnings: 890000, joinedDate: '2025-10-20', dailyLeadTarget: 8, monthlyConversionTarget: 18,
    businessesReferred: 12, leadsSubmitted: 45,
    activities: generateTeamActivities('tm-3', 'Bisi Adeyemi'),
    targetAdjustments: [
      { id: 'ta-3', field: 'dailyLeadTarget' as const, oldValue: 7, newValue: 8, changedBy: 'System', changedById: 'system', changedAt: '2026-05-01T08:00:00Z', reason: '' },
    ]
  },
  {
    id: 'tm-4', name: 'David Mark', role: 'AGENT' as const, email: 'david.m@example.com',
    phone: '+234 804 567 8901', status: 'ACTIVE' as const, dailyLeads: 4, weeklyLeads: 22,
    monthlyConversions: 10, completionRate: 78, lastActive: '2026-07-26', earnings: 98000,
    totalEarnings: 425000, joinedDate: '2026-01-10', dailyLeadTarget: 5, monthlyConversionTarget: 12,
    businessesReferred: 6, leadsSubmitted: 28,
    activities: generateTeamActivities('tm-4', 'David Mark'),
    targetAdjustments: []
  },
  {
    id: 'tm-5', name: 'Fatima Usman', role: 'AFFILIATE' as const, email: 'fatima.u@example.com',
    phone: '+234 805 678 9012', status: 'ACTIVE' as const, dailyLeads: 6, weeklyLeads: 30,
    monthlyConversions: 14, completionRate: 88, lastActive: '2026-07-28', earnings: 175000,
    totalEarnings: 720000, joinedDate: '2025-11-01', dailyLeadTarget: 7, monthlyConversionTarget: 15,
    businessesReferred: 10, leadsSubmitted: 38,
    activities: generateTeamActivities('tm-5', 'Fatima Usman'),
    targetAdjustments: [
      { id: 'ta-4', field: 'monthlyConversionTarget' as const, oldValue: 12, newValue: 15, changedBy: 'You', changedById: 'current-user', changedAt: '2026-07-01T09:00:00Z', reason: 'Top performer, increasing challenge' },
    ]
  },
];

type TeamMember = typeof mockTeamMembers[0];

export default function NetworkPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [recruits, setRecruits] = useState<any[]>([]);
  const [teamTab, setTeamTab] = useState<'agents' | 'affiliates'>('agents');
  const [viewTab, setViewTab] = useState<'team' | 'earnings' | 'referrals' | 'team-reports'>('team');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [commissionRate, setCommissionRate] = useState(10);
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchNetworkData = async () => {
    setIsLoading(true);
    try {
      const [stats, recruitsData, settings] = await Promise.all([
        api.get('/network/stats'),
        api.get('/network/recruits?limit=5'),
        api.get('/settings').catch(() => null)
      ]);
      setNetworkStats(stats);
      setRecruits(recruitsData.data || []);
      if (settings?.directCommissionRate) {
        setCommissionRate(settings.directCommissionRate);
      }
      if (stats.milestones?.agents?.isReached && stats.milestones?.businesses?.isReached) {
        setIsUnlocked(true);
      }
    } catch (error) {
      console.error('Failed to fetch network data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchNetworkData(); }, []);

  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number}>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const timeLimitDays = 90;

  useEffect(() => {
    if (!user?.createdAt) return;
    const NINETY_DAYS_MS = timeLimitDays * 24 * 60 * 60 * 1000;
    const signupDate = new Date(user.createdAt);
    const targetDate = new Date(signupDate.getTime() + NINETY_DAYS_MS);
    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [user?.createdAt]);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('vemtap_network_guide');
    if (!hasSeenGuide) {
      setShowGuide(true);
      localStorage.setItem('vemtap_network_guide', 'true');
    }
  }, []);

  const isAgent = user?.role === 'AGENT';
  const isAlreadySupervisor = user?.role === 'SUPERVISOR' || user?.role === 'MANAGER' || !!user?.isManagerMode;

  useEffect(() => {
    if (isAlreadySupervisor) {
      setIsUnlocked(true);
      setIsLoading(false);
    }
  }, [isAlreadySupervisor]);

  const affiliateCount = isAgent ? (networkStats?.daysActive || 0) : (networkStats?.activeAgentsCount || 0);
  const targetAffiliates = networkStats?.milestones?.agents?.target || (isAgent ? 90 : 30);
  const businessesCount = isAgent ? (networkStats?.personalActiveBusinesses || 0) : (networkStats?.totalNetworkBusinesses || 0);
  const targetBusinesses = networkStats?.milestones?.businesses?.target || (isAgent ? 40 : 100);
  const totalRecruits = networkStats?.totalRecruitsCount || 0;
  const rewardDuration: string = '1year';
  const rewardDurationLabel = rewardDuration === '3months' ? '3-Month' : rewardDuration === '6months' ? '6-Month' : rewardDuration === '1year' ? '12-Month' : rewardDuration === '2years' ? '24-Month' : 'Lifetime';
  const affiliateProgress = Math.min((affiliateCount / targetAffiliates) * 100, 100);
  const businessProgress = Math.min((businessesCount / targetBusinesses) * 100, 100);
  const isAffiliateMilestoneReached = networkStats?.milestones?.agents?.isReached || false;
  const isBusinessMilestoneReached = networkStats?.milestones?.businesses?.isReached || false;
  const isFullMilestoneReached = isAffiliateMilestoneReached && isBusinessMilestoneReached;

  const managers = recruits.map(r => ({
    id: r.id, name: r.fullName, referrals: r.businessCount,
    earnings: `₦${Number(r.managerShare || 0).toLocaleString()}`,
    status: r.status === 'ACTIVE' ? 'Active' : 'Inactive'
  }));

  const agents = teamMembers.filter(m => m.role === 'AGENT');
  const affiliates = teamMembers.filter(m => m.role === 'AFFILIATE');
  const displayMembers = teamTab === 'agents' ? agents : affiliates;
  const filteredMembers = displayMembers.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTeamEarnings = teamMembers.reduce((s, m) => s + m.earnings, 0);
  const topEarners = [...teamMembers].sort((a, b) => b.earnings - a.earnings);
  const totalTeamLeads = teamMembers.reduce((s, m) => s + m.weeklyLeads, 0);
  const totalTeamConversions = teamMembers.reduce((s, m) => s + m.monthlyConversions, 0);
  const avgCompletion = Math.round(teamMembers.reduce((s, m) => s + m.completionRate, 0) / teamMembers.length);

  const openTeamReports = () => setViewTab('team-reports');

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {!isUnlocked ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(affiliateProgress, businessProgress)}%` }}
                className="h-full bg-blue-600 transition-all duration-1000"
              />
            </div>
            <div className="absolute top-6 right-6">
              <Button variant="outline" size="sm" className="rounded-full bg-white/50 backdrop-blur-sm border-slate-200 text-slate-600 font-bold hover:bg-white transition-all" onClick={() => setShowGuide(true)}>
                <Info className="w-4 h-4 mr-2" /> How it Works
              </Button>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8">
              <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            </div>
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-6 py-2 rounded-full border border-orange-100 shadow-sm animate-pulse">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-black uppercase tracking-widest">{timeLeft.days}d : {timeLeft.hours}h : {timeLeft.minutes}m : {timeLeft.seconds}s Left</span>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              {isAgent ? 'Line Manager Dashboard' : 'Unlock Line Manager Status'}
            </h2>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-blue-600 animate-pulse mb-4" />
                <p className="text-slate-500 font-bold">Synchronizing performance data...</p>
              </div>
            ) : isAgent ? (
              <p className="text-sm sm:text-base text-slate-500 max-w-lg mx-auto mb-8 sm:mb-12">
                Establish a consistent personal operational record to promote to <span className="font-bold text-blue-600">Line Manager</span>. Maintain high daily reporting scores, zero fraud flags, and lock in your portfolio.
              </p>
            ) : (
              <p className="text-sm sm:text-base text-slate-500 max-w-lg mx-auto mb-8 sm:mb-12">
                Build your team and hit the targets <span className="text-orange-600 font-bold">within {timeLimitDays} days</span> to unlock your <span className="font-bold text-blue-600">Line Manager Network</span> and earn <span className="font-bold text-blue-600">{commissionRate}% of affiliate earnings</span>.
              </p>
            )}
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">{isAgent ? 'Days Active Target' : 'Active Agent Target'}</span>
                    <span className="text-sm font-bold text-slate-900">{affiliateCount} / {targetAffiliates} {isAgent ? 'Days on Platform' : 'Active Agents'}</span>
                    <p className="text-[9px] text-slate-400 font-medium">{isAgent ? 'Time elapsed since selected as a field operational worker' : 'Recruits who have closed at least 1 business'}</p>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{Math.round(affiliateProgress)}%</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-1">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${affiliateProgress}%` }} className="h-full bg-blue-600 rounded-full" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">{isAgent ? 'Personal Businesses Closed' : 'Business Target'}</span>
                    <span className="text-sm font-bold text-slate-900">{businessesCount} / {targetBusinesses} Businesses</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{Math.round(businessProgress)}%</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-1">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${businessProgress}%` }} className="h-full bg-blue-600 rounded-full" />
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-500">
                {isAgent ? (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span>{networkStats?.reportingScore}% Reporting Score</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{networkStats?.attendanceRate}% Attendance Rate</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>{totalRecruits} Total Recruits</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{affiliateCount} Active Agents</span>
                    </div>
                  </>
                )}
              </div>
              {isAgent ? (
                <Button className={cn("w-full mt-10 text-sm sm:text-base h-14 font-black uppercase tracking-widest shadow-xl transition-all duration-300", networkStats?.isEligibleForSupervisor ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 text-white" : "bg-slate-300 hover:bg-slate-300 shadow-none text-slate-500 cursor-not-allowed")} disabled={!networkStats?.isEligibleForSupervisor} onClick={async () => {
                  try {
                    await api.post('/network/toggle-manager-mode');
                    showToast('Successfully promoted to Line Manager!', 'success');
                    window.location.reload();
                  } catch (e: any) {
                    showToast(e.response?.data?.message || 'Promotion failed', 'error');
                  }
                }}>
                  {networkStats?.isEligibleForSupervisor ? 'Apply for Line Manager Promotion' : 'Targets Not Met Yet'}
                </Button>
              ) : (
                <Button className="w-full mt-10 text-sm sm:text-base h-14 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 font-black uppercase tracking-widest" onClick={() => router.push('/dashboard/tools')}>Start Recruiting Now</Button>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="bg-emerald-50/50 p-6 rounded-[24px] border-2 border-emerald-100 text-center group hover:bg-emerald-50 transition-colors">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Verified Rewards</h4>
                  <p className="text-xs text-emerald-800 font-bold leading-relaxed">Unlock <span className="text-emerald-600">Extended {rewardDurationLabel}</span> earnings mode on all referrals.</p>
                </div>
                <div className="bg-blue-50/50 p-6 rounded-[24px] border-2 border-blue-100 text-center group hover:bg-blue-50 transition-colors">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">{commissionRate}% Team Share</h4>
                  <p className="text-xs text-blue-800 font-bold leading-relaxed">Earn a <span className="text-blue-600">{commissionRate}% commission</span> from every sale your team makes.</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Line Manager Network</h2>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm sm:text-base text-slate-500">Team Management Dashboard</p>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <div className={cn("flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full", isFullMilestoneReached ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-blue-50 text-blue-600 border border-blue-100")}>
                    <Clock className="w-4 h-4" />
                    {isFullMilestoneReached ? `${rewardDurationLabel} Mode Unlocked` : "3-Month Mode Active"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center border border-emerald-100">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Verified Line Manager
                </div>
                <Button variant="primary" size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-sm" onClick={openTeamReports}>
                  <FileText className="w-4 h-4 mr-2" /> View Team Reports
                </Button>
                <Button variant="outline" size="sm" className="rounded-full border-slate-200 text-slate-500 font-bold hover:bg-slate-50" onClick={() => setShowGuide(true)}>
                  <Info className="w-4 h-4 mr-2" /> Guide
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Members</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{teamMembers.length}</p>
                <p className="text-[10px] text-slate-400">{agents.length} agents, {affiliates.length} affiliates</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Earnings</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">₦{totalTeamEarnings.toLocaleString()}</p>
                <p className="text-[10px] text-slate-400">Your {commissionRate}%: ₦{Math.round(totalTeamEarnings * (commissionRate / 100)).toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Weekly Leads</p>
                <p className="text-2xl font-black text-blue-600 mt-1">{totalTeamLeads}</p>
                <p className="text-[10px] text-slate-400">Across all team members</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Completion Rate</p>
                <p className="text-2xl font-black text-purple-600 mt-1">{avgCompletion}%</p>
                <p className="text-[10px] text-slate-400">{topEarners[0]?.name} leads at {topEarners[0]?.completionRate}%</p>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-100">
                {[
                  { key: 'team' as const, label: 'My Team', icon: Users },
                  { key: 'earnings' as const, label: 'Earnings', icon: DollarSign },
                  { key: 'referrals' as const, label: 'Referral Center', icon: Handshake },
                  { key: 'team-reports' as const, label: 'Team Reports', icon: FileText },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setViewTab(tab.key)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all",
                      viewTab === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* My Team */}
              {viewTab === 'team' && (
                <div>
                  <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                      <button
                        onClick={() => setTeamTab('agents')}
                        className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", teamTab === 'agents' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                      >
                        Agents ({agents.length})
                      </button>
                      <button
                        onClick={() => setTeamTab('affiliates')}
                        className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all", teamTab === 'affiliates' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                      >
                        Affiliates ({affiliates.length})
                      </button>
                    </div>
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={`Search ${teamTab}...`}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {filteredMembers.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {filteredMembers.map(member => (
                        <button
                          key={member.id}
                          onClick={() => router.push(`/dashboard/network/${member.id}`)}
                          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all text-left group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm",
                              member.role === 'AGENT' ? "bg-gradient-to-br from-violet-400 to-indigo-600" : "bg-gradient-to-br from-blue-400 to-cyan-600"
                            )}>
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-900">{member.name}</p>
                                <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest", member.role === 'AGENT' ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600")}>{member.role}</span>
                                {member === topEarners[0] && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                              </div>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-[10px] text-slate-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {member.dailyLeads}/d</span>
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><DollarSign className="w-3 h-3" /> ₦{member.earnings.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-400">{member.monthlyConversions} convs</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 mt-4 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 text-xs font-bold rounded-xl border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                                onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/network/${member.id}?tab=targets`); }}
                              >
                                Target Adjustment
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 text-xs font-bold rounded-xl border-slate-200 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200"
                                onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/network/${member.id}?tab=reports`); }}
                              >
                                Report View
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 text-xs font-bold rounded-xl border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
                                onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/network/${member.id}?tab=history`); }}
                              >
                                Earnings
                              </Button>
                            </div>
                            <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-400 ml-2">
                              <span className={cn("font-bold px-2 py-0.5 rounded-full", member.completionRate >= 80 ? "bg-emerald-50 text-emerald-600" : member.completionRate >= 60 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600")}>{member.completionRate}%</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors hidden sm:block" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-400">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-sm font-bold">No {teamTab} in your team yet.</p>
                      <p className="text-xs text-slate-400 mt-1">Start recruiting to build your network</p>
                    </div>
                  )}
                </div>
              )}

              {/* Earnings */}
              {viewTab === 'earnings' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      Team Earnings Breakdown
                    </h3>
                    <span className="text-xs text-slate-400">Your {commissionRate}% commission: <span className="font-bold text-emerald-600">₦{Math.round(totalTeamEarnings * (commissionRate / 100)).toLocaleString()}</span></span>
                  </div>

                  {/* Top Earner Spotlight */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-5 h-5 text-amber-500" />
                      <span className="text-xs font-black text-amber-700 uppercase tracking-wider">Top Performer</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center font-bold text-white text-xl shadow-lg">
                          {topEarners[0]?.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-lg font-black text-slate-900">{topEarners[0]?.name}</p>
                          <p className="text-xs text-slate-500">{topEarners[0]?.role} • {topEarners[0]?.completionRate}% completion rate</p>
                          <p className="text-xs text-slate-400 mt-0.5">{topEarners[0]?.businessesReferred} businesses referred, {topEarners[0]?.leadsSubmitted} leads submitted</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-emerald-600">₦{topEarners[0]?.earnings.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">current period earnings</p>
                      </div>
                    </div>
                  </div>

                  {/* Earnings Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Role</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Leads</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Businesses</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Conversions</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Earnings</th>
                          <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Your {commissionRate}%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {topEarners.map((member, idx) => (
                          <tr key={member.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <span className={cn("text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center", idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-slate-200 text-slate-600" : idx === 2 ? "bg-orange-100 text-orange-700" : "text-slate-400")}>{idx + 1}</span>
                                <span className="text-sm font-bold text-slate-900">{member.name}</span>
                              </div>
                            </td>
                            <td className="py-3 text-center">
                              <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded uppercase", member.role === 'AGENT' ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600")}>{member.role}</span>
                            </td>
                            <td className="py-3 text-center text-sm font-bold text-slate-900">{member.leadsSubmitted}</td>
                            <td className="py-3 text-center text-sm font-bold text-slate-900">{member.businessesReferred}</td>
                            <td className="py-3 text-center text-sm font-bold text-emerald-600">{member.monthlyConversions}</td>
                            <td className="py-3 text-right text-sm font-bold text-emerald-600">₦{member.earnings.toLocaleString()}</td>
                            <td className="py-3 text-right text-sm font-bold text-blue-600">₦{Math.round(member.earnings * (commissionRate / 100)).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="text-xs text-blue-800">
                      <p className="font-bold mb-1">How earnings work</p>
                      <p>When your agents and affiliates refer businesses or submit leads, their earnings contribute to your team performance. You earn {commissionRate}% commission on top of their earnings. Click any team member to see their detailed breakdown.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Referral Center */}
              {viewTab === 'referrals' && (
                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                      <Handshake className="w-4 h-4 text-blue-600" />
                      Referral & Lead Attribution
                    </h3>
                    <p className="text-xs text-slate-500">When your team members refer businesses or submit leads, they count toward your network performance. Every lead and business they submit contributes to your milestone progress and earnings.</p>
                  </div>

                  {/* Attribution Explanation */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6">
                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      How Attribution Works
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 mb-1">Team Members</h5>
                        <p className="text-[10px] text-slate-500">Agents and affiliates under you submit leads and close deals</p>
                      </div>
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                          <BarChart3 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 mb-1">Counts Toward Network</h5>
                        <p className="text-[10px] text-slate-500">All their activities contribute to your network performance metrics and milestone progress</p>
                      </div>
                      <div className="text-center">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                          <DollarSign className="w-5 h-5 text-amber-600" />
                        </div>
                        <h5 className="text-xs font-bold text-slate-900 mb-1">You Earn Commission</h5>
                        <p className="text-[10px] text-slate-500">You receive {commissionRate}% of all earnings generated by your team members</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Team Reports */}
              {viewTab === 'team-reports' && (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Team Performance Reports
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                        <h4 className="font-black text-slate-900 mb-1">Daily Report</h4>
                        <p className="text-[10px] text-slate-500 font-medium mb-4 uppercase tracking-widest">Today's Activity</p>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-2">
                             <span className="text-slate-600">Total Leads</span>
                             <span className="font-black text-slate-900">{totalTeamLeads > 0 ? Math.round(totalTeamLeads / 7) : 0}</span>
                           </div>
                           <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-2">
                             <span className="text-slate-600">Conversions</span>
                             <span className="font-black text-emerald-600">{totalTeamConversions > 0 ? Math.round(totalTeamConversions / 30) : 0}</span>
                           </div>
                        </div>
                     </div>

                     <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                        <h4 className="font-black text-slate-900 mb-1">Weekly Report</h4>
                        <p className="text-[10px] text-slate-500 font-medium mb-4 uppercase tracking-widest">This Week's Activity</p>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-2">
                             <span className="text-slate-600">Total Leads</span>
                             <span className="font-black text-slate-900">{totalTeamLeads}</span>
                           </div>
                           <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-2">
                             <span className="text-slate-600">Conversions</span>
                             <span className="font-black text-emerald-600">{totalTeamConversions > 0 ? Math.round(totalTeamConversions / 4) : 0}</span>
                           </div>
                        </div>
                     </div>

                     <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                        <h4 className="font-black text-slate-900 mb-1">Monthly Report</h4>
                        <p className="text-[10px] text-slate-500 font-medium mb-4 uppercase tracking-widest">This Month's Activity</p>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-2">
                             <span className="text-slate-600">Total Leads</span>
                             <span className="font-black text-slate-900">{totalTeamLeads * 4}</span>
                           </div>
                           <div className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-2">
                             <span className="text-slate-600">Conversions</span>
                             <span className="font-black text-emerald-600">{totalTeamConversions}</span>
                           </div>
                           <div className="flex justify-between items-center text-sm">
                             <span className="text-slate-600">Earnings</span>
                             <span className="font-black text-blue-600">₦{totalTeamEarnings.toLocaleString()}</span>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Affiliates section (always visible) */}
        {recruits.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Your Direct Affiliates</h3>
              <span className="text-xs text-slate-400">{recruits.length} total</span>
            </div>
            <div className="divide-y divide-slate-100">
              {managers.map((affiliate) => (
                <div key={affiliate.id} className="p-4 sm:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm sm:text-base uppercase">
                      {(affiliate.name || 'A').charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">{affiliate.name}</h4>
                      <p className="text-xs sm:text-sm text-slate-500">Sub-affiliate</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-bold text-emerald-600">{affiliate.earnings}</p>
                    <p className="text-[10px] sm:text-xs text-slate-400">Your {commissionRate}% share</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Milestone Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 sm:p-6 flex gap-3 sm:gap-4">
          <Info className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
          <div className="text-xs sm:text-sm text-blue-800">
            <p className="font-bold mb-1">About Team Attribution:</p>
            <p>Every lead submitted and business referred by your agents and affiliates counts toward your network performance. You can adjust their targets, view their activities, and assign referrals to maximize your team's output. Changes to targets are logged and visible in both the admin dashboard and their personal dashboards.</p>
          </div>
        </div>

        <LineManagerGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} networkStats={networkStats} />
      </div>
    </DashboardLayout>
  );
}
