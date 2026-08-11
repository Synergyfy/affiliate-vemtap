'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import {
  BarChart3, Activity, TrendingUp, ArrowLeft, Target,
  Building2, Percent, MessageSquare, Clock,
  ChevronDown, ChevronUp, Share2, Download, FileText,
  Gauge, AlertTriangle, AlertCircle, CheckCircle2, XCircle, MapPin,
  BookOpenCheck, Users, Shield, Info, Loader2, RefreshCw, User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  buildReportText,
  downloadReportAsPdf,
  shareReport as exportShare,
  ReportExportData,
  ReportCommentData,
} from '@/lib/report-export';
import ReportComments from '@/components/dashboard/ReportComments';
import { useMarketMappingReportData } from '@/services/useMarketMappingHooks';
import type { MarketMappingReport, MarketMappingReportDay, MarketMappingReportWeights } from '@/services/useMarketMappingHooks';

const METRIC_ROWS: Array<{ icon: LucideIcon; label: string; weightKey: keyof MarketMappingReportWeights; tip: string }> = [
  { icon: Users, label: 'Daily Lead Submission', weightKey: 'leads', tip: 'Submit at least 20 new leads every day. This is the single biggest driver of your score — if you submit fewer than 20 leads on a day, this part of your score drops.' },
  { icon: TrendingUp, label: 'Lead Conversion', weightKey: 'conversion', tip: 'How well your leads move forward — becoming Interested or Customers. The system references a 40% conversion rate; scoring above that pushes you to 100% here.' },
  { icon: BookOpenCheck, label: 'Business Information', weightKey: 'businessInfo', tip: 'Completing each business profile — category, contact, size, opening hours and, importantly, the accurate GPS location of the business.' },
  { icon: MapPin, label: 'Field Activity / Visits', weightKey: 'visits', tip: 'Actually going out and visiting the businesses you planned. Field visits confirm the business physically exists at the recorded location.' },
  { icon: Clock, label: 'Daily Completion', weightKey: 'completion', tip: 'Finishing and submitting your daily work for the day. Know you may be busy on the field — you can submit when you get home. Daily completion only counts a small 5% towards your score.' },
];

type Scope = 'daily' | 'weekly' | 'monthly';

const visitStatusInfo = (status: string) => {
  switch (status) {
    case 'CUSTOMER': return { label: 'Converted', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' };
    case 'INTERESTED': return { label: 'Interested', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' };
    case 'CONTACTED': return { label: 'Contacted', dot: 'bg-indigo-500', badge: 'bg-indigo-100 text-indigo-700' };
    case 'VISITED': return { label: 'Visited', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' };
    case 'NOT_YET': return { label: 'Pending', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' };
    case 'NOT_INTERESTED': return { label: 'Declined', dot: 'bg-red-500', badge: 'bg-red-100 text-red-700' };
    default: return { label: status || '—', dot: 'bg-slate-500', badge: 'bg-slate-100 text-slate-700' };
  }
};

const fmtWeight = (val: number | undefined) => Math.round((val ?? 0) * 100);

export default function WorkMetricReports({
  backHref = '/dashboard/market-mapping/insights',
  userId,
  userName,
  userRole,
}: {
  backHref?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [openReport, setOpenReport] = useState<Scope | null>('daily');
  const [missedOpen, setMissedOpen] = useState(false);
  const [scoreInfoOpen, setScoreInfoOpen] = useState(false);
  const [activeTip, setActiveTip] = useState<string | null>(null);

  const daily = useMarketMappingReportData(userId, 'daily');
  const weekly = useMarketMappingReportData(userId, 'weekly');
  const monthly = useMarketMappingReportData(userId, 'monthly');
  const isLoading = daily.isLoading || weekly.isLoading || monthly.isLoading;
  const error = daily.error || weekly.error || monthly.error;
  const refetch = () => { daily.refetch(); weekly.refetch(); monthly.refetch(); };

  const reports: Partial<Record<Scope, MarketMappingReport>> = {
    daily: daily.data,
    weekly: weekly.data,
    monthly: monthly.data,
  };

  const rawWeights = monthly.data?.weights;
  const weights: MarketMappingReportWeights = {
    leads: rawWeights?.leads ?? 0,
    conversion: rawWeights?.conversion ?? 0,
    businessInfo: rawWeights?.businessInfo ?? 0,
    visits: rawWeights?.visits ?? 0,
    completion: rawWeights?.completion ?? 0,
    riskThreshold: rawWeights?.riskThreshold ?? 0,
    conversionReference: rawWeights?.conversionReference ?? 0,
    leadTarget: rawWeights?.leadTarget ?? 0,
  };
  const riskThreshold = weights.riskThreshold ?? 0;
  const leadTarget = weights.leadTarget ?? 0;
  const conversionReference = weights.conversionReference ?? 0;

  const ledger: MarketMappingReportDay[] = monthly.data?.ledger ?? [];
  const avg = (arr: MarketMappingReportDay[]) => (arr.length ? Math.round(arr.reduce((s, d) => s + d.score, 0) / arr.length) : 0);
  const todayScore = ledger.length > 0 ? ledger[0].score : 0;
  const weekScore = avg(ledger.slice(0, 7));
  const monthScore = avg(ledger);
  const missedDays = ledger.filter((d) => d.score < riskThreshold);
  const missedCount = missedDays.length;

  const statsOf = (r: MarketMappingReport | undefined) => {
    const summary = r?.summary;
    return {
      leads: summary?.totalLeads ?? 0,
      target: leadTarget,
      conversions: summary?.totalConversions ?? 0,
      visits: summary?.totalVisits ?? 0,
      completionRate: summary?.completionRate ?? 0,
      businessesReferred: summary?.businessesReferred ?? 0,
      earnings: summary?.totalEarnings ?? 0,
      avgLeadsPerDay: summary?.avgLeadsPerDay ?? 0,
      avgConversionRate: summary?.avgConversionRate ?? 0,
    };
  };

  const dailyStats = statsOf(daily.data);
  const weeklyStats = statsOf(weekly.data);
  const monthlyStats = statsOf(monthly.data);

  const infoScore = (key: Scope) => {
    const days = key === 'daily' ? ledger.slice(0, 1) : key === 'weekly' ? ledger.slice(0, 7) : ledger;
    if (!days.length) return 0;
    return Math.round(days.reduce((sum, d) => sum + (d.infoComposite ?? 0), 0) / days.length);
  };

  const displayName = userName || user?.fullName || 'Affiliate';
  const displayRole = userRole || user?.role || 'AGENT';

  const getSectionSummary = (key: Scope, s: ReturnType<typeof statsOf>, score: number) => {
    const met = score >= riskThreshold;
    const gap = Math.max(0, riskThreshold - score);
    const suffix = met
      ? 'You are on track. Keep the momentum going!'
      : `You scored ${score}% — ${gap}% below the ${riskThreshold}% threshold. This is at risk of penalties. Focus on the Work Metrics below to recover.`;
    const targetPct = s.target > 0 ? Math.round((s.leads / s.target) * 100) : 0;
    if (key === 'daily') {
      return `${s.target > 0 && s.leads >= s.target ? 'You met your daily lead target.' : `You collected ${s.leads} leads today against a ${s.target}-lead target (${targetPct}%).`} You captured ${s.conversions} conversions from ${s.visits} visits at a ${s.completionRate}% completion rate. ${suffix}`;
    }
    if (key === 'weekly') {
      return `You generated ${s.leads} of ${s.target} leads this week (${targetPct}%), with ${s.conversions} conversions. Average weekly work score: ${score}%. ${suffix}`;
    }
    return `Across the month you collected ${s.leads} leads against a ${s.target} target (${targetPct}%), with ${s.conversions} conversions and ${s.visits} visits. Average monthly work score: ${score}%. ${suffix}`;
  };

  const scopeOfKey = (key: Scope) => ({
    stats: key === 'daily' ? dailyStats : key === 'weekly' ? weeklyStats : monthlyStats,
    score: key === 'daily' ? todayScore : key === 'weekly' ? weekScore : monthScore,
  });

  const buildExportData = (key: Scope, s: ReturnType<typeof statsOf>, score: number): ReportExportData => {
    const report = reports[key];
    const businesses = (report?.visits ?? []).slice(0, key === 'daily' ? 2 : key === 'weekly' ? 4 : 5).map((v) => ({
      name: v.businessName,
      type: v.category || 'Business',
      status: visitStatusInfo(v.status).label,
      notes: v.notes || '',
    }));
    const seedNotes = (report?.notes ?? []).slice(0, key === 'daily' ? 1 : key === 'weekly' ? 3 : 5).map((n) => ({
      author: displayName,
      role: displayRole,
      text: n.content,
      date: n.createdAt,
    }));
    const comments: ReportCommentData[] = [];

    const missedSection = key === 'monthly' && missedDays.length > 0
      ? [{
          title: 'Days You Missed Target',
          lines: missedDays.map((d) => `${d.date}: Work score ${d.score}% — ${d.leads}/${d.target} leads, ${d.conversions} conversions`),
        }]
      : [];

    return {
      reportTitle: key === 'daily' ? 'Daily Report — Today' : key === 'weekly' ? 'Weekly Report — This Week' : 'Monthly Report — This Month',
      author: displayName,
      role: displayRole,
      dateLabel: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      summaryCards: [
        { label: 'Work Score', value: `${score}%` },
        { label: 'Leads', value: `${s.leads}` },
        { label: 'Target', value: `${s.target}` },
        { label: 'Conversions', value: `${s.conversions}` },
        { label: 'Visits', value: `${s.visits}` },
        { label: 'Completion', value: `${s.completionRate}%` },
        { label: 'Earnings', value: `₦${s.earnings.toLocaleString()}` },
      ],
      summary: getSectionSummary(key, s, score),
      sections: [
        {
          title: 'Work Metric Score',
          lines: [
            `Work Metric Score: ${score}%`,
            `Risk threshold: ${riskThreshold}%`,
            score >= riskThreshold ? 'Status: ON TRACK' : `Status: AT RISK OF PENALTIES (${riskThreshold - score}% below threshold)`,
            `Lead Submission (${fmtWeight(weights.leads)}%): ${s.leads}/${s.target}`,
            `Lead Conversion (${fmtWeight(weights.conversion)}%): ${Math.round((s.conversions / Math.max(1, s.leads)) * 100)}% (ref ${Math.round(conversionReference * 100)}%)`,
            `Business Info + GPS (${fmtWeight(weights.businessInfo)}%): ${infoScore(key)}%`,
            `Field Visits (${fmtWeight(weights.visits)}%) + Daily Completion (${fmtWeight(weights.completion)}%)`,
          ],
        },
        ...missedSection,
        {
          title: 'Conversion Breakdown',
          lines: [
            `Total Conversions: ${s.conversions}`,
            `Conversion Rate: ${Math.round((s.conversions / Math.max(1, s.leads)) * 100)}%`,
            `Businesses Referred: ${s.businessesReferred}`,
            `Earnings: ₦${s.earnings.toLocaleString()}`,
          ],
        },
      ],
      businesses,
      notes: seedNotes,
      comments,
    };
  };

  const shareReport = async (key: Scope) => {
    const { stats: s, score } = scopeOfKey(key);
    try {
      await exportShare(buildExportData(key, s, score));
      showToast(`${key.charAt(0).toUpperCase() + key.slice(1)} report shared`, 'success');
    } catch (e) {
      const text = buildReportText(buildExportData(key, s, score));
      try {
        await navigator.clipboard.writeText(text);
        showToast('Report copied to clipboard', 'success');
      } catch {
        showToast('Sharing cancelled', 'info');
      }
    }
  };

  const downloadReport = (key: Scope) => {
    const { stats: s, score } = scopeOfKey(key);
    const ok = downloadReportAsPdf(buildExportData(key, s, score));
    showToast(ok ? 'Opening PDF preview — choose "Save as PDF" to download' : 'Could not open PDF preview', ok ? 'success' : 'error');
  };

  const sections = [
    { key: 'daily' as const, icon: BarChart3, color: 'blue', title: 'Daily Report — Today', label: 'Daily' },
    { key: 'weekly' as const, icon: Activity, color: 'indigo', title: 'Weekly Report — This Week', label: 'Weekly' },
    { key: 'monthly' as const, icon: TrendingUp, color: 'emerald', title: 'Monthly Report — This Month', label: 'Monthly' },
  ];

  const miniScores = [
    { label: 'Daily', value: todayScore },
    { label: 'Weekly', value: weekScore },
    { label: 'Monthly', value: monthScore },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            {userId ? `${displayName}'s Performance Reports` : 'My Performance Reports'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">{displayName} · Work metrics, targets &amp; daily scoring</p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-3 text-sm font-bold text-slate-500">Loading performance reports...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-600">Could not load performance reports.</p>
          <button onClick={refetch} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : (
        <>
          {/* Accordion Reports (single open, Daily open by default) */}
          <div className="space-y-4">
            {sections.map(section => {
              const { stats: s, score } = scopeOfKey(section.key);
              const report = reports[section.key];
              const isOpen = openReport === section.key;
              return (
                <div key={section.key} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setOpenReport(isOpen ? null : section.key)}
                    className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                  >
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <section.icon className={`w-4 h-4 text-${section.color}-600`} />
                      {section.title}
                    </h3>
                    <span className="flex items-center gap-2">
                      <span className={cn("text-xs font-black px-2 py-0.5 rounded-full", score >= riskThreshold ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                        {score}% score
                      </span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 border-t border-slate-100 space-y-4">
                      {/* Work Metric Score banner for this period */}
                      <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-4 text-white relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-36 h-36 bg-blue-500/20 blur-[70px] rounded-full" />
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-3">
                            <Gauge className="w-4 h-4 text-blue-300" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Work Metric Score · {section.label}</span>
                          </div>
                          <div className="flex items-center gap-5 flex-wrap">
                            <div className="flex items-center gap-4">
                              <div
                                className="w-24 h-24 rounded-full flex items-center justify-center relative shrink-0"
                                style={{ background: `conic-gradient(${score >= riskThreshold ? 'rgb(52 211 153)' : 'rgb(248 113 113)'} ${score * 3.6}deg, rgba(255,255,255,0.15) 0deg)` }}
                              >
                                <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center flex-col">
                                  <span className="text-2xl font-black leading-none">{score}%</span>
                                  <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest mt-0.5">Score</span>
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border", score >= riskThreshold ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" : "bg-red-500/20 text-red-300 border-red-400/30")}>
                                  {score >= riskThreshold ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                  {score >= riskThreshold ? 'On Track' : 'At Risk of Penalties'}
                                </span>
                                {score < riskThreshold && (
                                  <p className="text-xs text-red-200/90 font-medium max-w-[220px]">
                                    You are <span className="font-black">{riskThreshold - score}%</span> below the {riskThreshold}% threshold. Improve today's work to recover.
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {miniScores.map(m => (
                                <div key={m.label} className="bg-white/10 rounded-xl p-2.5 text-center border border-white/10">
                                  <p className={cn("text-lg font-black leading-none", m.value >= riskThreshold ? "text-emerald-300" : "text-red-300")}>{m.value}%</p>
                                  <p className="text-[8px] font-bold text-white/60 uppercase tracking-widest mt-0.5">{m.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Summary cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className={`p-3 rounded-xl bg-${section.color}-50 border border-${section.color}-100 text-center`}>
                          <p className={`text-lg font-black text-${section.color}-600`}>{s.leads}</p>
                          <p className="text-[10px] font-bold text-slate-500">Leads</p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                          <p className="text-lg font-black text-emerald-600">{s.conversions}</p>
                          <p className="text-[10px] font-bold text-slate-500">Convs</p>
                        </div>
                        <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
                          <p className="text-lg font-black text-purple-600">{s.visits}</p>
                          <p className="text-[10px] font-bold text-slate-500">Visits</p>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                          <p className="text-lg font-black text-amber-600">{score}%</p>
                          <p className="text-[10px] font-bold text-slate-500">Work Score</p>
                        </div>
                      </div>

                      {/* Summary explanation */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-xs text-slate-700 leading-relaxed">
                          <span className="font-bold">Summary:</span>{' '}
                          {getSectionSummary(section.key, s, score)}
                        </p>
                      </div>

                      {/* Work metric mini breakdown */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-slate-900">Work Metric Breakdown</span>
                          <span className={cn("ml-auto text-[10px] font-black px-2 py-0.5 rounded-full", score >= riskThreshold ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                            {score >= riskThreshold ? 'On Track' : 'At Risk'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Lead Submission ({fmtWeight(weights.leads)}%)</span><span className="font-bold text-slate-900">{s.target > 0 ? Math.min(100, Math.round((s.leads / s.target) * 100)) : 0}%</span></div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.target > 0 ? Math.min(100, Math.round((s.leads / s.target) * 100)) : 0}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Conversion ({fmtWeight(weights.conversion)}%)</span><span className="font-bold text-slate-900">{Math.min(100, Math.round((s.conversions / Math.max(1, s.leads) / conversionReference) * 100))}%</span></div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.round((s.conversions / Math.max(1, s.leads) / conversionReference) * 100))}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Business Info + GPS ({fmtWeight(weights.businessInfo)}%)</span><span className="font-bold text-slate-900">{infoScore(section.key)}%</span></div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${infoScore(section.key)}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Field Visits ({fmtWeight(weights.visits)}%)</span><span className="font-bold text-slate-900">{s.target > 0 ? Math.min(100, Math.round((s.visits / s.target) * 100)) : 0}%</span></div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${s.target > 0 ? Math.min(100, Math.round((s.visits / s.target) * 100)) : 0}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Daily Completion ({fmtWeight(weights.completion)}%)</span><span className="font-bold text-slate-900">{s.completionRate}%</span></div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${s.completionRate}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Business Details */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-bold text-slate-900">Businesses Visited</span>
                        </div>
                        {report?.visits && report.visits.length > 0 ? (
                          <div className="space-y-2">
                            {report.visits.slice(0, section.key === 'daily' ? 2 : section.key === 'weekly' ? 4 : 5).map((v) => {
                              const status = visitStatusInfo(v.status);
                              return (
                                <div key={v.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50">
                                  <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", status.dot)} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-900">{v.businessName}</span>
                                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold", status.badge)}>{status.label}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{v.category || 'Business'}{v.notes ? ` · ${v.notes}` : ''}{v.date ? ` · ${new Date(v.date).toLocaleDateString()}` : ''}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic py-2">No businesses visited in this period.</p>
                        )}
                      </div>

                      {/* Conversion Rate Details */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Percent className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-slate-900">Conversion Breakdown</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                            <p className="text-lg font-black text-emerald-600">{s.conversions}</p>
                            <p className="text-[10px] font-bold text-slate-500">Total Convs</p>
                          </div>
                          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
                            <p className="text-lg font-black text-blue-600">{Math.round((s.conversions / Math.max(1, s.leads)) * 100)}%</p>
                            <p className="text-[10px] font-bold text-slate-500">Conv Rate</p>
                          </div>
                          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-center">
                            <p className="text-lg font-black text-purple-600">{s.businessesReferred}</p>
                            <p className="text-[10px] font-bold text-slate-500">Referred Biz</p>
                          </div>
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
                            <p className="text-lg font-black text-amber-600">₦{s.earnings.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-slate-500">Earnings</p>
                          </div>
                        </div>
                      </div>

                      {/* Share / Download Buttons */}
                      <div className="flex items-center gap-2 justify-end pt-2 border-t border-slate-100">
                        <button onClick={() => shareReport(section.key)} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-${section.color}-50 hover:bg-${section.color}-100 text-${section.color}-600 font-bold text-xs transition-colors`}><Share2 className="w-3.5 h-3.5" /> Share</button>
                        <button onClick={() => downloadReport(section.key)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-xs transition-colors"><Download className="w-3.5 h-3.5" /> Download PDF</button>
                      </div>

                      {/* Comments / Notes */}
                      {userId ? (
                        <div className="p-4 rounded-xl bg-white border border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-orange-600" />
                            <span className="text-xs font-bold text-slate-900">Notes &amp; Comments</span>
                            {report?.notes && report.notes.length > 0 && (
                              <span className="ml-auto text-[10px] font-bold text-slate-400">{report.notes.length}</span>
                            )}
                          </div>
                          {report?.notes && report.notes.length > 0 ? (
                            <div className="space-y-2">
                              {report.notes.slice(0, 5).map((n) => (
                                <div key={n.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50">
                                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <User className="w-3 h-3" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-700">{n.content}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {n.businessName ? `${n.businessName} · ` : ''}
                                      {new Date(n.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic py-2">No notes recorded in this period.</p>
                          )}
                        </div>
                      ) : (
                        <ReportComments
                          reportKey={`insights:${section.key}`}
                          currentUser={user ? { name: user.fullName, role: user?.role || 'AGENT' } : null}
                          className="mt-4"
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* How your Work Score is measured — dropdown (closed by default) */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setScoreInfoOpen(!scoreInfoOpen)}
              className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
            >
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BookOpenCheck className="w-4 h-4 text-blue-600" />
                How your Work Score is measured
              </h3>
              {scoreInfoOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {scoreInfoOpen && (
              <div className="p-5 pt-0 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 mb-3">
                  Tap the <Info className="inline w-3 h-3 text-slate-400" /> icon on any metric to learn what it means.
                </p>
                <div className="space-y-1.5">
                  {METRIC_ROWS.map(row => (
                    <div key={row.label}>
                      <div className="flex items-center gap-2.5 text-xs">
                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                          <row.icon className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <span className="text-slate-600 font-medium min-w-0 truncate">{row.label}</span>
                        <span className="ml-auto shrink-0 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] font-black">{fmtWeight(weights[row.weightKey])}%</span>
                        <button
                          type="button"
                          onClick={() => setActiveTip(activeTip === row.label ? null : row.label)}
                          className="shrink-0 p-1 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 active:scale-90 transition-all"
                          aria-label={`What does ${row.label} mean`}
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {activeTip === row.label && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 ml-9 p-3 bg-slate-800 text-white rounded-xl text-[11px] leading-relaxed"
                        >
                          {row.tip}
                          <button
                            type="button"
                            onClick={() => setActiveTip(null)}
                            className="mt-2 px-3 py-1 rounded-lg bg-white/10 text-white/90 text-[10px] font-bold uppercase tracking-wider"
                          >
                            Got it
                          </button>
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Falling below <span className="font-bold text-red-600">{riskThreshold}%</span> is at risk of penalties.
                    Daily scores roll up into weekly, and weekly into monthly. Daily completion only counts 5% — so
                    finishing your reports after the field is perfectly fine.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Days You Didn't Meet Target — dropdown */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <button
              onClick={() => setMissedOpen(!missedOpen)}
              className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
            >
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Target className="w-4 h-4 text-red-600" />
                Days You Didn't Meet Target
                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  {missedCount} of {ledger.length}
                </span>
              </h3>
              {missedOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {missedOpen && (
              <div className="p-5 pt-0 border-t border-slate-100 space-y-2">
                {missedDays.length === 0 && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xs font-bold text-emerald-700">No missed days — great consistency!</p>
                  </div>
                )}
                {missedDays.slice(0, 6).map((d, i) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                      <XCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-black text-slate-900">
                          {d.date}{d.isToday ? ' · Today' : ''}
                        </p>
                        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", d.score >= riskThreshold - 10 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>
                          Score {d.score}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        <span className="font-bold text-slate-700">{d.leads}</span>/{d.target} leads
                        · <span className="font-bold text-slate-700">{d.conversions}</span> conversions
                        · <span className="font-bold text-slate-700">{d.infoPct}%</span> info/{d.gpsPct}% GPS
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
