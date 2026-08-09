'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Save, MapPin, Target, CheckCircle, Navigation, Rocket, Plus, Minus, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { MissionHorizon } from '@/types/affiliate-market-mapping';
import { cn } from '@/lib/utils';
import { useMarketMapping } from '@/components/dashboard/market-mapping/MarketMappingContext';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface PlanMissionProps {
  onAddVisits?: (visits: any[]) => void;
}

interface DayEntry {
  label: string;
  date: string;
  dateObj: Date;
  dayIndex: number;
  target: number;
  location: string;
  isToday: boolean;
  isActive: boolean;
}

interface WeekGroup {
  label: string;
  range: string;
  days: DayEntry[];
}

interface PendingPlan {
  horizon: MissionHorizon;
  location: string;
  targetCount: number;
  startDate: string;
}

const TODAY = new Date();
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function toDateInputValue(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayIndex(d: Date): number {
  const dow = d.getDay();
  return dow === 0 ? 6 : dow - 1;
}

function getFridayOfWeek(d: Date): Date {
  const idx = getDayIndex(d);
  const friday = new Date(d);
  friday.setDate(d.getDate() + (4 - idx));
  return friday;
}

function countWorkingDays(start: Date, includeSat: boolean, includeSun: boolean): number {
  const year = start.getFullYear();
  const month = start.getMonth();
  const lastDay = new Date(year, month + 1, 0);
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= lastDay) {
    const idx = getDayIndex(cursor);
    if (idx < 5 || (idx === 5 && includeSat) || (idx === 6 && includeSun)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

function buildWeekGroups(start: Date, includeSat: boolean, includeSun: boolean): WeekGroup[] {
  const year = start.getFullYear();
  const month = start.getMonth();
  const lastDay = new Date(year, month + 1, 0);
  const groups: WeekGroup[] = [];

  // Find the Monday of the week containing the start date
  const startIdx = getDayIndex(start);
  const firstMonday = new Date(start);
  firstMonday.setDate(firstMonday.getDate() - startIdx);

  // Find the first Monday of the start's month
  const monthFirstDay = new Date(year, month, 1);
  const monthFirstIdx = getDayIndex(monthFirstDay);
  const firstMondayOfMonth = new Date(year, month, 1 - monthFirstIdx);

  // Calculate which calendar week the start date falls in (0-based within the month grid)
  const weekOffset = Math.floor((firstMonday.getTime() - firstMondayOfMonth.getTime()) / (7 * 86400000));
  const startWeekNum = weekOffset;

  const cursor = new Date(firstMonday);

  for (let w = 0; w < 6; w++) {
    const days: DayEntry[] = [];
    let first: number | null = null;
    let last: number | null = null;

    for (let d = 0; d < 7; d++) {
      const dt = new Date(cursor);
      dt.setDate(cursor.getDate() + d);
      const idx = getDayIndex(dt);
      const inMonth = dt.getMonth() === month && dt <= lastDay;
      const pastEnd = dt > lastDay;
      const isWeekend = idx === 5 || idx === 6;
      const weekendAllowed = idx === 5 ? includeSat : idx === 6 ? includeSun : false;

      let active = false;
      if (inMonth && !pastEnd) {
        if (w === 0) {
          // First week: activate from start date through Friday (or weekend if enabled)
          const onOrAfterStart = dt >= new Date(start.getFullYear(), start.getMonth(), start.getDate());
          const isWeekday = idx < 5;
          active = onOrAfterStart && (isWeekday || (isWeekend && weekendAllowed));
        } else {
          // Subsequent weeks: all weekdays active, weekends only if enabled
          active = !isWeekend || weekendAllowed;
        }
      }

      if (active) {
        if (first === null) first = dt.getDate();
        last = dt.getDate();
      }

      days.push({
        label: DAY_LABELS[idx],
        date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dateObj: dt,
        dayIndex: idx,
        target: 0,
        location: '',
        isToday: dt.toDateString() === TODAY.toDateString(),
        isActive: active,
      });
    }

    if (days.some(d => d.isActive)) {
      const ms = start.toLocaleDateString('en-US', { month: 'short' });
      const range = first && last ? (first === last ? `${ms} ${first}` : `${ms} ${first}–${last}`) : '';
      groups.push({ label: `Week ${startWeekNum + w + 1}`, range, days });
    }

    cursor.setDate(cursor.getDate() + 7);
    if (cursor > lastDay && cursor > new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)) break;
  }
  return groups;
}

export default function PlanMission({ onAddVisits }: PlanMissionProps) {
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const dayPickerInputRef = useRef<HTMLInputElement>(null);
  const [horizon, setHorizon] = useState<MissionHorizon>('DAY');
  const [startDate, setStartDate] = useState<Date>(TODAY);
  const [includeSat, setIncludeSat] = useState(false);
  const [includeSun, setIncludeSun] = useState(false);
  const [currentWeekIdx, setCurrentWeekIdx] = useState(0);
  const [weekGroups, setWeekGroups] = useState<WeekGroup[]>(() => buildWeekGroups(TODAY, false, false));
  const [pendingPlan, setPendingPlan] = useState<PendingPlan | null>(null);
  const [weekLocations, setWeekLocations] = useState<Record<number, string>>({});
  const [perDayLocations, setPerDayLocations] = useState(false);

  // DAY tab: single day state
  const [dayTarget, setDayTarget] = useState(0);
  const [dayLocation, setDayLocation] = useState('');

  // WEEK tab: quick set
  const [quickTarget, setQuickTarget] = useState(0);

  const { setPerformance, setStats, performance, missionPlans, addMissionPlan, archiveMissionPlan } = useMarketMapping();
  const { showToast } = useToast();

  const monthName = `${MONTH_NAMES[startDate.getMonth()]} ${startDate.getFullYear()}`;
  const currentWeek = weekGroups[currentWeekIdx];

  // Dynamic range from active days (not static from buildWeekGroups)
  const currentWeekRange = useMemo(() => {
    if (!currentWeek) return '';
    const activeDays = currentWeek.days.filter(d => d.isActive);
    if (activeDays.length === 0) return '';
    const first = activeDays[0].dateObj.getDate();
    const last = activeDays[activeDays.length - 1].dateObj.getDate();
    const ms = startDate.toLocaleDateString('en-US', { month: 'short' });
    return first === last ? `${ms} ${first}` : `${ms} ${first}–${last}`;
  }, [currentWeek, startDate]);

  // Check if Sat/Sun of current week fall in the same month as startDate
  const weekendInMonth = useMemo(() => {
    if (!currentWeek) return { sat: false, sun: false };
    const sat = currentWeek.days.find(d => d.dayIndex === 5);
    const sun = currentWeek.days.find(d => d.dayIndex === 6);
    return {
      sat: sat ? sat.dateObj.getMonth() === startDate.getMonth() : false,
      sun: sun ? sun.dateObj.getMonth() === startDate.getMonth() : false,
    };
  }, [currentWeek, startDate]);

  // WEEK tab: read-only week totals from day entries
  const weekSummaries = useMemo(() =>
    weekGroups.map(w => ({
      label: w.label,
      range: w.range,
      total: w.days.filter(d => d.isActive).reduce((s, d) => s + d.target, 0),
      locations: [...new Set(w.days.filter(d => d.isActive && d.location).map(d => d.location))],
      days: w.days,
    })),
  [weekGroups]);

  const monthTotal = useMemo(() => weekSummaries.reduce((s, w) => s + w.total, 0), [weekSummaries]);
  const workingDaysLeft = useMemo(() => countWorkingDays(startDate, includeSat, includeSun), [startDate, includeSat, includeSun]);

  const setWeekLocation = useCallback((weekIdx: number, loc: string) => {
    setWeekLocations(prev => ({ ...prev, [weekIdx]: loc }));
    setWeekGroups(prev => prev.map((w, wi) => {
      if (wi !== weekIdx) return w;
      return { ...w, days: w.days.map(d => d.isActive ? { ...d, location: loc } : d) };
    }));
  }, []);

  const rebuild = useCallback((sat: boolean, sun: boolean, start: Date) => {
    setWeekGroups(prev => {
      const groups = buildWeekGroups(start, sat, sun);
      return groups.map((w, wi) => {
        const old = prev[wi];
        if (!old) return w;
        return {
          ...w,
          days: w.days.map((d, di) => {
            const oldDay = old.days[di];
            if (oldDay && oldDay.dateObj.getTime() === d.dateObj.getTime()) {
              return { ...d, target: oldDay.target, location: oldDay.location };
            }
            return d;
          }),
        };
      });
    });
    setCurrentWeekIdx(0);
  }, []);

  const handleStartDateChange = (val: string) => {
    const d = new Date(val + 'T00:00:00');
    if (isNaN(d.getTime())) return;
    setStartDate(d);
    rebuild(includeSat, includeSun, d);
  };

  const toggleSat = () => {
    if (!weekendInMonth.sat) return;
    setIncludeSat(prev => {
      const next = !prev;
      if (!next) { setIncludeSun(false); rebuild(false, false, startDate); }
      else rebuild(true, includeSun, startDate);
      return next;
    });
  };

  const toggleSun = () => {
    if (!weekendInMonth.sun) return;
    setIncludeSun(prev => {
      const next = !prev;
      if (next && !includeSat) { setIncludeSat(true); rebuild(true, true, startDate); }
      else rebuild(includeSat, next, startDate);
      return next;
    });
  };

  const setWeekDayTarget = (weekIdx: number, dayIdx: number, val: number) => {
    setWeekGroups(prev => prev.map((w, wi) => {
      if (wi !== weekIdx) return w;
      const next = { ...w, days: w.days.map((d, di) => di === dayIdx ? { ...d, target: Math.max(1, val) } : d) };
      return next;
    }));
  };

  const setWeekDayLocation = (weekIdx: number, dayIdx: number, loc: string) => {
    setWeekGroups(prev => prev.map((w, wi) => {
      if (wi !== weekIdx) return w;
      return { ...w, days: w.days.map((d, di) => di === dayIdx ? { ...d, location: loc } : d) };
    }));
  };

  const applyQuick = () => {
    setWeekGroups(prev => prev.map((w, wi) => {
      if (wi !== currentWeekIdx) return w;
      return { ...w, days: w.days.map(d => d.isActive ? { ...d, target: quickTarget } : d) };
    }));
  };

  const applyForWeek = () => {
    setWeekGroups(prev => prev.map((w, wi) => {
      if (wi !== currentWeekIdx) return w;
      return {
        ...w,
        days: w.days.map(d => {
          if (d.isActive) return d;
          const idx = d.dayIndex;
          const isWeekend = idx === 5 || idx === 6;
          const inMonth = d.dateObj.getMonth() === startDate.getMonth();
          if (!inMonth) return d;
          const weekendAllowed = idx === 5 ? includeSat : includeSun;
          if (!isWeekend || weekendAllowed) {
            return { ...d, isActive: true, target: quickTarget };
          }
          return d;
        }),
      };
    }));
  };

  const applyDayToWeek = () => {
    if (!dayLocation) { showToast('Set a location for your target day', 'error'); return; }
    setWeekGroups(prev => prev.map((w, wi) => {
      if (wi !== 0) return w;
      return {
        ...w,
        days: w.days.map(d => {
          const onOrAfterStart = d.dateObj >= new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
          const idx = d.dayIndex;
          const isWeekend = idx === 5 || idx === 6;
          const inMonth = d.dateObj.getMonth() === startDate.getMonth();
          if (!inMonth || !onOrAfterStart) return d;
          const isWeekday = idx < 5;
          const weekendAllowed = idx === 5 ? includeSat : includeSun;
          if (isWeekday || (isWeekend && weekendAllowed)) {
            return { ...d, isActive: true, target: dayTarget, location: dayLocation };
          }
          return d;
        }),
      };
    }));
    setWeekLocations(prev => ({ ...prev, [0]: dayLocation }));
    setHorizon('WEEK');
  };

  const saveDayOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayLocation) { showToast('Set a location for your target day', 'error'); return; }
    if (dayTarget < 1) { showToast('Set at least 1 business target', 'error'); return; }
    setPendingPlan({ horizon: 'DAY', location: dayLocation, targetCount: dayTarget, startDate: startDate.toISOString() });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const allLocations = weekGroups.flatMap(w => w.days.filter(d => d.isActive && d.location).map(d => d.location));
    const primaryLocation = allLocations[0] || '';
    if (!primaryLocation) { showToast('Set a location for your target days', 'error'); return; }
    const total = horizon === 'DAY'
      ? (currentWeek?.days.filter(d => d.isActive).reduce((s, d) => s + d.target, 0) || 0)
      : weekSummaries.reduce((s, w) => s + w.total, 0);
    if (total < 1) { showToast('Set at least 1 business target', 'error'); return; }
    setPendingPlan({ horizon, location: primaryLocation, targetCount: total, startDate: startDate.toISOString() });
  };

  const confirm = () => {
    if (!pendingPlan) return;
    const { horizon: h, location: loc, targetCount: count } = pendingPlan;
    const progress = h === 'DAY' ? performance.dailyProgress : h === 'WEEK' ? performance.weeklyProgress : performance.monthlyProgress;
    const existing = missionPlans.find(p => p.horizon === h);
    if (existing) {
      archiveMissionPlan({ ...existing, achieved: progress, status: progress >= existing.targetCount ? 'ACHIEVED' : 'INCOMPLETE', archivedAt: new Date().toISOString() });
    }
    addMissionPlan({ horizon: h, location: loc, targetCount: count, createdAt: new Date().toISOString() });

    if (h === 'DAY') setPerformance(p => ({ ...p, dailyTarget: count, dailyProgress: 0 }));
    else if (h === 'WEEK') setPerformance(p => ({ ...p, weeklyTarget: count, weeklyProgress: 0 }));
    else setPerformance(p => ({ ...p, monthlyTarget: count, monthlyProgress: 0 }));
    setStats(p => ({ ...p, clusterName: loc }));
    setPendingPlan(null);
    showToast(`${h} target confirmed — ${count} businesses`, 'success');
  };

  const gridCols = includeSun ? 'grid-cols-7' : includeSat ? 'grid-cols-6' : 'grid-cols-5';

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-6">
        <div className="p-5">
          <form onSubmit={submit} className="space-y-4">
            {/* Start Date */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Start Date
              </label>
              <div 
                className="relative cursor-pointer"
                onClick={() => {
                  try {
                    startDateInputRef.current?.showPicker();
                  } catch (err) {
                    startDateInputRef.current?.focus();
                  }
                }}
              >
                <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 flex items-center justify-between">
                  <span>{startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <input 
                  ref={startDateInputRef} 
                  type="date" 
                  min={toDateInputValue(TODAY)} 
                  value={toDateInputValue(startDate)} 
                  onChange={e => handleStartDateChange(e.target.value)} 
                  onClick={e => {
                    e.stopPropagation();
                    try {
                      e.currentTarget.showPicker();
                    } catch (err) {}
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Targets align from this date through end of {monthName}.</p>
            </div>

            {/* Horizon tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-full md:w-auto md:inline-flex">
              {(['DAY', 'WEEK'] as MissionHorizon[]).map(h => (
                <button key={h} type="button" onClick={() => setHorizon(h)} className={cn("px-5 py-2 rounded-lg text-xs font-semibold transition-all flex-1 md:flex-none", horizon === h ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>{h}</button>
              ))}
            </div>

            {/* === DAY tab — single day planner === */}
            {horizon === 'DAY' && (
              <div className="space-y-4">
                {/* Day picker */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Pick a Day
                  </label>
                  <div 
                    className="relative cursor-pointer"
                    onClick={() => {
                      try {
                        dayPickerInputRef.current?.showPicker();
                      } catch (err) {
                        dayPickerInputRef.current?.focus();
                      }
                    }}
                  >
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 flex items-center justify-between">
                      <span>{startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                    <input 
                      ref={dayPickerInputRef} 
                      type="date" 
                      min={toDateInputValue(TODAY)} 
                      value={toDateInputValue(startDate)} 
                      onChange={e => handleStartDateChange(e.target.value)} 
                      onClick={e => {
                        e.stopPropagation();
                        try {
                          e.currentTarget.showPicker();
                        } catch (err) {}
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Choose the day you want to plan for.</p>
                </div>

                {/* Location */}
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location
                  </span>
                  <input type="text" placeholder="e.g. Banex Plaza, Wuse" value={dayLocation} onChange={e => setDayLocation(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
                </div>

                {/* Target */}
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mb-2">
                    <Target className="w-3.5 h-3.5 text-slate-400" /> Target
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <button type="button" onClick={() => setDayTarget(t => Math.max(1, t - 1))} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <input type="number" min={1} value={dayTarget} onChange={e => setDayTarget(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 text-center text-2xl font-bold text-slate-800 bg-transparent focus:outline-none appearance-none" />
                    <button type="button" onClick={() => setDayTarget(t => t + 1)} className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center mt-1">Set your daily visit target</p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button type="button" onClick={applyDayToWeek} className="flex-1 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Apply for the week
                  </button>
                  <button type="button" onClick={saveDayOnly} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                    <Save className="w-3.5 h-3.5" />
                    Save day only
                  </button>
                </div>
              </div>
            )}

            {/* === WEEK tab — full week planner === */}
            {horizon === 'WEEK' && (
              <div className="space-y-4">
                {/* Week navigator */}
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3">
                  <button type="button" disabled={currentWeekIdx === 0} onClick={() => setCurrentWeekIdx(i => Math.max(0, i - 1))} className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-colors", currentWeekIdx === 0 ? "text-slate-200" : "text-slate-500 hover:bg-slate-100")}>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{currentWeek?.label}</span>
                      <p className="text-sm font-semibold text-slate-800">{currentWeekRange}</p>
                    </div>
                    <div className="flex gap-1">
                      {weekGroups.map((_, wi) => (
                        <button key={wi} type="button" onClick={() => setCurrentWeekIdx(wi)} className={cn("w-2 h-2 rounded-full transition-all", wi === currentWeekIdx ? "bg-blue-600" : weekGroups[wi].days.some(d => d.isActive && d.target > 0) ? "bg-emerald-400" : "bg-slate-200")} />
                      ))}
                    </div>
                  </div>
                  <button type="button" disabled={currentWeekIdx >= weekGroups.length - 1} onClick={() => setCurrentWeekIdx(i => Math.min(weekGroups.length - 1, i + 1))} className={cn("w-8 h-8 flex items-center justify-center rounded-lg transition-colors", currentWeekIdx >= weekGroups.length - 1 ? "text-slate-200" : "text-slate-500 hover:bg-slate-100")}>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Location */}
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location
                    </span>
                    <button type="button" onClick={() => setPerDayLocations(!perDayLocations)} className="relative inline-flex h-6 w-11 items-center rounded-full border border-slate-200 transition-colors">
                      <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform", perDayLocations ? "translate-x-6 bg-amber-500" : "translate-x-1 bg-blue-500")} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-slate-400">{perDayLocations ? 'Custom location per day' : 'Same location for entire week'}</span>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", perDayLocations ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600")}>{perDayLocations ? 'Per day' : 'Weekly'}</span>
                  </div>
                  {!perDayLocations && (
                    <input type="text" placeholder="e.g. Banex Plaza, Wuse" value={weekLocations[currentWeekIdx] || ''} onChange={e => setWeekLocation(currentWeekIdx, e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
                  )}
                </div>

                {/* Weekends + Quick set */}
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 font-medium">Weekends</span>
                    <div className="flex items-center gap-2">
                      <label className={cn("flex items-center gap-1.5 cursor-pointer group", !weekendInMonth.sat && "opacity-40 pointer-events-none")}>
                        <input type="checkbox" checked={includeSat} onChange={toggleSat} disabled={!weekendInMonth.sat} className="sr-only" />
                        <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center transition-all", includeSat ? "bg-blue-600 border-blue-600" : "border-slate-300 group-hover:border-blue-400")}>
                          {includeSat && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="text-xs font-medium text-slate-600">Sat</span>
                      </label>
                      <label className={cn("flex items-center gap-1.5 cursor-pointer group", (!includeSat || !weekendInMonth.sun) && "opacity-40 pointer-events-none")}>
                        <input type="checkbox" checked={includeSun} onChange={toggleSun} disabled={!includeSat || !weekendInMonth.sun} className="sr-only" />
                        <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center transition-all", includeSun ? "bg-blue-600 border-blue-600" : "border-slate-300 group-hover:border-blue-400")}>
                          {includeSun && <CheckCircle className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="text-xs font-medium text-slate-600">Sun</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 font-medium">Quick set this week</span>
                    <div className="flex items-center gap-2">
                      <input type="number" min={1} value={quickTarget} onChange={e => setQuickTarget(Math.max(1, parseInt(e.target.value) || 1))} className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-center text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
                      <button type="button" onClick={applyQuick} className="px-3 py-1.5 bg-blue-600 text-white text-[11px] font-semibold rounded-lg hover:bg-blue-700 transition-colors">Apply</button>
                    </div>
                  </div>
                  {currentWeek?.days.some(d => !d.isActive && d.dayIndex < 5 && d.dateObj.getMonth() === startDate.getMonth()) && (
                    <div className="pt-2 border-t border-slate-100">
                      <button type="button" onClick={applyForWeek} className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Apply for the week
                      </button>
                    </div>
                  )}
                </div>

                {/* Day cards — mobile */}
                <div className="sm:hidden space-y-2">
                  {currentWeek?.days.filter(d => d.isActive).map((d) => {
                    const globalIdx = currentWeek.days.indexOf(d);
                    return (
                      <div key={globalIdx} className={cn("bg-white border rounded-2xl px-4 py-3 transition-all", d.isToday ? "border-blue-200 ring-2 ring-blue-50" : "border-slate-200")}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className={cn("text-xs font-bold uppercase", d.isToday ? "text-blue-600" : d.dayIndex >= 5 ? "text-amber-600" : "text-slate-500")}>{d.label}</span>
                            <span className="text-[11px] text-slate-400 font-medium">{d.date}</span>
                            {d.isToday && <span className="text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">TODAY</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => setWeekDayTarget(currentWeekIdx, globalIdx, d.target - 1)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                            <input type="number" min={1} value={d.target} onChange={e => setWeekDayTarget(currentWeekIdx, globalIdx, parseInt(e.target.value) || 1)} className="w-12 text-center text-sm font-bold text-slate-800 bg-transparent focus:outline-none appearance-none" />
                            <button type="button" onClick={() => setWeekDayTarget(currentWeekIdx, globalIdx, d.target + 1)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        {perDayLocations && (
                          <input type="text" placeholder="Location for this day" value={d.location} onChange={e => setWeekDayLocation(currentWeekIdx, globalIdx, e.target.value)} className="w-full mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Day cards — desktop grid */}
                <div className={cn("hidden sm:grid gap-2", gridCols)}>
                  {currentWeek?.days.filter(d => d.isActive).map((d) => {
                    const globalIdx = currentWeek.days.indexOf(d);
                    return (
                      <div key={globalIdx} className={cn("bg-white border rounded-2xl p-4 transition-all", d.isToday ? "border-blue-200 ring-2 ring-blue-50" : "border-slate-200")}>
                        <div className="text-center mb-3">
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider block", d.isToday ? "text-blue-600" : d.dayIndex >= 5 ? "text-amber-600" : "text-slate-400")}>{d.label}</span>
                          <span className="text-xs font-semibold text-slate-700">{d.date}</span>
                          {d.isToday && <span className="block mt-1 text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full inline-block">TODAY</span>}
                        </div>
                        {perDayLocations && (
                          <input type="text" placeholder="Loc" value={d.location} onChange={e => setWeekDayLocation(currentWeekIdx, globalIdx, e.target.value)} className="w-full px-2 py-1.5 mb-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-medium text-center text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-400 transition-all" />
                        )}
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" onClick={() => setWeekDayTarget(currentWeekIdx, globalIdx, d.target - 1)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><Minus className="w-3 h-3" /></button>
                          <input type="number" min={1} value={d.target} onChange={e => setWeekDayTarget(currentWeekIdx, globalIdx, parseInt(e.target.value) || 1)} className="w-10 text-center text-base font-bold text-slate-800 bg-transparent focus:outline-none appearance-none" />
                          <button type="button" onClick={() => setWeekDayTarget(currentWeekIdx, globalIdx, d.target + 1)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Week total */}
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">{currentWeek?.label} Total</span>
                  <span className="text-lg font-bold text-slate-800">{currentWeek?.days.filter(d => d.isActive).reduce((s, d) => s + d.target, 0) || 0} <span className="text-xs font-medium text-slate-400">businesses</span></span>
                </div>

                {/* Month summary */}
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-4 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{monthName} Total</span>
                  <span className="text-2xl font-bold text-blue-600">{monthTotal}</span>
                  <span className="text-xs font-medium text-slate-400 ml-1">businesses</span>
                  <p className="text-[11px] text-slate-400 mt-1">{workingDaysLeft} working days from {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
            )}

            {horizon === 'WEEK' && (
              <div className="pt-2 flex justify-end">
                <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors">
                  <Save className="w-4 h-4" />
                  Set Week Target
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="space-y-3">
        {missionPlans.length > 0 && (
          <Link href="/dashboard/market-mapping/execute" className="flex items-center justify-center gap-3 w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-2xl transition-colors shadow-lg">
            <Rocket className="w-5 h-5" /> Start Work on Your Mission <Navigation className="w-4 h-4" />
          </Link>
        )}
        <Link href="/dashboard/market-mapping/history" className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-sm font-bold rounded-2xl transition-colors">
          <History className="w-4 h-4" /> View Target History
        </Link>
      </div>

      <AnimatePresence>
        {pendingPlan && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setPendingPlan(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[420px] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4"><Target className="w-8 h-8 text-blue-600" /></div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Confirm Your Target</h3>
                <p className="text-sm text-slate-500 mb-6">You are about to set the following mission target:</p>
                <div className="bg-slate-50 rounded-2xl p-5 space-y-3 mb-6 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Period</span>
                    <span className="text-sm font-black text-blue-600">{horizon === 'DAY' ? 'Daily' : horizon === 'WEEK' ? 'Weekly' : 'Monthly'} · {monthName}</span>
                  </div>
                  <div className="border-t border-slate-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Default Location</span>
                    <span className="text-sm font-bold text-slate-900">{pendingPlan.location}</span>
                  </div>
                  <div className="border-t border-slate-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target</span>
                    <span className="text-2xl font-black text-slate-900">{pendingPlan.targetCount} businesses</span>
                  </div>
                  <div className="border-t border-slate-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</span>
                    <span className="text-sm font-bold text-slate-700">{new Date(pendingPlan.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setPendingPlan(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button onClick={confirm} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Confirm Target</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}