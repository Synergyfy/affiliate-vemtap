'use client';

import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useMarketMapping } from '@/components/dashboard/market-mapping/MarketMappingContext';
import {
  MapPin, Calendar, Navigation, BarChart3, Sparkles,
  ArrowRight, Target, Users, Pencil, Check, ChevronDown,
  FileText, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { useMarketMappingConfig } from '@/hooks/use-market-mapping-config';

export default function MarketMappingHubPage() {
  const { stats, missionPlans, performance, visits, setPerformance } = useMarketMapping();
  const { data: config } = useMarketMappingConfig();
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });

  const dayPlan = missionPlans.find(p => p.horizon === 'DAY');
  const weekPlan = missionPlans.find(p => p.horizon === 'WEEK');
  const activePlan = dayPlan || weekPlan;

  const dayTarget = dayPlan?.targetCount || performance.dailyTarget || config?.dailyTarget || 20;
  const weekTarget = weekPlan?.targetCount || performance.weeklyTarget || config?.weeklyTarget || 100;
  const dayProgress = performance.dailyProgress;
  const weekProgress = performance.weeklyProgress;
  const dayRemaining = Math.max(0, dayTarget - dayProgress);
  const weekRemaining = Math.max(0, weekTarget - weekProgress);

  const dayPercent = Math.min(100, Math.round((dayProgress / dayTarget) * 100));
  const weekPercent = Math.min(100, Math.round((weekProgress / weekTarget) * 100));

  const monthlySubTarget = Math.max(20, performance.monthlyTarget || config?.monthlyTarget || 20);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(String(monthlySubTarget));

  const [showTargets, setShowTargets] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const saveMonthlyTarget = () => {
    const val = Math.max(20, parseInt(targetInput, 10) || 20);
    setPerformance(prev => ({ ...prev, monthlyTarget: val }));
    setTargetInput(String(val));
    setEditingTarget(false);
  };

  const bizStats = useMemo(() => {
    const total = visits.length;
    const customers = visits.filter(v => v.status === 'CUSTOMER').length;
    const notVisited = visits.filter(v => v.status === 'NOT_YET').length;
    const inProgress = visits.filter(v => v.status === 'CONTACTED' || v.status === 'INTERESTED').length;
    const notInterested = visits.filter(v => v.status === 'NOT_INTERESTED').length;
    return { total, customers, notVisited, inProgress, notInterested };
  }, [visits]);

  const subPercent = monthlySubTarget > 0 ? Math.min(100, Math.round((bizStats.customers / monthlySubTarget) * 100)) : 0;

  const actionButtons = [
    {
      href: '/dashboard/market-mapping/plan',
      icon: Calendar,
      title: 'Plan Mission',
      description: 'Set targets and locations for your daily or weekly goals.',
      color: 'bg-blue-600',
      badge: null,
    },
    {
      href: '/dashboard/market-mapping/execute',
      icon: Navigation,
      title: 'Execute Visits',
      description: 'View your territory, add businesses, start visits and capture data.',
      color: 'bg-emerald-600',
      badge: dayRemaining > 0 ? `${dayRemaining} remaining today` : null,
    },
    {
      href: '/dashboard/market-mapping/pipeline',
      icon: BarChart3,
      title: 'Pipeline',
      description: 'All businesses you captured — track status, progress and subscriptions.',
      color: 'bg-indigo-600',
      badge: null,
    },
    {
      href: '/dashboard/market-mapping/insights',
      icon: Sparkles,
      title: 'Market Insights',
      description: 'AI recommendations, cluster maturity and market goals.',
      color: 'bg-purple-600',
      badge: null,
    },
    {
      href: '/dashboard/market-mapping/insights/reports',
      icon: FileText,
      title: 'My Reports',
      description: 'Daily, weekly & monthly performance breakdown with targets, business visits and conversion insights.',
      color: 'bg-rose-600',
      badge: null,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900">Market Mapping</h1>
            <p className="text-sm text-slate-500 font-medium">{currentDate}</p>
          </div>
        </div>

        {/* Active Mission — compact */}
        <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-600 rounded-full blur-3xl opacity-30" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Active Mission</span>
            </div>
            {activePlan ? (
              <>
                {activePlan.location && (
                  <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3" /> {activePlan.location}
                  </p>
                )}
                <p className="text-lg font-black leading-snug">
                  {dayTarget > 0 && weekTarget > 0
                    ? `Daily: ${dayProgress}/${dayTarget} · Weekly: ${weekProgress}/${weekTarget}`
                    : dayTarget > 0
                      ? `Today: ${dayProgress} / ${dayTarget} businesses`
                      : weekTarget > 0
                        ? `This week: ${weekProgress} / ${weekTarget} businesses`
                        : 'No targets set yet'}
                </p>
              </>
            ) : (
              <p className="text-lg font-black leading-snug">{stats.missionGoal}</p>
            )}
          </div>
        </div>

        {/* Targets — collapsible, closed by default */}
        <div className="space-y-3">
          <button onClick={() => setShowTargets(!showTargets)} className="flex items-center justify-between w-full group">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Targets</h2>
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showTargets && "rotate-180")} />
          </button>

          {showTargets && (
            <div className="space-y-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Target className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">Daily Target</p>
                      <p className="text-[10px] font-semibold text-slate-400">Today&apos;s goal</p>
                    </div>
                  </div>
                  <p className="text-xl font-black text-slate-900">{dayProgress}<span className="text-sm text-slate-400 font-bold">/{dayTarget}</span></p>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${dayPercent}%` }} />
                </div>
                <p className="text-[10px] font-semibold text-slate-400 mt-1.5 text-right">{dayPercent}% completed</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">Weekly Target</p>
                      <p className="text-[10px] font-semibold text-slate-400">This week&apos;s goal</p>
                    </div>
                  </div>
                  <p className="text-xl font-black text-slate-900">{weekProgress}<span className="text-sm text-slate-400 font-bold">/{weekTarget}</span></p>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${weekPercent}%` }} />
                </div>
                <p className="text-[10px] font-semibold text-slate-400 mt-1.5 text-right">{weekPercent}% completed</p>
              </div>
            </div>
          )}
        </div>

        {/* Business Status — collapsible, closed by default */}
        <div className="space-y-3">
          <button onClick={() => setShowStatus(!showStatus)} className="flex items-center justify-between w-full group">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Business Status</h2>
            <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showStatus && "rotate-180")} />
          </button>

          {showStatus && (
            <div className="space-y-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">Subscribed ({currentMonth})</p>
                      <p className="text-[10px] font-semibold text-slate-400">Monthly subscription goal</p>
                    </div>
                  </div>

                  {editingTarget ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={20}
                        value={targetInput}
                        onChange={e => setTargetInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveMonthlyTarget()}
                        className="w-16 text-right text-xl font-black text-slate-900 border border-slate-300 rounded-lg px-2 py-0.5 focus:outline-none focus:border-purple-500"
                        autoFocus
                      />
                      <button onClick={saveMonthlyTarget} className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingTarget(true); setTargetInput(String(monthlySubTarget)); }}
                      className="flex items-center gap-1 group"
                    >
                      <p className="text-2xl font-black text-slate-900">{bizStats.customers}</p>
                      <span className="text-sm text-slate-400 font-bold">/{monthlySubTarget}</span>
                      <Pencil className="w-3 h-3 text-slate-300 group-hover:text-purple-500 transition-colors" />
                    </button>
                  )}
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${subPercent}%` }}
                  />
                </div>
                <p className="text-[10px] font-semibold text-slate-400 mt-1.5 text-right">{subPercent}% of {monthlySubTarget} target</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center">
                  <p className="text-lg font-black text-amber-600">{bizStats.notVisited}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Not Visited</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center">
                  <p className="text-lg font-black text-blue-600">{bizStats.inProgress}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">In Progress</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center">
                  <p className="text-lg font-black text-red-500">{bizStats.notInterested}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Declined</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons — after targets & status */}
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">What do you want to do?</h2>

          {actionButtons.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="block bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-lg hover:border-slate-300 transition-all group active:scale-[0.98]"
            >
              <div className="flex items-start gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white transition-transform group-hover:scale-110", action.color)}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-black text-slate-900">{action.title}</h3>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{action.description}</p>
                  {action.badge && (
                    <span className="inline-block mt-2 px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md border border-amber-100">
                      {action.badge}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
