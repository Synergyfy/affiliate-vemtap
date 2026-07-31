'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import {
  BarChart3, Activity, TrendingUp, ArrowLeft, Target,
  Building2, MessageSquare, Percent, CheckCircle2, Clock,
  ChevronDown, ChevronUp, Share2, Download, FileText, Award,
  Users, DollarSign, Star
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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

export default function MyReportsPage() {
  const { user } = useAuth();
  const [openReport, setOpenReport] = useState<'daily' | 'weekly' | 'monthly' | null>('daily');

  const bgGradient = 'from-blue-600 to-indigo-700';

  const dailyStats = {
    leads: 7,
    target: 8,
    conversions: 3,
    visits: 11,
    completionRate: 72,
    businessesReferred: 2,
    earnings: 12500,
    avgLeadsPerDay: 7,
    avgConversionRate: 43,
  };

  const weeklyStats = {
    leads: 38,
    target: 40,
    conversions: 16,
    visits: 52,
    completionRate: 78,
    businessesReferred: 8,
    earnings: 142000,
    avgLeadsPerDay: 5.4,
    avgConversionRate: 42,
  };

  const monthlyStats = {
    leads: 145,
    target: 160,
    conversions: 58,
    visits: 210,
    completionRate: 75,
    businessesReferred: 28,
    earnings: 520000,
    avgLeadsPerDay: 5.2,
    avgConversionRate: 40,
  };

  const getGrade = (rate: number) => {
    if (rate >= 85) return { label: 'A', color: 'text-emerald-600', bg: 'bg-emerald-100' };
    if (rate >= 70) return { label: 'B', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (rate >= 55) return { label: 'C', color: 'text-amber-600', bg: 'bg-amber-100' };
    return { label: 'D', color: 'text-red-500', bg: 'bg-red-100' };
  };

  const shareReport = async (period: string) => {
    const text = `My ${period} report: ${dailyStats.leads} leads, ${dailyStats.conversions} conversions, ${dailyStats.completionRate}% completion rate.`;
    if (navigator.share) {
      await navigator.share({ title: `${period} Report`, text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const downloadReport = (period: string) => {
    const text = `${period.toUpperCase()} REPORT\n\nLeads: ${dailyStats.leads} (Target: ${dailyStats.target})\nConversions: ${dailyStats.conversions}\nVisits: ${dailyStats.visits}\nCompletion Rate: ${dailyStats.completionRate}%\nEarnings: ₦${dailyStats.earnings.toLocaleString()}\n\nNotes: ${mockComments[0]?.text || ''}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${period}-report.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const sections = [
    { key: 'daily' as const, icon: BarChart3, color: 'blue', title: `Daily Report — Today`, stats: dailyStats },
    { key: 'weekly' as const, icon: Activity, color: 'indigo', title: 'Weekly Report — This Week', stats: weeklyStats },
    { key: 'monthly' as const, icon: TrendingUp, color: 'emerald', title: 'Monthly Report — This Month', stats: monthlyStats },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/market-mapping/insights"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              My Performance Reports
            </h1>
            <p className="text-xs text-slate-500 font-medium">{user?.fullName || 'Agent'} · Daily, Weekly & Monthly breakdown</p>
          </div>
        </div>

        {/* Overall Summary Cards */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg">
          <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider mb-4">Performance Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-2xl font-black">{monthlyStats.leads}</p>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Total Leads</p>
            </div>
            <div>
              <p className="text-2xl font-black">{monthlyStats.conversions}</p>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Conversions</p>
            </div>
            <div>
              <p className="text-2xl font-black">{monthlyStats.completionRate}%</p>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Rate</p>
            </div>
            <div>
              <p className="text-2xl font-black">₦{monthlyStats.earnings.toLocaleString()}</p>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Earnings</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/80 bg-white/10 rounded-xl px-4 py-3">
            <Target className="w-4 h-4 shrink-0" />
            <span>
              Target: {monthlyStats.target} leads/mo · Avg {monthlyStats.avgLeadsPerDay}/day · Conv rate {monthlyStats.avgConversionRate}%
              {monthlyStats.leads >= monthlyStats.target
                ? ' · Monthly target achieved!'
                : ` · ${Math.round((monthlyStats.leads / monthlyStats.target) * 100)}% toward goal`}
            </span>
            <span className={cn("ml-auto shrink-0 text-xs font-bold px-2 py-0.5 rounded-full", getGrade(monthlyStats.completionRate).bg, getGrade(monthlyStats.completionRate).color.replace('text-', 'text-'))}>
              Grade: {getGrade(monthlyStats.completionRate).label}
            </span>
          </div>
        </div>

        {/* Accordion Reports */}
        <div className="space-y-4">
          {sections.map(section => {
            const s = section.stats;
            const isOpen = openReport === section.key;
            return (
              <div key={section.key} className="bg-white rounded-2xl border border-slate-200 relative">
                <button
                  onClick={() => setOpenReport(isOpen ? null : section.key)}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                >
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <section.icon className={`w-4 h-4 text-${section.color}-600`} />
                    {section.title}
                  </h3>
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">{s.leads} leads</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 border-t border-slate-100 space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
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
                        <p className="text-lg font-black text-amber-600">{s.completionRate}%</p>
                        <p className="text-[10px] font-bold text-slate-500">Rate</p>
                      </div>
                    </div>

                    {/* Summary explanation */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-700 leading-relaxed">
                        <span className="font-bold">Summary:</span>{' '}
                        {section.key === 'daily' && (
                          s.leads >= s.target * 0.8
                            ? `Strong day with ${s.leads} leads collected, reaching ${Math.round((s.leads / s.target) * 100)}% of your ${s.target}-lead target. You closed ${s.conversions} conversions from ${s.visits} visits at a ${s.completionRate}% completion rate. ${s.completionRate >= 80 ? 'Excellent consistency — keep up the great work!' : s.completionRate >= 60 ? 'Good effort — focus on converting more visits into leads.' : 'Room for improvement — try adjusting your approach during visits.'}`
                            : `You collected ${s.leads} leads today (target: ${s.target}). With ${s.conversions} conversions from ${s.visits} visits, your completion rate is ${s.completionRate}%. ${s.leads < s.target * 0.5 ? 'Let\'s push harder tomorrow — try visiting high-traffic areas.' : 'Keep pushing — a strong finish can still turn the week around.'}`
                        )}
                        {section.key === 'weekly' && (
                          s.leads >= s.target * 0.9
                            ? `Excellent week! You generated ${s.leads} leads (${Math.round((s.leads / s.target) * 100)}% of target) with ${s.conversions} conversions and ${s.visits} visits. Your ${s.completionRate}% rate ${s.completionRate >= 80 ? 'shows you\'re in top form.' : 'indicates steady effort across the week.'}`
                            : s.leads >= s.target * 0.7
                            ? `Solid week with ${s.leads} leads (${Math.round((s.leads / s.target) * 100)}% of target). You had ${s.conversions} conversions from ${s.visits} visits at ${s.completionRate}% rate. ${s.completionRate >= 70 ? 'Consistent performance — aim higher next week!' : 'Focus on quality over quantity to improve conversion.'}`
                            : `Challenging week with ${s.leads} leads (${Math.round((s.leads / s.target) * 100)}% of target). ${s.conversions} conversions and ${s.visits} visits. ${s.leads < s.target * 0.5 ? 'Let\'s plan next week\'s route more strategically.' : 'Mid-week was better — replicate what worked.'}`
                        )}
                        {section.key === 'monthly' && (
                          `Over the month, you've collected ${s.leads} leads against a ${s.target} target (${Math.round((s.leads / s.target) * 100)}% achievement), with ${s.conversions} conversions and ${s.visits} visits. Your average daily leads: ${s.avgLeadsPerDay}, conversion rate: ${s.avgConversionRate}%. ${s.leads >= s.target ? 'Congratulations on hitting your monthly target!' : 'Next month, focus on increasing daily visit volume to close the gap.'}`
                        )}
                      </p>
                    </div>

                    {/* Breakdown Details */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Target className="w-3.5 h-3.5" /> Detailed Breakdown
                      </h4>

                      {/* Target Progress */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-bold text-slate-900">Target Progress</span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Leads Target</span><span className="font-bold text-slate-900">{s.leads}/{s.target}</span></div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all bg-${section.color}-500`} style={{ width: `${Math.min(100, (s.leads / s.target) * 100)}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Conversion Rate</span><span className="font-bold text-slate-900">{Math.round((s.conversions / s.leads) * 100)}%</span></div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, (s.conversions / s.leads) * 100)}%` }} />
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

                      {/* Comments / Notes */}
                      <div className="p-4 rounded-xl bg-white border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-orange-600" />
                          <span className="text-xs font-bold text-slate-900">Notes & Comments</span>
                        </div>
                        <div className="space-y-2">
                          {mockComments.slice(0, section.key === 'daily' ? 1 : section.key === 'weekly' ? 3 : 5).map((c, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50">
                              <Clock className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs text-slate-700">{c.text}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{new Date(c.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
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
                    </div>

                    {/* Share / Download Buttons */}
                    <div className="flex items-center gap-2 justify-end pt-2 border-t border-slate-100">
                      <button onClick={() => shareReport(section.key)} className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-${section.color}-50 hover:bg-${section.color}-100 text-${section.color}-600 font-bold text-xs transition-colors`}><Share2 className="w-3.5 h-3.5" /> Share</button>
                      <button onClick={() => downloadReport(section.key)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold text-xs transition-colors"><Download className="w-3.5 h-3.5" /> Download</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
