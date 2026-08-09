'use client';

import React, { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import {
  BarChart3, Activity, TrendingUp, ArrowLeft, Target,
  Building2, Percent, MessageSquare, Clock,
  ChevronDown, ChevronUp, Share2, Download, FileText,
  Star, Gauge, AlertTriangle, CheckCircle2, XCircle, MapPin,
  BookOpenCheck, Users, Shield, Info,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  buildReportText,
  downloadReportAsPdf,
  shareReport as exportShare,
  ReportExportData,
} from '@/lib/report-export';
import { getReportComments } from '@/lib/report-comments';
import ReportComments from '@/components/dashboard/ReportComments';

const mockBusinesses = [
  { name: 'Greenfield Grocers', type: 'Supermarket', status: 'Visited', notes: 'Owner interested in partnership. Will follow up next week.', date: '2026-07-28', rating: 4 },
  { name: 'Blue Ribbon Bakery', type: 'Bakery', status: 'Converted', notes: 'Signed up for premium package. Monthly order of 50 units.', date: '2026-07-27', rating: 5 },
  { name: 'Summit Auto Parts', type: 'Auto Shop', status: 'Follow-up', notes: 'Owner on vacation. Need to call back in 2 weeks.', date: '2026-07-26', rating: 3 },
  { name: 'Harbor View Clinic', type: 'Healthcare', status: 'Visited', notes: 'Nurse manager interested. Sending proposal via email.', date: '2026-07-25', rating: 4 },
  { name: 'Maple Lane Pharmacy', type: 'Pharmacy', status: 'Visited', notes: 'Competitor has exclusive deal. Will revisit in 3 months.', date: '2026-07-24', rating: 2 },
];

const mockComments = [
  { text: 'Spent extra time at Greenfield discussing volume discounts. Need approval from HQ.', date: '2026-07-28' },
  { text: 'Blue Ribbon Bakery converted — they love the new product line.', date: '2026-07-27' },
  { text: 'Traffic was light today. Focused on paperwork and follow-up calls.', date: '2026-07-26' },
  { text: 'Visited 5 businesses in the industrial area. Two showed strong interest.', date: '2026-07-25' },
  { text: 'Raining heavily but still managed 3 visits. Determined to hit target.', date: '2026-07-24' },
];

// Work Metric configuration
const STANDARD_LEAD_TARGET = 20; // submit at least 20 leads daily
const CONVERSION_REFERENCE = 0.4; // 40% conversion reference
const RISK_THRESHOLD = 90; // below this = at risk of penalties

// Weights sum to 100%. The real check is daily lead submission + conversion;
// daily completion stays small (5%) because agents may submit after the field.
const WEIGHTS = { leads: 0.35, conversion: 0.3, businessInfo: 0.2, visits: 0.1, completion: 0.05 };

const METRIC_ROWS = [
  { icon: Users, label: 'Daily Lead Submission', weight: '35%', tip: 'Submit at least 20 new leads every day. This is the single biggest driver of your score — if you submit fewer than 20 leads on a day, this part of your score drops.' },
  { icon: TrendingUp, label: 'Lead Conversion', weight: '30%', tip: 'How well your leads move forward — becoming Interested or Customers. The system references a 40% conversion rate; scoring above that pushes you to 100% here.' },
  { icon: BookOpenCheck, label: 'Business Information', weight: '20%', tip: 'Completing each business profile — category, contact, size, opening hours and, importantly, the accurate GPS location of the business.' },
  { icon: MapPin, label: 'Field Activity / Visits', weight: '10%', tip: 'Actually going out and visiting the businesses you planned. Field visits confirm the business physically exists at the recorded location.' },
  { icon: Clock, label: 'Daily Completion', weight: '5%', tip: 'Finishing and submitting your daily work for the day. Know you may be busy on the field — you can submit when you get home. Daily completion only counts a small 5% towards your score.' },
];

interface DayScore {
  id: string;
  date: string;
  leads: number;
  target: number;
  conversions: number;
  visits: number;
  infoPct: number;
  gpsPct: number;
  completionPct: number;
  isToday: boolean;
  score: number;
  met: boolean;
}

function computeDayScore(d: DayScore): number {
  const leadPct = Math.min(100, (d.leads / Math.max(1, d.target)) * 100);
  const infoPct = 0.6 * d.infoPct + 0.4 * d.gpsPct;
  const convPct = Math.min(100, (d.conversions / Math.max(1, d.leads) / CONVERSION_REFERENCE) * 100);
  const visitPct = Math.min(100, (d.visits / Math.max(1, d.target)) * 100);
  return Math.round(
    WEIGHTS.leads * leadPct +
    WEIGHTS.conversion * convPct +
    WEIGHTS.businessInfo * infoPct +
    WEIGHTS.visits * visitPct +
    WEIGHTS.completion * d.completionPct,
  );
}

export default function WorkMetricReports({ backHref = '/dashboard/market-mapping/insights' }: { backHref?: string }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [openReport, setOpenReport] = useState<'daily' | 'weekly' | 'monthly' | null>('daily');
  const [missedOpen, setMissedOpen] = useState(false);
  const [scoreInfoOpen, setScoreInfoOpen] = useState(false);
  const [activeTip, setActiveTip] = useState<string | null>(null);

  const dailyStats = {
    leads: 14,
    target: STANDARD_LEAD_TARGET,
    conversions: 6,
    visits: 11,
    completionRate: 72,
    businessesReferred: 2,
    earnings: 12500,
    avgLeadsPerDay: 7,
    avgConversionRate: 43,
  };

  const weeklyStats = {
    leads: 86,
    target: 100,
    conversions: 38,
    visits: 88,
    completionRate: 78,
    businessesReferred: 8,
    earnings: 142000,
    avgLeadsPerDay: 5.4,
    avgConversionRate: 42,
  };

  const monthlyStats = {
    leads: 412,
    target: 500,
    conversions: 158,
    visits: 420,
    completionRate: 75,
    businessesReferred: 28,
    earnings: 520000,
    avgLeadsPerDay: 5.2,
    avgConversionRate: 40,
  };

  // ---- Work-score ledger (last 30 days), deterministic mock ----
  const ledger: DayScore[] = useMemo(() => {
    const days: DayScore[] = [];
    const count = 30;
    for (let i = 0; i < count; i++) {
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() - i);
      const seed = (i * 31) % 100;
      let leads = 8 + Math.round(seed * 0.18);
      let conversions = Math.round(leads * (0.14 + (i % 4) * 0.07));
      let visits = Math.round(leads * (0.5 + (i % 3) * 0.22));
      let infoPct = 45 + ((i * 17) % 56);
      let gpsPct = 40 + ((i * 23) % 60);
      let completionPct = 55 + ((i * 11) % 45);

      if (i === 0) {
        leads = dailyStats.leads;
        conversions = dailyStats.conversions;
        visits = dailyStats.visits;
        infoPct = 62;
        gpsPct = 51;
        completionPct = dailyStats.completionRate;
      }

      const base = {
        id: `day-${i}`,
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        leads,
        target: STANDARD_LEAD_TARGET,
        conversions,
        visits,
        infoPct,
        gpsPct,
        completionPct,
        isToday: i === 0,
        score: 0,
        met: false,
      };
      const score = computeDayScore(base);
      days.push({ ...base, score, met: leads >= STANDARD_LEAD_TARGET && score >= RISK_THRESHOLD - 5 });
    }
    return days;
  }, []);

  const { todayScore, weekScore, monthScore, missedDays, missedCount } = useMemo(() => {
    const today = ledger.length > 0 ? ledger[0] : null;
    const week = ledger.slice(0, 7);
    const month = ledger;
    const avg = (arr: DayScore[]) => (arr.length ? Math.round(arr.reduce((s, d) => s + d.score, 0) / arr.length) : 0);
    const missed = ledger.filter(d => d.score < RISK_THRESHOLD);
    return {
      todayScore: today?.score ?? 0,
      weekScore: avg(week),
      monthScore: avg(month),
      missedDays: missed,
      missedCount: missed.length,
    };
  }, [ledger]);

  const getSectionSummary = (key: 'daily' | 'weekly' | 'monthly', s: any, score: number) => {
    const met = score >= RISK_THRESHOLD;
    const gap = Math.max(0, RISK_THRESHOLD - score);
    const suffix = met
      ? 'You are on track. Keep the momentum going!'
      : `You scored ${score}% — ${gap}% below the ${RISK_THRESHOLD}% threshold. This is at risk of penalties. Focus on the Work Metrics below to recover.`;
    if (key === 'daily') {
      return `${s.leads >= s.target ? 'You met your daily lead target.' : `You collected ${s.leads} leads today against a ${s.target}-lead target (${Math.round((s.leads / s.target) * 100)}%).`} You captured ${s.conversions} conversions from ${s.visits} visits at a ${s.completionRate}% completion rate. ${suffix}`;
    }
    if (key === 'weekly') {
      return `You generated ${s.leads} of ${s.target} leads this week (${Math.round((s.leads / s.target) * 100)}%), with ${s.conversions} conversions. Average weekly work score: ${score}%. ${suffix}`;
    }
    return `Across the month you collected ${s.leads} leads against a ${s.target} target (${Math.round((s.leads / s.target) * 100)}%), with ${s.conversions} conversions and ${s.visits} visits. Average monthly work score: ${score}%. ${suffix}`;
  };

  const buildExportData = (key: 'daily' | 'weekly' | 'monthly', s: any, score: number): ReportExportData => {
    const businesses = mockBusinesses.slice(0, key === 'daily' ? 2 : key === 'weekly' ? 4 : 5);
    const role = user?.role || 'AGENT';
    const commentKey = `insights:${key}`;
    const storedComments = getReportComments(commentKey);
    const seedNotes = mockComments.slice(0, key === 'daily' ? 1 : key === 'weekly' ? 3 : 5).map((c) => ({
      author: user?.fullName || 'Agent',
      role,
      text: c.text,
      date: c.date,
    }));
    const comments = storedComments.map((c) => ({ author: c.author, role: c.role, text: c.text, date: c.date }));

    const missedSection = key === 'monthly' && missedDays.length > 0
      ? [{
          title: 'Days You Missed Target',
          lines: missedDays.map(d => `${d.date}: Work score ${d.score}% — ${d.leads}/${d.target} leads, ${d.conversions} conversions`),
        }]
      : [];

    return {
      reportTitle: key === 'daily' ? 'Daily Report — Today' : key === 'weekly' ? 'Weekly Report — This Week' : 'Monthly Report — This Month',
      author: user?.fullName || 'Agent',
      role,
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
            `Risk threshold: ${RISK_THRESHOLD}%`,
            score >= RISK_THRESHOLD ? 'Status: ON TRACK' : `Status: AT RISK OF PENALTIES (${RISK_THRESHOLD - score}% below threshold)`,
            `Lead Submission (35%): ${s.leads}/${s.target}`,
            `Lead Conversion (30%): ${Math.round((s.conversions / Math.max(1, s.leads)) * 100)}% (ref ${Math.round(CONVERSION_REFERENCE * 100)}%)`,
            `Business Info + GPS (20%): tracked daily as profiles are completed`,
            `Field Visits (10%) + Daily Completion (5%)`,
          ],
        },
        ...missedSection,
        {
          title: 'Conversion Breakdown',
          lines: [
            `Total Conversions: ${s.conversions}`,
            `Conversion Rate: ${Math.round((s.conversions / s.leads) * 100)}%`,
            `Businesses Referred: ${s.businessesReferred}`,
            `Earnings: ₦${s.earnings.toLocaleString()}`,
          ],
        },
      ],
      businesses: businesses.map((b) => ({
        name: b.name,
        type: b.type,
        status: b.status,
        notes: b.notes,
        rating: b.rating,
      })),
      notes: seedNotes,
      comments,
    };
  };

  const scopeOfKey = (key: 'daily' | 'weekly' | 'monthly') => ({
    stats: key === 'daily' ? dailyStats : key === 'weekly' ? weeklyStats : monthlyStats,
    score: key === 'daily' ? todayScore : key === 'weekly' ? weekScore : monthScore,
  });

  const shareReport = async (key: 'daily' | 'weekly' | 'monthly') => {
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

  const downloadReport = (key: 'daily' | 'weekly' | 'monthly') => {
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
            My Performance Reports
          </h1>
          <p className="text-xs text-slate-500 font-medium">{user?.fullName || 'Agent'} · Work metrics, targets &amp; daily scoring</p>
        </div>
      </div>

      {/* Accordion Reports (single open, Daily open by default) */}
      <div className="space-y-4">
        {sections.map(section => {
          const { stats: s, score } = scopeOfKey(section.key);
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
                  <span className={cn("text-xs font-black px-2 py-0.5 rounded-full", score >= RISK_THRESHOLD ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
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
                            style={{ background: `conic-gradient(${score >= RISK_THRESHOLD ? 'rgb(52 211 153)' : 'rgb(248 113 113)'} ${score * 3.6}deg, rgba(255,255,255,0.15) 0deg)` }}
                          >
                            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center flex-col">
                              <span className="text-2xl font-black leading-none">{score}%</span>
                              <span className="text-[8px] font-bold text-white/60 uppercase tracking-widest mt-0.5">Score</span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border", score >= RISK_THRESHOLD ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" : "bg-red-500/20 text-red-300 border-red-400/30")}>
                              {score >= RISK_THRESHOLD ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                              {score >= RISK_THRESHOLD ? 'On Track' : 'At Risk of Penalties'}
                            </span>
                            {score < RISK_THRESHOLD && (
                              <p className="text-xs text-red-200/90 font-medium max-w-[220px]">
                                You are <span className="font-black">{RISK_THRESHOLD - score}%</span> below the {RISK_THRESHOLD}% threshold. Improve today's work to recover.
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {miniScores.map(m => (
                            <div key={m.label} className="bg-white/10 rounded-xl p-2.5 text-center border border-white/10">
                              <p className={cn("text-lg font-black leading-none", m.value >= RISK_THRESHOLD ? "text-emerald-300" : "text-red-300")}>{m.value}%</p>
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
                      <span className={cn("ml-auto text-[10px] font-black px-2 py-0.5 rounded-full", score >= RISK_THRESHOLD ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                        {score >= RISK_THRESHOLD ? 'On Track' : 'At Risk'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Lead Submission ({WEIGHTS.leads * 100}%)</span><span className="font-bold text-slate-900">{Math.min(100, Math.round((s.leads / s.target) * 100))}%</span></div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, Math.round((s.leads / s.target) * 100))}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Conversion ({WEIGHTS.conversion * 100}%)</span><span className="font-bold text-slate-900">{Math.round((s.conversions / Math.max(1, s.leads)) * 100)}%</span></div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.round((s.conversions / Math.max(1, s.leads)) * 100))}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Business Info + GPS ({WEIGHTS.businessInfo * 100}%)</span><span className="font-bold text-slate-900">{s.businessesReferred > 0 ? '85%' : '—'}</span></div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${s.businessesReferred > 0 ? 85 : 0}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Field Visits ({WEIGHTS.visits * 100}%)</span><span className="font-bold text-slate-900">{Math.min(100, Math.round((s.visits / s.target) * 100))}%</span></div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, Math.round((s.visits / s.target) * 100))}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Daily Completion ({WEIGHTS.completion * 100}%)</span><span className="font-bold text-slate-900">{s.completionRate}%</span></div>
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
                    <div className="space-y-2">
                      {mockBusinesses.slice(0, section.key === 'daily' ? 2 : section.key === 'weekly' ? 4 : 5).map((b, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50">
                          <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", b.status === 'Converted' ? 'bg-emerald-500' : b.status === 'Visited' ? 'bg-blue-500' : 'bg-amber-500')} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{b.name}</span>
                              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold", b.status === 'Converted' ? 'bg-emerald-100 text-emerald-700' : b.status === 'Visited' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700')}>{b.status}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">{b.type} · {b.notes}</p>
                          </div>
                          <div className="flex items-center gap-0.5 shrink-0">
                            {Array.from({ length: 5 }).map((_, si) => (
                              <Star key={si} className={cn("w-2.5 h-2.5", si < b.rating ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
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
                        <p className="text-lg font-black text-blue-600">{Math.round((s.conversions / s.leads) * 100)}%</p>
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

                  {/* Comments */}
                  <ReportComments
                    reportKey={`insights:${section.key}`}
                    currentUser={user ? { name: user.fullName, role: user?.role || 'AGENT' } : null}
                    className="mt-4"
                  />
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
                    <span className="ml-auto shrink-0 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] font-black">{row.weight}</span>
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
                Falling below <span className="font-bold text-red-600">{RISK_THRESHOLD}%</span> is at risk of penalties.
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
                    <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full", d.score >= RISK_THRESHOLD - 10 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>
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
    </div>
  );
}