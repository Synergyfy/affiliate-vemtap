'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator, ArrowLeft, Info, BookOpen, Percent, RefreshCw, Target,
  Gem, Crown, Rocket, TrendingUp, Users, CalendarRange
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

const SUBSCRIPTION_PLANS = [
  { id: 'silver', name: 'Silver', price: 8000, icon: Gem, color: 'from-slate-400 to-slate-500', bg: 'bg-slate-50', text: 'text-slate-600', ring: 'border-slate-300' },
  { id: 'gold', name: 'Gold', price: 15000, icon: Crown, color: 'from-amber-400 to-yellow-600', bg: 'bg-amber-50', text: 'text-amber-600', ring: 'border-amber-300' },
  { id: 'platinum', name: 'Platinum', price: 27000, icon: Rocket, color: 'from-indigo-400 to-purple-600', bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'border-indigo-300' },
] as const;

type PlanId = (typeof SUBSCRIPTION_PLANS)[number]['id'];
type Counts = Record<PlanId, number>;

const defaultDistribution = (target: number): Counts => {
  const exact = [target * 0.5, target * 0.3, target * 0.2];
  const counts = exact.map(Math.floor);
  let remainder = target - counts[0] - counts[1] - counts[2];
  const fracs = exact.map((e, i) => ({ i, f: e - counts[i] }));
  fracs.sort((a, b) => b.f - a.f);
  for (let k = 0; k < remainder; k++) counts[fracs[k].i] += 1;
  return { silver: counts[0], gold: counts[1], platinum: counts[2] };
};

function EarningsCalculatorInner() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { data: settings } = useQuery<Record<string, any>>({
    queryKey: ['settings'],
    queryFn: async () => {
      return api.get('/settings');
    },
    staleTime: 5 * 60 * 1000,
  });

  const [tab, setTab] = useState<'calculator' | 'guide'>('calculator');
  const [target, setTarget] = useState<number>(20);
  const [planCounts, setPlanCounts] = useState<Counts>(() => defaultDistribution(20));
  const [customized, setCustomized] = useState(false);

  useEffect(() => {
    if (searchParams.get('tab') === 'guide') setTab('guide');
  }, [searchParams]);

  const isLineManager = user?.role === 'SUPERVISOR' || user?.role === 'MANAGER' || !!user?.isManagerMode;
  const isAgent = user?.role === 'AGENT';

  const directRate = Math.round((settings?.directCommissionRate ?? 0.2) * 100);
  const indirectRate = Math.round((settings?.indirectCommissionRate ?? 0.05) * 100);
  const recurringAgentRate = settings?.recurringAgentCommission ?? 5;
  const recurringAffiliateRate = settings?.recurringAffiliateCommission ?? 10;
  const recurringLMRate = settings?.recurringLineManagerCommission ?? 3;
  const recurringDuration = settings?.recurringDurationMonths ?? 12;
  const defaultDailyTarget = settings?.dailyTarget || 20;
  const activeRecurringRate = isAgent ? recurringAgentRate : recurringAffiliateRate;

  useEffect(() => {
    if (settings?.dailyTarget && target === 20 && !customized) {
      setTarget(defaultDailyTarget);
      setPlanCounts(defaultDistribution(defaultDailyTarget));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.dailyTarget]);

  const handleTargetChange = (newTarget: number) => {
    setTarget(newTarget);
    setPlanCounts(defaultDistribution(newTarget));
  };

  const adjustPlan = (id: PlanId, delta: number) => {
    setPlanCounts(prev => {
      const order: PlanId[] = ['silver', 'gold', 'platinum'];
      const others = order.filter(p => p !== id);
      const next: Counts = { ...prev };
      const newVal = Math.max(0, Math.min(target, prev[id] + delta));
      const applied = newVal - prev[id];
      next[id] = newVal;
      let remaining = -applied;
      let guard = 0;
      while (remaining !== 0 && guard++ < 500) {
        if (remaining < 0) {
          const avail = others.filter(p => next[p] > 0).sort((a, b) => next[b] - next[a]);
          if (avail.length === 0) break;
          const take = Math.min(-remaining, next[avail[0]]);
          next[avail[0]] -= take;
          remaining += take;
        } else {
          const avail = others.filter(p => next[p] < target).sort((a, b) => next[a] - next[b]);
          if (avail.length === 0) break;
          const add = Math.min(remaining, target - next[avail[0]]);
          next[avail[0]] += add;
          remaining -= add;
        }
      }
      return next;
    });
    setCustomized(true);
  };

  const subscriptionMonthly = useMemo(() => {
    return SUBSCRIPTION_PLANS.reduce((sum, plan) => sum + planCounts[plan.id] * plan.price, 0);
  }, [planCounts]);

  const perPlan = useMemo(() => {
    return SUBSCRIPTION_PLANS.map(plan => {
      const subValue = planCounts[plan.id] * plan.price;
      return {
        ...plan,
        count: planCounts[plan.id],
        subValue,
        directMonthly: subValue * (directRate / 100),
        recurringMonthly: subValue * (activeRecurringRate / 100),
      };
    });
  }, [planCounts, directRate, activeRecurringRate]);

  const directMonthly = subscriptionMonthly * (directRate / 100);
  const recurringMonthly = subscriptionMonthly * (activeRecurringRate / 100);
  const indirectMonthly = subscriptionMonthly * (indirectRate / 100);
  const recurringIndirectMonthly = subscriptionMonthly * (recurringLMRate / 100);
  const recurringMonths = Math.max(0, recurringDuration - 1);

  const projection = useMemo(() => {
    const months: { month: number; direct: number; recurring: number; indirect: number; total: number; cumulative: number }[] = [];
    let cumulative = 0;
    for (let m = 1; m <= 12; m++) {
      const carried = Math.max(0, Math.min(m - 1, recurringMonths));
      const direct = directMonthly;
      const recurring = recurringMonthly * carried;
      const indirect = isLineManager ? indirectMonthly + recurringIndirectMonthly * carried : 0;
      const total = direct + recurring + indirect;
      cumulative += total;
      months.push({ month: m, direct, recurring, indirect, total, cumulative });
    }
    return months;
  }, [directMonthly, recurringMonthly, indirectMonthly, recurringIndirectMonthly, recurringMonths, isLineManager]);

  const month1Total = projection[0]?.total ?? 0;
  const month2Total = projection[1]?.total ?? 0;
  const yearPotential = projection[11]?.cumulative ?? 0;

  const resetCalculator = () => {
    setCustomized(false);
    setTarget(defaultDailyTarget);
    setPlanCounts(defaultDistribution(defaultDailyTarget));
  };

  const fmt = (n: number) => `₦${Math.round(n).toLocaleString()}`;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Earnings Calculator</h1>
            <p className="text-xs text-slate-500">Estimate your commission potential month by month</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setTab('calculator')}
            className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", tab === 'calculator' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
          >
            <Calculator className="w-4 h-4" /> Calculator
          </button>
          <button
            onClick={() => setTab('guide')}
            className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", tab === 'guide' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
          >
            <BookOpen className="w-4 h-4" /> How It Works
          </button>
        </div>

        {tab === 'calculator' ? (
          <div className="space-y-6">
            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0" />
              <p className="text-xs text-blue-800 leading-relaxed">
                <span className="font-bold">How it works:</span> A conversion is a business that subscribes to a paid plan. Your monthly conversion target is {target}. Change the target to auto-split it across Silver, Gold and Platinum, then fine-tune each plan — the total always stays equal to your target.
              </p>
            </div>

            {/* Target slider */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-blue-600" /> Monthly Conversion Target
                </label>
                <span className="text-2xl font-black text-blue-600">{target}</span>
              </div>
              <input
                type="range"
                min={5}
                max={200}
                value={target}
                onChange={(e) => handleTargetChange(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>5</span><span>50</span><span>100</span><span>150</span><span>200</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold pt-1 border-t border-slate-100">
                <span>Split total: <b className="text-emerald-600">{planCounts.silver + planCounts.gold + planCounts.platinum}</b> (must equal {target})</span>
              </div>
            </div>

            {/* Per-plan cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {perPlan.map((plan) => (
                <div key={plan.id} className={cn("bg-white rounded-3xl border-2 shadow-sm p-5 space-y-4", plan.ring)}>
                  <div className="flex items-center justify-between">
                    <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", plan.color)}>
                      <plan.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-black text-slate-900">₦{plan.price.toLocaleString()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{plan.name}</p>
                    <p className="text-[10px] text-slate-400">per month / customer</p>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => adjustPlan(plan.id, -1)}
                      className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 font-black text-lg hover:bg-slate-200 transition-colors"
                    >−</button>
                    <span className="text-xl font-black text-slate-900">{plan.count}</span>
                    <button
                      onClick={() => adjustPlan(plan.id, 1)}
                      className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-lg hover:bg-blue-700 transition-colors"
                    >+</button>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-slate-100">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold">Subscription value</span>
                      <span className="font-black text-slate-800">{fmt(plan.subValue)}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold">Direct (month 1)</span>
                      <span className="font-black text-emerald-600">{fmt(plan.directMonthly)}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold">Recurring (month 2+)</span>
                      <span className="font-black text-blue-600">{fmt(plan.recurringMonthly)}/mo</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Monthly totals */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Total Estimated Earnings</p>
                  <p className="text-3xl font-black mt-1">{fmt(yearPotential)}</p>
                  <p className="text-[10px] text-white/50">per year (12-month projection)</p>
                </div>
                <button onClick={resetCalculator} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 transition-colors" title="Reset">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Month 1 (direct)</p>
                  <p className="text-sm font-black text-emerald-400 mt-0.5">{fmt(month1Total)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Recurring / mo</p>
                  <p className="text-sm font-black text-blue-400 mt-0.5">{fmt(recurringMonthly)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Recurring total (mo 2–{recurringDuration})</p>
                  <p className="text-sm font-black text-blue-400 mt-0.5">{fmt(recurringMonthly * recurringMonths)}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Month 2 total</p>
                  <p className="text-sm font-black text-amber-400 mt-0.5">{fmt(month2Total)}</p>
                </div>
              </div>
            </div>

            {/* Accumulation card */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="relative z-10">
                <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-1">How it compounds</p>
                <h3 className="text-lg font-black mb-1">Meeting your {target} target every month</h3>
                <p className="text-xs text-emerald-50/80 leading-relaxed mb-4">
                  In month 1 you earn direct commission on all {target} new customers. From month 2 onward you keep earning recurring commission on previous customers while closing {target} new ones — so each month&apos;s earnings grow.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                    <p className="text-[9px] font-bold text-emerald-100 uppercase tracking-wider">Month 1 new</p>
                    <p className="text-lg font-black mt-0.5">{fmt(month1Total)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                    <p className="text-[9px] font-bold text-emerald-100 uppercase tracking-wider">Carried recurring</p>
                    <p className="text-lg font-black mt-0.5">{fmt(recurringMonthly)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                    <p className="text-[9px] font-bold text-emerald-100 uppercase tracking-wider">Month 2 new</p>
                    <p className="text-lg font-black mt-0.5">{fmt(directMonthly)}</p>
                  </div>
                  <div className="bg-white/15 rounded-xl p-3 border border-white/20">
                    <p className="text-[9px] font-bold text-white uppercase tracking-wider">Month 2 total</p>
                    <p className="text-lg font-black mt-0.5">{fmt(month2Total)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 12-month projection */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <CalendarRange className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">12-Month Growth Potential</h3>
                  <p className="text-[10px] text-slate-400">Consistent {target} conversions every month · recurring carries over</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px]">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-2 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Month</th>
                      <th className="px-3 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Direct</th>
                      <th className="px-3 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Recurring</th>
                      {isLineManager && <th className="px-3 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Indirect</th>}
                      <th className="pl-3 pr-1 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Month Total</th>
                      <th className="pl-1 pr-3 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Cumulative</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {projection.map((p) => (
                      <tr key={p.month} className={cn("hover:bg-slate-50/50 transition-colors", p.month === 12 && "bg-emerald-50/40")}>
                        <td className="px-2 py-3">
                          <span className="text-xs font-black text-slate-900">{p.month}</span>
                        </td>
                        <td className="px-3 py-3 text-xs font-bold text-emerald-600">{fmt(p.direct)}</td>
                        <td className="px-3 py-3 text-xs font-bold text-blue-600">{fmt(p.recurring)}</td>
                        {isLineManager && <td className="px-3 py-3 text-xs font-bold text-amber-600">{fmt(p.indirect)}</td>}
                        <td className="pl-3 pr-1 py-3 text-xs font-black text-slate-900">{fmt(p.total)}</td>
                        <td className="pl-1 pr-3 py-3">
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg whitespace-nowrap">{fmt(p.cumulative)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> Potential first-year earnings
                </p>
                <p className="text-2xl font-black text-emerald-700">{fmt(yearPotential)}</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-100 pt-4">
              Assumes {directRate}% direct commission, {activeRecurringRate}% monthly recurring for {recurringDuration} months
              {isLineManager ? `, and ${indirectRate}% indirect + ${recurringLMRate}% recurring indirect from your team.` : '.'} All rates are pulled live from platform settings.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Direct commission */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Percent className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Direct Commission</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                You earn <span className="font-bold text-emerald-600">{directRate}%</span> on every business you personally bring to Vemtap that subscribes to a paid plan. This is your <span className="font-bold">direct</span> commission — you get it on the first month&apos;s subscription payment of each customer you close.
              </p>
              <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Rate</span>
                <span className="text-sm font-black text-emerald-600">{directRate}% of subscription</span>
              </div>
            </div>

            {/* Recurring direct */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Recurring Commission ({isAgent ? 'Agent' : 'Affiliate'})</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                When a business you brought in <span className="font-bold">renews</span> its subscription each month, you continue earning a recurring <span className="font-bold text-blue-600">{activeRecurringRate}%</span> commission for up to {recurringDuration} months. This is what makes building a portfolio of active businesses so valuable.
              </p>
              <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Recurring rate</span>
                <span className="text-sm font-black text-blue-600">{activeRecurringRate}% / month for {recurringDuration} months</span>
              </div>
            </div>

            {/* Indirect (LM only) */}
            {isLineManager ? (
              <div className="bg-white border border-amber-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-amber-600" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Indirect Commission (Line Manager)</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  As a Line Manager, you earn an additional <span className="font-bold text-amber-600">{indirectRate}%</span> indirect commission on everything your team (agents &amp; affiliates under you) generates. You also earn a recurring <span className="font-bold text-amber-600">{recurringLMRate}%</span> on their recurring subscriptions.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-bold text-slate-500">Indirect</p>
                    <p className="text-sm font-black text-amber-600">{indirectRate}%</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] font-bold text-slate-500">Recurring indirect</p>
                    <p className="text-sm font-black text-amber-600">{recurringLMRate}%</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Target className="w-4 h-4 text-purple-600" />
                  </div>
                  <h4 className="text-sm font-black text-slate-900">Want to earn more?</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Recruit and build a team to unlock <span className="font-bold text-purple-600">indirect commission</span> ({indirectRate}%). As your team grows, you&apos;ll earn on their sales too — check the Line Manager section to learn more.
                </p>
              </div>
            )}

            {/* Subscription plans */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Gem className="w-4 h-4 text-indigo-600" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Subscription Plans</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Conversions are businesses that subscribe to a paid plan. Free users earn nothing. Here are the current plans:
              </p>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Free</p>
                  <p className="text-sm font-black text-slate-400">₦0</p>
                </div>
                {SUBSCRIPTION_PLANS.map(plan => (
                  <div key={plan.id} className="bg-white rounded-xl p-3 text-center border-2 border-slate-100">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{plan.name}</p>
                    <p className="text-sm font-black text-slate-900">₦{plan.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0" />
              <p className="text-xs text-blue-800 leading-relaxed">
                These rates come from the platform settings and apply to everyone. Rates may be reviewed by the admin from time to time.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function EarningsCalculatorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-sm font-bold text-slate-400">Loading...</p></div>}>
      <EarningsCalculatorInner />
    </Suspense>
  );
}
