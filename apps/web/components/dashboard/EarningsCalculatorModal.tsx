'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, X, Info, HelpCircle, TrendingUp, Users,
  BookOpen, Percent, RefreshCw, Target, Gem, Crown, Rocket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';

const SUBSCRIPTION_PLANS = [
  { id: 'silver', name: 'Silver', price: 8000, icon: Gem, color: 'from-slate-400 to-slate-500', ring: 'border-slate-200' },
  { id: 'gold', name: 'Gold', price: 15000, icon: Crown, color: 'from-amber-400 to-yellow-600', ring: 'border-amber-300' },
  { id: 'platinum', name: 'Platinum', price: 27000, icon: Rocket, color: 'from-indigo-400 to-purple-600', ring: 'border-indigo-300' },
];

interface EarningsCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EarningsCalculatorModal({ isOpen, onClose }: EarningsCalculatorModalProps) {
  const { user } = useAuth();
  const { data: settings } = useQuery<Record<string, any>>({
    queryKey: ['settings'],
    queryFn: async () => {
      return api.get('/settings');
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });
  const [tab, setTab] = useState<'calculator' | 'guide'>('calculator');
  const [target, setTarget] = useState<number>(20);
  const [planCounts, setPlanCounts] = useState<Record<string, number>>({ silver: 0, gold: 0, platinum: 0 });

  const isLineManager = user?.role === 'SUPERVISOR' || user?.role === 'MANAGER' || !!user?.isManagerMode;
  const isAgent = user?.role === 'AGENT';

  const directRate = Math.round((settings?.directCommissionRate ?? 0.20) * 100);
  const indirectRate = Math.round((settings?.indirectCommissionRate ?? 0.05) * 100);
  const recurringAgentRate = settings?.recurringAgentCommission ?? 5;
  const recurringAffiliateRate = settings?.recurringAffiliateCommission ?? 10;
  const recurringLMRate = settings?.recurringLineManagerCommission ?? 3;
  const recurringDuration = settings?.recurringDurationMonths ?? 12;
  const defaultDailyTarget = settings?.dailyTarget || 20;

  const activeRecurringRate = isAgent ? recurringAgentRate : recurringAffiliateRate;

  useEffect(() => {
    if (settings?.dailyTarget && target === 20) {
      setTarget(settings.dailyTarget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.dailyTarget]);

  const totalCustomers = planCounts.silver + planCounts.gold + planCounts.platinum;
  const defaultPlan = target > 0 && totalCustomers === 0 ? { silver: Math.ceil(target * 0.5), gold: Math.ceil(target * 0.3), platinum: Math.ceil(target * 0.2) } : planCounts;

  const effectiveCounts = totalCustomers === 0 ? defaultPlan : planCounts;

  const { directMonthly, directYearly, recurringMonthly, recurringYearly, indirectMonthly, indirectYearly } = useMemo(() => {
    const silverTotal = (effectiveCounts.silver || 0) * 8000;
    const goldTotal = (effectiveCounts.gold || 0) * 15000;
    const platinumTotal = (effectiveCounts.platinum || 0) * 27000;
    const firstMonthTotal = silverTotal + goldTotal + platinumTotal;

    const directMonthly = firstMonthTotal * (directRate / 100);
    const recurringMonthly = firstMonthTotal * (activeRecurringRate / 100);
    const recurringMonths = Math.max(0, recurringDuration - 1);
    const directYearly = directMonthly + recurringMonthly * recurringMonths;

    let indirectMonthly = 0;
    let indirectYearly = 0;
    if (isLineManager) {
      indirectMonthly = firstMonthTotal * (indirectRate / 100);
      indirectYearly = indirectMonthly + (firstMonthTotal * (recurringLMRate / 100)) * recurringMonths;
    }

    return { directMonthly, directYearly, recurringMonthly, recurringYearly: recurringMonthly * recurringMonths, indirectMonthly, indirectYearly };
  }, [effectiveCounts, directRate, indirectRate, activeRecurringRate, recurringLMRate, recurringDuration, isLineManager]);

  const totalYearly = directYearly + indirectYearly;

  const resetCalculator = () => {
    setTarget(defaultDailyTarget);
    setPlanCounts({ silver: 0, gold: 0, platinum: 0 });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-2xl max-h-[90svh] overflow-y-auto bg-white rounded-[2rem] shadow-2xl"
          >
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Earnings Calculator</h3>
                  <p className="text-xs text-slate-500">Estimate your commission potential</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-4 sm:p-6 pb-0">
              <button
                onClick={() => setTab('calculator')}
                className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", tab === 'calculator' ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
              >
                <Calculator className="w-4 h-4" /> Calculator
              </button>
              <button
                onClick={() => setTab('guide')}
                className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", tab === 'guide' ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}
              >
                <BookOpen className="w-4 h-4" /> How It Works
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {tab === 'calculator' ? (
                <div className="space-y-6">
                  {/* Info banner */}
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 shrink-0" />
                    <p className="text-xs text-blue-800 leading-relaxed">
                      <span className="font-bold">How it works:</span> A conversion means a business that actually subscribes. The default target is {defaultDailyTarget} conversions. Adjust the slider and set how many customers you expect on each plan to see your potential earnings.
                    </p>
                  </div>

                  {/* Target slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-blue-600" /> Monthly Conversion Target
                      </label>
                      <span className="text-lg font-black text-blue-600">{target}</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={200}
                      value={target}
                      onChange={(e) => setTarget(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                      <span>10</span>
                      <span>50</span>
                      <span>100</span>
                      <span>150</span>
                      <span>200</span>
                    </div>
                  </div>

                  {/* Plan counts */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600" /> Expected Customers per Plan
                    </p>
                    {totalCustomers === 0 && (
                      <p className="text-[10px] text-slate-400 italic">Leave at 0 to auto-distribute across your target of {target} conversions.</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {SUBSCRIPTION_PLANS.map(plan => (
                        <div key={plan.id} className={cn("bg-white rounded-2xl border-2 p-4 space-y-3", plan.ring)}>
                          <div className="flex items-center justify-between">
                            <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white", plan.color)}>
                              <plan.icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-black text-slate-900">₦{plan.price.toLocaleString()}</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">{plan.name}</p>
                            <p className="text-[10px] text-slate-400">per month / customer</p>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <button
                              onClick={() => setPlanCounts(prev => ({ ...prev, [plan.id]: Math.max(0, prev[plan.id] - 1) }))}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-black hover:bg-slate-200 transition-colors"
                            >−</button>
                            <span className="text-lg font-black text-slate-900">{planCounts[plan.id]}</span>
                            <button
                              onClick={() => setPlanCounts(prev => ({ ...prev, [plan.id]: prev[plan.id] + 1 }))}
                              className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-black hover:bg-slate-200 transition-colors"
                            >+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Results */}
                  <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Total Estimated Earnings</p>
                        <p className="text-3xl font-black mt-1">₦{totalYearly.toLocaleString()}</p>
                        <p className="text-[10px] text-white/50">per year (based on your plan mix)</p>
                      </div>
                      <button onClick={resetCalculator} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 transition-colors" title="Reset">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Direct / Month 1</p>
                        <p className="text-sm font-black text-emerald-400 mt-0.5">₦{directMonthly.toLocaleString()}</p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                        <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Recurring / Year</p>
                        <p className="text-sm font-black text-blue-400 mt-0.5">₦{recurringYearly.toLocaleString()}</p>
                      </div>
                      {isLineManager ? (
                        <>
                          <div className="bg-white/5 rounded-xl p-3 border border-white/10 col-span-2">
                            <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1"><Users className="w-3 h-3" /> Indirect Commission / Year (Line Manager)</p>
                            <p className="text-sm font-black text-amber-400 mt-0.5">₦{indirectYearly.toLocaleString()}</p>
                          </div>
                        </>
                      ) : (
                        <div className="bg-white/5 rounded-xl p-3 border border-white/10 col-span-2">
                          <p className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Direct Commission / Year</p>
                          <p className="text-sm font-black text-emerald-400 mt-0.5">₦{directYearly.toLocaleString()}</p>
                        </div>
                      )}
                    </div>

                    <p className="relative z-10 text-[10px] text-white/40 leading-relaxed border-t border-white/10 pt-3">
                      Assumes {directRate}% direct commission, {activeRecurringRate}% monthly recurring for {recurringDuration} months
                      {isLineManager ? `, and ${indirectRate}% indirect + ${recurringLMRate}% recurring indirect from your team.` : '.'}
                    </p>
                  </div>
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
                          <HelpCircle className="w-4 h-4 text-purple-600" />
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
                    <div className="grid grid-cols-3 gap-2">
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
