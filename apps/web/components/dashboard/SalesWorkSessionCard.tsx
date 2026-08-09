'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PlayCircle,
  StopCircle,
  Clock,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import {
  useActiveWorkSession,
  useStartWork,
  useEndWork,
} from '@/services/useSalesWorkSession';
import { cn } from '@/lib/utils';

interface SalesWorkSessionCardProps {
  progress?: { completed: number; remaining: number; target: number };
}

export default function SalesWorkSessionCard({ progress }: SalesWorkSessionCardProps) {
  const [confirmEnd, setConfirmEnd] = useState(false);

  const { data: activeSession, isLoading, refetch } = useActiveWorkSession();
  const startWorkMutation = useStartWork();
  const endWorkMutation = useEndWork();

  // Starting a work session must not force GPS — a salesperson may begin work
  // from home (calls/follow-ups). GPS is only captured when a physical visit
  // begins, in the Execute workspace.
  const handleStartWork = async () => {
    try {
      await startWorkMutation.mutateAsync({ gpsStatus: 'UNKNOWN', notes: '' });
      setConfirmEnd(false);
      refetch();
    } catch (error) {
      console.error('Failed to start work session:', error);
    }
  };

  const handleEndWork = async () => {
    try {
      await endWorkMutation.mutateAsync({ gpsStatus: 'UNKNOWN', notes: '' });
      setConfirmEnd(false);
      refetch();
    } catch (error) {
      console.error('Failed to end work session:', error);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const sessionDuration = activeSession
    ? (activeSession.durationMinutes ?? Math.max(0, Math.floor((new Date().getTime() - new Date(activeSession.startedAt).getTime()) / 60000)))
    : 0;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 animate-pulse"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-slate-200 rounded-lg" />
          <div className="flex-1">
            <div className="h-3.5 w-2/3 bg-slate-200 rounded" />
            <div className="h-3 w-1/3 bg-slate-200 rounded mt-1.5" />
          </div>
        </div>
        <div className="h-9 bg-slate-200 rounded-lg" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-4 shadow-sm border border-slate-200"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
          activeSession ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
        )}>
          {activeSession
            ? <StopCircle className="w-4 h-4" />
            : <PlayCircle className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 truncate">Work Session</h3>
          <p className="text-[11px] text-slate-500 truncate">Daily work session</p>
        </div>
        <span className={cn(
          'shrink-0 text-[10px] font-semibold px-2 py-1 rounded-md border',
          activeSession
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-slate-100 text-slate-500 border-slate-200'
        )}>
          {activeSession ? 'Live' : 'Idle'}
        </span>
      </div>

      {activeSession ? (
        <>
          {/* Work in Progress summary */}
          <div className="mb-3 rounded-lg bg-emerald-50/60 border border-emerald-100 p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 mb-0.5">Started</p>
                <p className="text-sm font-bold text-slate-900">
                  {new Date(activeSession.startedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 mb-0.5">Duration</p>
                <p className="text-sm font-bold text-slate-900 font-mono">{formatDuration(sessionDuration)}</p>
              </div>
            </div>
            {progress && progress.target > 0 && (
              <div className="mt-2.5 pt-2.5 border-t border-emerald-100 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Completed</p>
                  <p className="text-sm font-bold text-slate-900">{progress.completed} / {progress.target}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Remaining</p>
                  <p className="text-sm font-bold text-slate-900">{progress.remaining}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mb-3 rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-[11px] font-semibold text-slate-600 mb-0.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Location
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              GPS is verified when you begin a business visit in Execute, not when you start the work session.
            </p>
          </div>

          {!confirmEnd ? (
            <button
              onClick={() => setConfirmEnd(true)}
              disabled={endWorkMutation.isPending}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs"
            >
              <StopCircle className="w-4 h-4" />
              End Work
            </button>
          ) : (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <p className="text-[13px] font-semibold text-slate-900 mb-0.5">
                End today&apos;s work session?
              </p>
              <p className="text-[11px] text-slate-500 mb-3">
                {progress && progress.target > 0
                  ? `${progress.completed} of ${progress.target} businesses completed · ${progress.remaining} remaining`
                  : 'This will close your active work session.'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmEnd(false)}
                  disabled={endWorkMutation.isPending}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                >
                  Keep Working
                </button>
                <button
                  onClick={handleEndWork}
                  disabled={endWorkMutation.isPending}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  {endWorkMutation.isPending ? 'Ending...' : 'End Work'}
                </button>
              </div>
            </div>
          )}

          {activeSession.notes && (
            <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-[11px] font-medium text-slate-500 mb-0.5">Notes</p>
              <p className="text-[13px] text-slate-700 whitespace-pre-wrap">{activeSession.notes}</p>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-3 rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Not Started</p>
            <p className="text-[13px] text-slate-600">
              Start your work session before beginning today&apos;s visits.
            </p>
            {progress && progress.target > 0 && (
              <p className="text-[11px] text-slate-500 mt-1.5">
                {progress.target} businesses today · {progress.remaining} remaining
              </p>
            )}
          </div>

          <button
            onClick={handleStartWork}
            disabled={startWorkMutation.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-xs"
          >
            <PlayCircle className="w-4 h-4" />
            {startWorkMutation.isPending ? 'Starting Work...' : 'Start Work'}
          </button>
        </>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 text-center">
          GPS is captured when you begin a business visit, not when you start the work session.
        </p>
      </div>
    </motion.div>
  );
}