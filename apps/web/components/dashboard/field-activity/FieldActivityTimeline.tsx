'use client';

import { Clock, CheckCircle2, MapPin, Navigation, UserCheck, UserX, Calendar, AlertTriangle } from 'lucide-react';
import { FieldActivityTimelineEvent } from '@/types/field-activity';
import { cn } from '@/lib/utils';

interface FieldActivityTimelineProps {
  events: FieldActivityTimelineEvent[];
  className?: string;
}

export function FieldActivityTimeline({ events, className }: FieldActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={cn('bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5', className)}>
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Today's Activity
        </h3>
        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No activity yet. Start your first visit!</p>
        </div>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'WORK_STARTED': return <Navigation className="w-5 h-5 text-emerald-600" />;
      case 'VISIT_STARTED': return <MapPin className="w-5 h-5 text-blue-600" />;
      case 'VISIT_COMPLETED': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'LEAD_CAPTURED': return <UserCheck className="w-5 h-5 text-purple-600" />;
      case 'TRANSITION_UNUSUAL': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'WORK_ENDED': return <Clock className="w-5 h-5 text-slate-600" />;
      default: return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
      case 'WARNING': return 'border-amber-500 bg-amber-50 dark:bg-amber-900/20';
      case 'INFO': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-slate-300 bg-slate-50 dark:bg-slate-700/30';
    }
  };

  return (
    <div className={cn('bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5', className)}>
      <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Today's Activity
      </h3>

      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center border-2', getEventStatusColor(event.status))}>
                {getEventIcon(event.type)}
              </div>
              {events.length > 1 && event.id !== events[events.length - 1].id && (
                <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 mt-1" />
              )}
            </div>

            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900 dark:text-white text-sm">
                  {event.type === 'WORK_STARTED' && 'Work Started'}
                  {event.type === 'VISIT_STARTED' && 'Visit Started'}
                  {event.type === 'VISIT_COMPLETED' && 'Visit Completed'}
                  {event.type === 'LEAD_CAPTURED' && 'Lead Captured'}
                  {event.type === 'TRANSITION_UNUSUAL' && 'Unusual Transition'}
                  {event.type === 'WORK_ENDED' && 'Work Ended'}
                </p>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {event.businessName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{event.businessName}</p>
              )}
              {event.details && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{event.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}