'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, CheckCircle2, Info, Target,
  Clock, ArrowRight, Lock, TrendingUp, Users,
  BarChart3, DollarSign, Search, Loader2, Award, Star, BookOpen, Handshake,
  ChevronRight, ChevronDown, ChevronUp, Activity, FileText,
  Share2, Download, ArrowLeft
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LineManagerGuideModal from '@/components/dashboard/LineManagerGuideModal';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/toast';
import {
  downloadReportAsPdf,
  shareReport as exportShare,
  ReportExportData,
} from '@/lib/report-export';
import ReportComments from '@/components/dashboard/ReportComments';

type TeamMember = {
  id: string; name: string; role: 'AGENT' | 'AFFILIATE'; email: string; phone: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'; dailyLeads: number; weeklyLeads: number;
  monthlyConversions: number; completionRate: number; lastActive: string; earnings: number;
  totalEarnings: number; joinedDate: string; dailyLeadTarget: number; monthlyConversionTarget: number;
  businessesReferred: number; leadsSubmitted: number; activities: any[]; targetAdjustments: any[];
};

export default function NetworkPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [teamReports, setTeamReports] = useState<Record<string, any>>({});
  const [recruits, setRecruits] = useState<any[]>([]);
  const [teamTab, setTeamTab] = useState<'agents' | 'affiliates'>('agents');
  const [viewTab, setViewTab] = useState<'team' | 'earnings' | 'referrals' | 'team-reports'>('team');
  const [searchQuery, setSearchQuery] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [commissionRate, setCommissionRate] = useState(10);
  const [openReportTeam, setOpenReportTeam] = useState<'daily' | 'weekly' | 'monthly' | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const fetchNetworkData = async () => {
    setIsLoading(true);
    try {
      const [stats, recruitsData, settings, dailyReport, weeklyReport, monthlyReport] = await Promise.all([
        api.get('/network/stats'),
        api.get('/network/recruits?limit=50'),
        api.get('/settings').catch(() => null),
        api.get('/network/team-reports?period=daily'),
        api.get('/network/team-reports?period=weekly'),
        api.get('/network/team-reports?period=monthly'),
      ]);
      setNetworkStats(stats);
      const apiRecruits = recruitsData?.data || recruitsData || [];
      setRecruits(apiRecruits);
      setTeamReports({ daily: dailyReport, weekly: weeklyReport, monthly: monthlyReport });
      if (Array.isArray(apiRecruits)) {
        const formattedMembers: TeamMember[] = apiRecruits.map((r: any) => ({
          id: r.id,
          name: r.fullName || r.name || 'Team Member',
           role: (r.role === 'AFFILIATE' ? 'AFFILIATE' : 'AGENT') as TeamMember['role'],
          email: r.email || '',
          phone: r.phone || '',
          status: 'ACTIVE' as const,
           dailyLeads: r.dailyLeadsCount ?? 0,
           weeklyLeads: r.weeklyLeadsCount ?? 0,
           monthlyConversions: r.monthlyConversionsCount ?? 0,
           completionRate: r.completionRate ?? 0,
           lastActive: r.updatedAt ? new Date(r.updatedAt).toISOString().split('T')[0] : '',
           earnings: r.totalEarnings ?? 0,
           totalEarnings: r.totalEarnings ?? 0,
          joinedDate: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
           dailyLeadTarget: r.dailyLeadTarget ?? 0,
           monthlyConversionTarget: r.monthlyConversionTarget ?? 0,
           businessesReferred: r.businessCount ?? 0,
           leadsSubmitted: r.leadCount ?? 0,
           activities: [],
          targetAdjustments: [],
        }));
        setTeamMembers(formattedMembers);
      }
      if (settings?.directCommissionRate) {
        setCommissionRate(settings.directCommissionRate);
      }
      if (stats?.milestones?.agents?.isReached && stats?.milestones?.businesses?.isReached) {
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
  const qualificationDays = networkStats?.managerQualificationExpiry && user?.createdAt
    ? Math.max(0, Math.round((new Date(networkStats.managerQualificationExpiry).getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  useEffect(() => {
    if (!user?.createdAt) return;
    const targetDate = networkStats?.managerQualificationExpiry ? new Date(networkStats.managerQualificationExpiry) : null;
    if (!targetDate) return;
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
  }, [user?.createdAt, networkStats?.managerQualificationExpiry]);

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
  const rewardDurationLabel = networkStats?.isManagerMode ? 'Extended' : 'Standard';
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
  const avgCompletion = teamMembers.length ? Math.round(teamMembers.reduce((s, m) => s + m.completionRate, 0) / teamMembers.length) : 0;

  const openTeamReports = () => setViewTab('team-reports');

  const buildTeamReportData = (key: 'daily' | 'weekly' | 'monthly', s: any): ReportExportData => {
    const comments: { author: string; role: string; text: string; date: string }[] = [];
    const memberBreakdown = (teamReports[key]?.agentPerformance || []).map((m: any) => `${m.fullName}: ${m.leads} leads, ${m.conversions} convs, ${m.conversionRate}%`);
    const summary = s.leads >= s.target
      ? `Your team of ${teamMembers.length} members generated ${s.leads} leads (${s.convs} conversions) during this period with an average completion rate of ${s.rate}%. The team is meeting overall targets.`
      : `Your team of ${teamMembers.length} members generated ${s.leads} leads (${s.convs} conversions) during this period with an average completion rate of ${s.rate}%. The team is at ${Math.min(100, Math.round((s.leads / s.target) * 100))}% of the collective target.`;

    return {
      reportTitle: `Team ${key === 'daily' ? 'Daily' : key === 'weekly' ? 'Weekly' : 'Monthly'} Report — ${key === 'daily' ? 'Today' : key === 'weekly' ? 'This Week' : 'This Month'}`,
      author: user?.fullName || 'Line Manager',
      role: 'LINE MANAGER',
      dateLabel: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      summaryCards: [
        { label: 'Team Leads', value: `${s.leads}` },
        { label: 'Conversions', value: `${s.convs}` },
        { label: 'Visits', value: `${s.visits}` },
        { label: 'Completion Rate', value: `${s.rate}%` },
        { label: 'Team Earnings', value: `₦${s.earnings.toLocaleString()}` },
      ],
      summary,
      sections: [
        {
          title: 'Target Progress',
          lines: [
            `Leads Target: ${s.leads}/${s.target} (${Math.min(100, Math.round((s.leads / s.target) * 100))}%)`,
            `Conversion Rate: ${s.leads > 0 ? Math.round((s.convs / s.leads) * 100) : 0}%`,
          ],
        },
        {
          title: 'Member Breakdown',
          lines: memberBreakdown,
        },
      ],
      businesses: [],
      notes: [],
      comments,
    };
  };

  const shareTeamReport = async (key: 'daily' | 'weekly' | 'monthly', s: any) => {
    try {
      await exportShare(buildTeamReportData(key, s));
      showToast(`${key.charAt(0).toUpperCase() + key.slice(1)} team report shared`, 'success');
    } catch {
      showToast('Sharing cancelled', 'info');
    }
  };

  const downloadTeamReport = (key: 'daily' | 'weekly' | 'monthly', s: any) => {
    const ok = downloadReportAsPdf(buildTeamReportData(key, s));
    showToast(ok ? 'Opening PDF preview — choose "Save as PDF" to download' : 'Could not open PDF preview', ok ? 'success' : 'error');
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {!isUnlocked ? (
          <>
            <Link href="/dashboard" className="inline-flex items-center gap-2 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors w-fit">
              <ArrowLeft className="w-5 h-5" />
            </Link>
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
                 Build your team and hit the targets <span className="text-orange-600 font-bold">within {qualificationDays} days</span> to unlock your <span className="font-bold text-blue-600">Line Manager Network</span> and earn <span className="font-bold text-blue-600">{commissionRate}% of affiliate earnings</span>.
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
          </>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <Link href="/dashboard" className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0">
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 truncate">Line Manager Network</h2>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
                  <p className="text-xs sm:text-sm text-slate-500">Team Management</p>
                  <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block" />
                  <div className={cn("flex items-center gap-1 text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full", isFullMilestoneReached ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-blue-50 text-blue-600 border border-blue-100")}>
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="truncate">{isFullMilestoneReached ? `${rewardDurationLabel}` : "3-Month Mode"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="hidden sm:flex bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-bold items-center gap-1.5 border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified LM
                </div>
                <button onClick={openTeamReports} className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Team Reports</span>
                </button>
                <button onClick={() => setShowGuide(true)} className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold transition-colors">
                  <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Members</p>
                <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{teamMembers.length}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">{agents.length} agents, {affiliates.length} affiliates</p>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Earnings</p>
                <p className="text-lg sm:text-2xl font-black text-emerald-600 mt-1 truncate">₦{totalTeamEarnings.toLocaleString()}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">Your {commissionRate}%: ₦{Math.round(totalTeamEarnings * (commissionRate / 100)).toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Weekly Leads</p>
                <p className="text-xl sm:text-2xl font-black text-blue-600 mt-1">{totalTeamLeads}</p>
                <p className="text-[9px] sm:text-[10px] text-slate-400">Across all members</p>
              </div>
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Completion Rate</p>
                <p className="text-xl sm:text-2xl font-black text-purple-600 mt-1">{avgCompletion}%</p>
                <p className="text-[9px] sm:text-[10px] text-slate-400 truncate">{topEarners[0]?.name} leads at {topEarners[0]?.completionRate}%</p>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-100 overflow-x-auto scrollbar-hide">
                {[
                  { key: 'team' as const, label: 'My Team', icon: Users },
                  { key: 'earnings' as const, label: 'Earnings', icon: DollarSign },
                  { key: 'team-reports' as const, label: 'Team Reports', icon: FileText },
                  { key: 'referrals' as const, label: 'Referral Center', icon: Handshake },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setViewTab(tab.key)}
                    className={cn(
                      "flex items-center gap-2 px-4 sm:px-6 py-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap",
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
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="hidden sm:flex items-center gap-3 text-[10px] text-slate-400">
                              <span className={cn("font-bold px-2 py-0.5 rounded-full", member.completionRate >= 80 ? "bg-emerald-50 text-emerald-600" : member.completionRate >= 60 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600")}>{member.completionRate}%</span>
                            </span>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shrink-0">
                          {topEarners[0]?.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-lg font-black text-slate-900 truncate">{topEarners[0]?.name}</p>
                          <p className="text-xs text-slate-500">{topEarners[0]?.role} • {topEarners[0]?.completionRate}% completion rate</p>
                          <p className="text-xs text-slate-400 mt-0.5">{topEarners[0]?.businessesReferred} businesses referred, {topEarners[0]?.leadsSubmitted} leads submitted</p>
                        </div>
                      </div>
                      <div className="sm:text-right shrink-0">
                        <p className="text-xl sm:text-2xl font-black text-emerald-600">₦{topEarners[0]?.earnings.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">current period earnings</p>
                      </div>
                    </div>
                  </div>

                  {/* Earnings Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left">
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Team Performance Reports
                    </h3>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Leads</p>
                      <p className="text-xl sm:text-2xl font-black text-blue-600 truncate">{totalTeamLeads > 0 ? Math.round(totalTeamLeads / 7) : 0}</p>
                      <p className="text-[10px] text-slate-500">{teamMembers.length} members active</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Leads</p>
                      <p className="text-xl sm:text-2xl font-black text-emerald-600 truncate">{totalTeamLeads}</p>
                      <p className="text-[10px] text-slate-500">{avgCompletion}% avg rate</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-2xl border border-purple-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Earnings</p>
                      <p className="text-xl sm:text-2xl font-black text-purple-600 truncate">₦{totalTeamEarnings.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500">{totalTeamConversions} conversions</p>
                    </div>
                  </div>

                  {/* Accordion Reports */}
                  {[
                    { key: 'daily' as const, icon: BarChart3, color: 'blue', title: 'Daily Report — Today',
                       stats: { leads: teamReports.daily?.metrics?.totalLeads ?? 0, target: teamMembers.reduce((sum, member) => sum + member.dailyLeadTarget, 0), convs: teamReports.daily?.metrics?.totalConversions ?? 0, visits: teamReports.daily?.metrics?.totalVisits ?? 0, rate: teamReports.daily?.metrics?.averageCompletionRate ?? 0, earnings: teamReports.daily?.metrics?.totalRevenueGenerated ?? 0 } },
                    { key: 'weekly' as const, icon: Activity, color: 'indigo', title: 'Weekly Report — This Week',
                       stats: { leads: teamReports.weekly?.metrics?.totalLeads ?? 0, target: teamMembers.reduce((sum, member) => sum + member.dailyLeadTarget, 0) * 7, convs: teamReports.weekly?.metrics?.totalConversions ?? 0, visits: teamReports.weekly?.metrics?.totalVisits ?? 0, rate: teamReports.weekly?.metrics?.averageCompletionRate ?? 0, earnings: teamReports.weekly?.metrics?.totalRevenueGenerated ?? 0 } },
                    { key: 'monthly' as const, icon: TrendingUp, color: 'emerald', title: 'Monthly Report — This Month',
                       stats: { leads: teamReports.monthly?.metrics?.totalLeads ?? 0, target: teamMembers.reduce((sum, member) => sum + member.dailyLeadTarget, 0) * 30, convs: teamReports.monthly?.metrics?.totalConversions ?? 0, visits: teamReports.monthly?.metrics?.totalVisits ?? 0, rate: teamReports.monthly?.metrics?.averageCompletionRate ?? 0, earnings: teamReports.monthly?.metrics?.totalRevenueGenerated ?? 0 } },
                  ].map(section => {
                    const s = section.stats;
                    const isOpen = openReportTeam === section.key;
                    return (
                      <div key={section.key} className="bg-white rounded-2xl border border-slate-200 relative">
                        <button
                          onClick={() => setOpenReportTeam(isOpen ? null : section.key)}
                          className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                        >
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <section.icon className={`w-4 h-4 text-${section.color}-600`} />
                            {section.title}
                          </h3>
                          <span className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">{s.leads} team leads</span>
                            {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="p-5 pt-0 border-t border-slate-100 space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-4">
                              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
                                <p className="text-lg sm:text-xl font-black text-blue-600">{s.leads}</p>
                                <p className="text-[10px] font-bold text-slate-500">Team Leads</p>
                              </div>
                              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                                <p className="text-lg sm:text-xl font-black text-emerald-600">{s.convs}</p>
                                <p className="text-[10px] font-bold text-slate-500">Convs</p>
                              </div>
                              <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
                                <p className="text-lg sm:text-xl font-black text-purple-600">{s.visits}</p>
                                <p className="text-[10px] font-bold text-slate-500">Visits</p>
                              </div>
                              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                                <p className="text-lg sm:text-xl font-black text-amber-600">{s.rate}%</p>
                                <p className="text-[10px] font-bold text-slate-500">Rate</p>
                              </div>
                            </div>

                            {/* Summary description */}
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-xs text-slate-700 leading-relaxed">
                                <span className="font-bold">Team Summary:</span> Your team of {teamMembers.length} members has generated {s.leads} leads ({s.convs} conversions) during this period with an average completion rate of {s.rate}%. {s.leads >= s.target ? 'The team is meeting overall targets.' : `The team is at ${Math.round((s.leads / s.target) * 100)}% of the collective target.`} {s.rate >= 80 ? 'Consistency is strong across the board.' : s.rate >= 60 ? 'Some members may benefit from additional coaching.' : 'Consider reviewing individual performance to identify support needs.'}
                              </p>
                            </div>

                            {/* Detailed Breakdown */}
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Target className="w-3.5 h-3.5" /> Detailed Breakdown
                              </h4>

                              {/* Target Progress */}
                              <div className="p-4 rounded-xl bg-white border border-slate-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <Target className="w-4 h-4 text-blue-600" />
                                  <span className="text-xs font-bold text-slate-900">Team Target Progress</span>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Leads Target</span><span className="font-bold text-slate-900">{s.leads}/{s.target}</span></div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (s.leads / s.target) * 100)}%` }} />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Conversion Rate</span><span className="font-bold text-slate-900">{s.leads > 0 ? Math.round((s.convs / s.leads) * 100) : 0}%</span></div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, s.leads > 0 ? (s.convs / s.leads) * 100 : 0)}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Conversion Breakdown */}
                              <div className="p-4 rounded-xl bg-white border border-slate-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                                  <span className="text-xs font-bold text-slate-900">Conversion Breakdown</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
                                    <p className="text-lg sm:text-xl font-black text-blue-600">{s.leads}</p>
                                    <p className="text-[10px] font-bold text-slate-500">Team Leads</p>
                                  </div>
                                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                                    <p className="text-lg sm:text-xl font-black text-emerald-600">{s.convs}</p>
                                    <p className="text-[10px] font-bold text-slate-500">Conversions</p>
                                  </div>
                                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
                                    <p className="text-lg sm:text-xl font-black text-purple-600">{s.visits}</p>
                                    <p className="text-[10px] font-bold text-slate-500">Visits</p>
                                  </div>
                                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                                    <p className="text-lg sm:text-xl font-black text-amber-600">₦{s.earnings.toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-slate-500">Earnings</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Individual member breakdown */}
                            <div className="space-y-2">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Users className="w-3.5 h-3.5" /> Member Breakdown
                              </h4>
                              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
                                {teamMembers.map(m => {
                                  const memberLeads = section.key === 'daily' ? m.dailyLeads : section.key === 'weekly' ? m.weeklyLeads : Math.round(m.dailyLeads * 30);
                                  const memberConvs = section.key === 'daily' ? Math.round(m.dailyLeads * 0.4) : section.key === 'weekly' ? m.monthlyConversions : m.monthlyConversions;
                                  return (
                                    <button
                                      key={m.id}
                                      onClick={() => router.push(`/dashboard/network/${m.id}`)}
                                      className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors text-left"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs", m.role === 'AGENT' ? "bg-violet-500" : "bg-cyan-500")}>{m.name.charAt(0)}</div>
                                        <div>
                                          <p className="text-xs font-bold text-slate-900">{m.name}</p>
                                          <p className="text-[10px] text-slate-400">{m.role === 'AGENT' ? 'Agent' : 'Affiliate'}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4 text-xs">
                                        <span className="font-bold text-slate-900">{memberLeads} leads</span>
                                        <span className="font-bold text-emerald-600">{memberConvs} convs</span>
                                        <span className={cn("font-bold", m.completionRate >= 80 ? "text-emerald-600" : m.completionRate >= 60 ? "text-amber-600" : "text-red-500")}>{m.completionRate}%</span>
                                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Share / Download */}
                            <div className="flex items-center gap-2 justify-end pt-2 border-t border-slate-100">
                              <button onClick={() => shareTeamReport(section.key, s)} className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs transition-colors"><Share2 className="w-3.5 h-3.5" /> Share</button>
                              <button onClick={() => downloadTeamReport(section.key, s)} className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-xs transition-colors"><Download className="w-3.5 h-3.5" /> Download PDF</button>
                            </div>

                            {/* Comments */}
                            <ReportComments
                              reportKey={`network:team:${section.key}`}
                              currentUser={user ? { name: user.fullName, role: 'LINE MANAGER' } : null}
                              className="mt-4"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
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
