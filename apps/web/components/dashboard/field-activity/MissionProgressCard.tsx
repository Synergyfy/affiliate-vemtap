'use client';

import { Target, CheckCircle2, Users, UserCheck, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import { MissionProgress } from '@/types/field-activity';
import { cn } from '@/lib/utils';

interface MissionProgressCardProps {
  progress: MissionProgress;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export function MissionProgressCard({ progress, onAction, actionLabel, className }: MissionProgressCardProps) {
  const { totalBusinesses, visitedCount, leadsCaptured, interestedCount, followUps, conversions, remaining, percentComplete } = progress;

  return (
    <div className={cn('bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Today's Mission Progress
        </h3>
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
          {visitedCount} / {totalBusinesses}
        </span>
      </div>

      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, percentComplete)}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
          <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">{visitedCount}</p>
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Visits</p>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl">
          <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-xl font-black text-blue-700 dark:text-blue-300">{leadsCaptured}</p>
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Leads</p>
        </div>
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-xl">
          <UserCheck className="w-5 h-5 text-purple-600 mx-auto mb-1" />
          <p className="text-xl font-black text-purple-700 dark:text-purple-300">{interestedCount}</p>
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Interested</p>
        </div>
      </div>

      {followUps > 0 && (
        <div className="flex items-center gap-2 mb-3 text-xs text-slate-600 dark:text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-amber-500" />
          <span>{followUps} follow-up{followUps === 1 ? '' : 's'} scheduled</span>
        </div>
      )}

      {conversions > 0 && (
        <div className="flex items-center gap-2 mb-3 text-xs text-slate-600 dark:text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>{conversions} conversion{conversions === 1 ? '' : 's'} this mission</span>
        </div>
      )}

      {remaining > 0 && (
        <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-4 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {remaining} {remaining === 1 ? 'business remaining' : 'businesses remaining'}
        </p>
      )}

      {onAction && (
        <button
          onClick={onAction}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
        >
          {actionLabel || 'Continue Mission'}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}