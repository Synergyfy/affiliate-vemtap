'use client';

import { useState, useMemo, useRef } from 'react';
import { Clock, Calendar, CalendarClock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SchedulePickerProps {
  scheduledAt: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

const PRESETS = [
  { label: 'Now', value: null },
  { label: 'In 1 hour', offsetMs: 60 * 60 * 1000 },
  { label: 'Tomorrow 9am', nextDayHour: 9 },
  { label: 'In 3 days', offsetMs: 3 * 24 * 60 * 60 * 1000 },
];

function toLocalDatetimeString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

function getPresetDate(preset: (typeof PRESETS)[number]): string | null {
  if (preset.value === null) return null;
  const now = new Date();
  if ('offsetMs' in preset && preset.offsetMs) {
    return toLocalDatetimeString(new Date(now.getTime() + preset.offsetMs));
  }
  if ('nextDayHour' in preset && preset.nextDayHour != null) {
    const next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(preset.nextDayHour, 0, 0, 0);
    return toLocalDatetimeString(next);
  }
  return null;
}

export default function SchedulePicker({ scheduledAt, onChange, disabled }: SchedulePickerProps) {
  const dateRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const isScheduled = scheduledAt !== null;
  const isNow = scheduledAt === null;

  const activePreset = useMemo(() => {
    if (!scheduledAt) return 0;
    for (let i = 1; i < PRESETS.length; i++) {
      const presetDate = getPresetDate(PRESETS[i]);
      if (presetDate === scheduledAt) return i;
    }
    return -1;
  }, [scheduledAt]);

  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      ref.current?.showPicker();
    } catch {
      ref.current?.focus();
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</p>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset, idx) => (
          <button
            key={preset.label}
            type="button"
            disabled={disabled}
            onClick={() => onChange(getPresetDate(preset))}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-bold border transition-all disabled:opacity-50 flex items-center gap-1.5',
              idx === 0
                ? isNow
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                : activePreset === idx
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600',
            )}
          >
            {preset.label === 'Now' && <Zap className="w-3 h-3" />}
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom date + time — the whole field is clickable */}
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={openPicker(dateRef)}
          className={cn(
            'flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border bg-white text-left transition-all disabled:opacity-50',
            scheduledAt ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200 hover:border-slate-300',
          )}
        >
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={dateRef}
            type="date"
            tabIndex={-1}
            disabled={disabled}
            value={scheduledAt ? scheduledAt.split('T')[0] : ''}
            onChange={(e) => {
              if (!e.target.value) { onChange(null); return; }
              const time = scheduledAt ? scheduledAt.split('T')[1] || '09:00' : '09:00';
              onChange(`${e.target.value}T${time}`);
            }}
            className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none disabled:opacity-50"
          />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={openPicker(timeRef)}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-white text-left transition-all disabled:opacity-50',
            scheduledAt ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200 hover:border-slate-300',
          )}
        >
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={timeRef}
            type="time"
            tabIndex={-1}
            disabled={disabled}
            value={scheduledAt ? scheduledAt.split('T')[1] || '' : ''}
            onChange={(e) => {
              const date = scheduledAt ? scheduledAt.split('T')[0] : new Date().toISOString().split('T')[0];
              onChange(e.target.value ? `${date}T${e.target.value}` : null);
            }}
            className="w-full bg-transparent text-sm font-medium text-slate-700 focus:outline-none disabled:opacity-50"
          />
        </button>
      </div>

      {!isNow && (
        <p className="text-[11px] font-bold text-blue-600 flex items-center gap-1.5">
          <CalendarClock className="w-3.5 h-3.5" />
          Scheduled for {new Date(scheduledAt).toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
}