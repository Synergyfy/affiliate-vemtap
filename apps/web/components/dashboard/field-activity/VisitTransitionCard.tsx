'use client';

import { AlertTriangle, CheckCircle2, MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { VisitTransition, TransitionStatus } from '@/types/field-activity';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface VisitTransitionCardProps {
  transition: VisitTransition | null;
  onExplain?: (visitId: string) => void;
  className?: string;
}

const statusConfig: Record<TransitionStatus, { icon: React.ReactNode; label: string; description: string; color: string; bg: string }> = {
  NORMAL: { icon: <CheckCircle2 className="w-5 h-5" />, label: 'Normal Transition', description: 'Distance and time are within expected ranges.', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  UNUSUAL_DISTANCE: { icon: <AlertTriangle className="w-5 h-5" />, label: 'Unusual Distance', description: 'The distance between visits is longer than expected.', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  UNUSUAL_TIME: { icon: <AlertTriangle className="w-5 h-5" />, label: 'Unusual Time Gap', description: 'The time between visits is longer than expected.', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  BOTH_UNUSUAL: { icon: <AlertTriangle className="w-5 h-5" />, label: 'Unusual Transition', description: 'Both distance and time between visits are unusual.', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

export function VisitTransitionCard({ transition, onExplain, className }: VisitTransitionCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (!transition || !transition.previousVisit || !transition.currentVisit) {
    return null;
  }

  const config = statusConfig[transition.status];
  const isUnusual = transition.status !== 'NORMAL';

  return (
    <div className={cn('rounded-xl border p-4', config.bg, `border-${config.color.replace('text-', '')}`, className)}>
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', config.bg, config.color)}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{config.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{config.description}</p>
            </div>
            <button onClick={() => setExpanded(!expanded)} className="p-1 text-slate-400 hover:text-slate-600">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          {expanded && (
            <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Previous Visit</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">{transition.previousVisit.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(transition.previousVisit.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {transition.previousVisit.gpsLat && transition.previousVisit.gpsLng && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Location captured
                    </p>
                  )}
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Visit</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1">{transition.currentVisit.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(transition.currentVisit.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {transition.currentVisit.gpsLat && transition.currentVisit.gpsLng && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Location captured
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {transition.distanceMeters !== undefined && (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Distance</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {transition.distanceMeters < 1000
                        ? `${transition.distanceMeters}m`
                        : `${(transition.distanceMeters / 1000).toFixed(1)}km`}
                    </p>
                  </div>
                )}
                {transition.timeBetweenMinutes !== undefined && (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Time Gap</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {transition.timeBetweenMinutes < 60
                        ? `${transition.timeBetweenMinutes} min`
                        : `${Math.floor(transition.timeBetweenMinutes / 60)}h ${transition.timeBetweenMinutes % 60}min`}
                    </p>
                  </div>
                )}
              </div>

              {isUnusual && onExplain && transition.currentVisit && !transition.exceptionSubmitted && (
                <button
                  onClick={() => onExplain(transition.currentVisit!.id)}
                  className="w-full px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Explain Delay
                </button>
              )}

              {transition.exceptionSubmitted && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Explanation submitted
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}