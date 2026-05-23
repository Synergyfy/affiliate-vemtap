'use client';

import { motion } from 'framer-motion';
import { Target, TrendingUp, Flame, CheckCircle2, AlertCircle } from 'lucide-react';
import { AffiliateStats } from '@/types/api';

interface AgentTargetTrackerProps {
  stats: AffiliateStats;
}

interface ProgressBarProps {
  label: string;
  current: number;
  target: number;
  color: string;
  icon: React.ReactNode;
  unit: string;
}

function ProgressBar({ label, current, target, color, icon, unit }: ProgressBarProps) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isComplete = pct >= 100;
  const isOnTrack = pct >= 50;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
            {icon}
          </div>
          <span className="text-xs font-bold text-slate-700">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          ) : !isOnTrack ? (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          ) : null}
          <span className="text-sm font-black text-slate-900">
            {current}<span className="text-slate-400 font-medium">/{target}</span>
          </span>
          <span className="text-[10px] font-bold text-slate-400">{unit}</span>
        </div>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className={`h-full rounded-full ${
            isComplete
              ? 'bg-gradient-to-r from-emerald-400 to-green-500'
              : isOnTrack
              ? 'bg-gradient-to-r from-violet-500 to-purple-600'
              : 'bg-gradient-to-r from-amber-400 to-orange-400'
          }`}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-slate-400">
          {isComplete ? '🎉 Target reached!' : `${(target - current)} more to go`}
        </span>
        <span
          className={`text-[10px] font-black ${
            isComplete ? 'text-emerald-500' : isOnTrack ? 'text-violet-500' : 'text-amber-500'
          }`}
        >
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}

export default function AgentTargetTracker({ stats }: AgentTargetTrackerProps) {
  const {
    dailyLeadTarget,
    monthlyConversionTarget,
    todayLeadsCount,
    monthlyLeadsCount,
    monthlyConversionsCount,
  } = stats;

  // Don't render if no targets are set
  if (!dailyLeadTarget && !monthlyConversionTarget) return null;

  const dailyPct = dailyLeadTarget > 0 ? Math.min((todayLeadsCount / dailyLeadTarget) * 100, 100) : 0;
  const monthlyConvPct = monthlyConversionTarget > 0 ? Math.min((monthlyConversionsCount / monthlyConversionTarget) * 100, 100) : 0;

  const overallScore = Math.round((dailyPct + monthlyConvPct) / 2);

  let badge = { label: 'Getting Started', color: 'text-slate-400', bg: 'bg-slate-100' };
  if (overallScore >= 100) badge = { label: 'Target Champion 🏆', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  else if (overallScore >= 70) badge = { label: 'On Track 🔥', color: 'text-violet-600', bg: 'bg-violet-50' };
  else if (overallScore >= 40) badge = { label: 'Making Progress', color: 'text-amber-600', bg: 'bg-amber-50' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-white text-sm">Target Tracker</h3>
              <p className="text-violet-200 text-[11px] font-medium">Your performance this period</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full ${badge.bg}`}>
            <span className={`text-[10px] font-black ${badge.color}`}>{badge.label}</span>
          </div>
        </div>

        {/* Score Ring */}
        <div className="mt-4 flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
              <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
              <motion.circle
                cx="32" cy="32" r="27" fill="none"
                stroke="white" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 27}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 27 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 27 * (1 - overallScore / 100) }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-black text-sm">{overallScore}%</span>
            </div>
          </div>
          <div>
            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Overall Progress</p>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-white text-xs font-bold">{todayLeadsCount} leads today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-green-300" />
                <span className="text-white text-xs font-bold">{monthlyConversionsCount} converts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="p-5 space-y-5">
        {dailyLeadTarget > 0 && (
          <ProgressBar
            label="Today's Lead Target"
            current={todayLeadsCount}
            target={dailyLeadTarget}
            color="bg-gradient-to-br from-amber-400 to-orange-500"
            icon={<Flame className="w-3.5 h-3.5 text-white" />}
            unit="leads"
          />
        )}

        {monthlyConversionTarget > 0 && (
          <ProgressBar
            label="Monthly Conversions"
            current={monthlyConversionsCount}
            target={monthlyConversionTarget}
            color="bg-gradient-to-br from-violet-500 to-purple-600"
            icon={<TrendingUp className="w-3.5 h-3.5 text-white" />}
            unit="converts"
          />
        )}

        {/* Monthly Leads Summary */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-center">
            <p className="text-2xl font-black text-slate-900">{monthlyLeadsCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leads This Month</p>
          </div>
          <div className="w-px h-10 bg-slate-100" />
          <div className="text-center">
            <p className="text-2xl font-black text-violet-600">{monthlyConversionsCount}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Conversions</p>
          </div>
          <div className="w-px h-10 bg-slate-100" />
          <div className="text-center">
            <p className="text-2xl font-black text-slate-900">{dailyLeadTarget}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Target</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
