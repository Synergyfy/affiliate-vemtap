'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  ArrowLeft, BarChart3, TrendingUp, Users, UserCheck, Network,
  DollarSign, Calendar, Phone, Mail, MapPin, Building2, Award, Target, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  agent: { label: 'Agent', color: 'bg-violet-100 text-violet-700' },
  affiliate: { label: 'Affiliate', color: 'bg-blue-100 text-blue-700' },
  'line-manager': { label: 'Line Manager', color: 'bg-emerald-100 text-emerald-700' },
  team: { label: 'Team', color: 'bg-amber-100 text-amber-700' },
  location: { label: 'Location', color: 'bg-indigo-100 text-indigo-700' },
};

function formatCurrency(val: number) {
  return `₦${val.toLocaleString()}`;
}

function hashNum(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 997;
  return h;
}

function ReportInner() {
  const params = useSearchParams();
  const name = params.get('name') || 'Unknown';
  const type = params.get('type') || 'agent';
  const period = params.get('period') || 'monthly';
  const leads = Number(params.get('leads')) || 0;
  const conversions = Number(params.get('conversions')) || 0;
  const earnings = Number(params.get('earnings')) || 0;

  const rate = leads > 0 ? Math.round((conversions / leads) * 100) : 0;
  const typeMeta = TYPE_LABELS[type] || TYPE_LABELS.agent;
  const periodLabel = period === 'daily' ? 'this day' : period === 'weekly' ? 'this week' : 'this month';

  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const factor = 0.5 + ((hashNum(`${name}-${i}`) % 50) / 100);
    return Math.round(leads * factor * (1 + i * 0.1));
  });

  const recentActivities = [
    { title: 'Closed a new customer', desc: `Converted a prospect in the ${name} portfolio`, amount: formatCurrency(Math.round(earnings * 0.3)), date: '2 days ago', type: 'conversion' },
    { title: 'Follow-up completed', desc: `Called lead on ${name}'s active pipeline`, amount: null, date: '4 days ago', type: 'followup' },
    { title: 'Business won', desc: `Signed subscription for ${name}`, amount: formatCurrency(Math.round(earnings * 0.2)), date: '1 week ago', type: 'won' },
    { title: 'New lead captured', desc: `Added a prospect linked to ${name}`, amount: null, date: '1 week ago', type: 'lead' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Back */}
        <div className="flex items-center gap-3">
          <Link href="/admin/operations" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-black text-slate-900">Full Performance Report</h2>
            <p className="text-xs text-slate-500">Detailed report for {name} · {periodLabel}</p>
          </div>
        </div>

        {/* Header card */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-6 sm:px-10 py-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-2xl font-black">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black">{name}</h1>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg", typeMeta.color)}>{typeMeta.label}</span>
                </div>
                <p className="text-sm text-blue-100 mt-1">Performance overview for {periodLabel}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Conversion Rate</p>
                <p className="text-3xl font-black">{rate}%</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            {/* English summary */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-black text-blue-700 uppercase tracking-widest">English Summary</p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">
                In {periodLabel}, <b>{name}</b> generated <b>{leads.toLocaleString()}</b> leads and converted{' '}
                <b>{conversions.toLocaleString()}</b> of them, hitting a <b>{rate}%</b> conversion rate and earning{' '}
                <b>{formatCurrency(earnings)}</b>. This places {name} at a solid operational level{' '}
                {rate >= 35 ? '— above the company conversion target.' : '— slightly below the 35% company target. Focus on the leads with the lowest engagement first.'}
              </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Leads</p>
                <p className="text-xl font-black text-slate-900">{leads.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Conversions</p>
                <p className="text-xl font-black text-slate-900">{conversions.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                  <Target className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Conversion Rate</p>
                <p className="text-xl font-black text-slate-900">{rate}%</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3">
                  <DollarSign className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Earnings</p>
                <p className="text-xl font-black text-slate-900">{formatCurrency(earnings)}</p>
              </div>
            </div>

            {/* Monthly trend */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" /> Lead Generation Trend (last 6 periods)
              </h3>
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <div className="flex items-end justify-between gap-2 h-40">
                  {monthlyTrend.map((val, i) => {
                    const max = Math.max(...monthlyTrend, 1);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-[9px] font-black text-slate-500">{val.toLocaleString()}</span>
                        <div
                          className={cn("w-full rounded-t-lg transition-all", i === monthlyTrend.length - 1 ? "bg-gradient-to-t from-blue-600 to-blue-400" : "bg-slate-200")}
                          style={{ height: `${(val / max) * 100}%` }}
                        />
                        <span className="text-[9px] font-bold text-slate-400">{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent activity */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Recent Activity
              </h3>
              <div className="space-y-3">
                {recentActivities.map((act, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                      {act.type === 'conversion' ? <Award className="w-5 h-5 text-emerald-600" /> :
                       act.type === 'won' ? <TrendingUp className="w-5 h-5 text-blue-600" /> :
                       act.type === 'lead' ? <Target className="w-5 h-5 text-amber-600" /> :
                       <Calendar className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{act.title}</p>
                      <p className="text-xs text-slate-500">{act.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {act.amount && <p className="text-xs font-black text-emerald-600">{act.amount}</p>}
                      <p className="text-[10px] text-slate-400">{act.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact / role placeholder */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Users className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role</p>
                  <p className="text-sm font-bold text-slate-900">{typeMeta.label}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Region</p>
                  <p className="text-sm font-bold text-slate-900">{name}'s territory</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report Period</p>
                  <p className="text-sm font-bold text-slate-900 capitalize">{period}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function FullReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-sm font-bold text-slate-400">Loading...</p></div>}>
      <ReportInner />
    </Suspense>
  );
}
