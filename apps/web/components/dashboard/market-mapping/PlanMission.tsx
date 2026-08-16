'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Save, MapPin, Target, CheckCircle, Navigation, Rocket, Plus, Minus, History, Lock } from 'lucide-react';
import { MissionPlan } from '@/types/affiliate-market-mapping';
import { cn } from '@/lib/utils';
import { useMarketMapping } from '@/components/dashboard/market-mapping/MarketMappingContext';
import { useMarketMappingConfig } from '@/hooks/use-market-mapping-config';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface PlanMissionProps {
  onAddVisits?: (visits: any[]) => void;
  initialPlan?: MissionPlan | null;
}

interface PendingPlan {
  horizon: 'DAY';
  location: string;
  targetCount: number;
  startDate: string;
  endDate?: string;
  id?: string;
}

const TODAY = new Date();

function toDateInputValue(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function PlanMission({ onAddVisits, initialPlan }: PlanMissionProps) {
  const dayPickerInputRef = useRef<HTMLInputElement>(null);
  const [startDate, setStartDate] = useState<Date>(TODAY);
  const [pendingPlan, setPendingPlan] = useState<PendingPlan | null>(null);

  // Single day state
  const [dayTarget, setDayTarget] = useState(0);
  const [dayLocation, setDayLocation] = useState('');

  const { setPerformance, setStats, missionPlans, addMissionPlan } = useMarketMapping();
  const { data: config } = useMarketMappingConfig();
  const { showToast } = useToast();

  const locationLocked = !!config?.assignment;
  const assignedCluster = config?.assignedCluster || '';
  const targetLocked = !!config?.isTargetLocked;

  // Effective location and target used for saving — admin configuration overrides any typed values when locked.
  const effectiveDayLocation = locationLocked ? assignedCluster : dayLocation;
  const effectiveDayTarget = targetLocked ? (config?.dailyTarget || dayTarget || 5) : dayTarget;

  // DAY plan already saved for the currently selected day
  const selectedDayPlan = useMemo(() => {
    const key = toDateInputValue(startDate);
    return missionPlans.find(p => p.horizon === 'DAY' && (p.startDate || '').slice(0, 10) === key) || null;
  }, [missionPlans, startDate]);

  // Load a saved day mission whenever the selected date changes
  const lastLoadedDayRef = useRef('');
  useEffect(() => {
    const key = toDateInputValue(startDate);
    if (key === lastLoadedDayRef.current) return;
    lastLoadedDayRef.current = key;
    const plan = missionPlans.find(p => p.horizon === 'DAY' && (p.startDate || '').slice(0, 10) === key);
    setDayTarget(targetLocked ? (config?.dailyTarget || 5) : (plan?.targetCount ?? (config?.dailyTarget || 5)));
    setDayLocation(locationLocked ? assignedCluster : (plan?.location ?? ''));
  }, [startDate, missionPlans, locationLocked, assignedCluster, targetLocked, config?.dailyTarget]);

  const handleStartDateChange = useCallback((val: string) => {
    const d = new Date(val + 'T00:00:00');
    if (isNaN(d.getTime())) return;
    setStartDate(d);
  }, []);

  const saveDayOnly = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveDayLocation) { showToast('Set a location for your target day', 'error'); return; }
    if (effectiveDayTarget < 1) { showToast('Set at least 1 business target', 'error'); return; }
    const dayKey = toDateInputValue(startDate);
    const existing = missionPlans.find(p => p.horizon === 'DAY' && (p.startDate || '').slice(0, 10) === dayKey);
    setPendingPlan({
      horizon: 'DAY',
      location: effectiveDayLocation,
      targetCount: effectiveDayTarget,
      startDate: `${dayKey}T00:00:00`,
      endDate: `${dayKey}T23:59:59`,
      id: existing?.id,
    });
  };

  const confirm = () => {
    if (!pendingPlan) return;
    const { horizon: h, location: loc, targetCount: count, id, startDate: pStart, endDate: pEnd } = pendingPlan;
    addMissionPlan({ id, horizon: h, location: loc, targetCount: count, createdAt: new Date().toISOString(), startDate: pStart, endDate: pEnd });

    setPerformance(p => ({ ...p, dailyTarget: count, dailyProgress: 0 }));
    setStats(p => ({ ...p, clusterName: loc }));
    setPendingPlan(null);
    showToast(`Daily target confirmed — ${count} businesses`, 'success');
  };

  const jumpToPlan = useCallback((plan: MissionPlan) => {
    const key = (plan.startDate || plan.createdAt || '').slice(0, 10);
    if (!key) return;
    handleStartDateChange(key);
  }, [handleStartDateChange]);

  const formatPlanDate = (plan: MissionPlan) => {
    const start = plan.startDate ? new Date(plan.startDate) : null;
    if (start && !isNaN(start.getTime())) {
      return start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }
    return new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const savedMissions = useMemo(() => {
    return [...missionPlans].sort((a, b) => {
      const ka = (a.startDate || a.createdAt || '').slice(0, 10);
      const kb = (b.startDate || b.createdAt || '').slice(0, 10);
      return kb.localeCompare(ka);
    });
  }, [missionPlans]);

  // Jump straight to a plan passed in via ?plan=<id> (e.g. from Target History)
  const jumpedPlanRef = useRef<string | null>(null);
  useEffect(() => {
    if (!initialPlan?.id) return;
    if (jumpedPlanRef.current === initialPlan.id) return;
    jumpedPlanRef.current = initialPlan.id;
    jumpToPlan(initialPlan);
  }, [initialPlan, jumpToPlan]);

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-6">
        <div className="p-5">
          <form onSubmit={saveDayOnly} className="space-y-4">
            {locationLocked && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
                <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                <p className="text-xs font-semibold text-blue-700">
                  Assigned cluster — location is managed by admin (<span className="font-black">{assignedCluster}</span>)
                </p>
              </div>
            )}

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
              <p className="text-[10px] text-slate-400 mt-1">Choose any day — past, today, or future — to plan or review.</p>
            </div>

            {/* Location */}
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location
                {locationLocked && <Lock className="w-3 h-3 text-blue-500" />}
              </span>
              <input 
                type="text" 
                placeholder="e.g. Banex Plaza, Wuse" 
                value={effectiveDayLocation} 
                readOnly={locationLocked} 
                onChange={e => setDayLocation(e.target.value)} 
                className={cn("w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all", locationLocked && "opacity-70 cursor-not-allowed")} 
              />
            </div>

            {/* Target */}
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mb-2">
                <Target className="w-3.5 h-3.5 text-slate-400" /> Daily Target
                {targetLocked && <Lock className="w-3 h-3 text-purple-500" />}
              </span>

              {targetLocked ? (
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 mb-3">
                  <Lock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <p className="text-[11px] font-semibold text-purple-700">
                    {config?.targetSource === 'CLUSTER_ASSIGNMENT'
                      ? `Target is set by Admin for ${assignedCluster || 'cluster'} (${effectiveDayTarget} businesses/day). Cannot be edited.`
                      : `Target is set by Admin (${effectiveDayTarget} businesses/day). Cannot be edited.`}
                  </p>
                </div>
              ) : config?.assignment ? (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-3">
                  <Target className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <p className="text-[11px] font-semibold text-blue-700">
                    Assigned to {assignedCluster}. Admin recommended: <strong>{config?.dailyTarget} businesses/day</strong> (You can adjust).
                  </p>
                </div>
              ) : null}

              <div className="flex items-center justify-center gap-3">
                <button 
                  type="button" 
                  disabled={targetLocked}
                  onClick={() => setDayTarget(t => Math.max(1, t - 1))} 
                  className={cn("w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors", targetLocked && "opacity-30 cursor-not-allowed hover:bg-slate-100")}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input 
                  type="number" 
                  min={1} 
                  value={effectiveDayTarget} 
                  readOnly={targetLocked}
                  onChange={e => setDayTarget(Math.max(1, parseInt(e.target.value) || 1))} 
                  className={cn("w-20 text-center text-2xl font-bold text-slate-800 bg-transparent focus:outline-none appearance-none", targetLocked && "cursor-not-allowed opacity-90")} 
                />
                <button 
                  type="button" 
                  disabled={targetLocked}
                  onClick={() => setDayTarget(t => t + 1)} 
                  className={cn("w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors", targetLocked && "opacity-30 cursor-not-allowed hover:bg-slate-100")}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-1">
                {targetLocked ? 'Target quota is managed by Admin.' : 'Set your daily visit target for this day'}
              </p>
            </div>

            {/* Saved mission banner for the selected day */}
            {selectedDayPlan && (
              <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-800">
                    You&apos;ve planned {selectedDayPlan.targetCount} business{selectedDayPlan.targetCount === 1 ? '' : 'es'} at {selectedDayPlan.location}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">for {startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}. Adjust and save to update.</p>
                </div>
              </div>
            )}

            {/* Action button */}
            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              {selectedDayPlan ? 'Update Day Mission' : 'Save Day Mission'}
            </button>
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

      {/* Saved missions — browse every day you've planned */}
      {savedMissions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mt-6">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Saved Missions
          </h3>
          <div className="space-y-2">
            {savedMissions.map(plan => (
              <button 
                key={plan.id || `${plan.horizon}-${plan.startDate}`} 
                type="button" 
                onClick={() => jumpToPlan(plan)} 
                className="w-full flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 hover:border-blue-300 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0 bg-blue-50 text-blue-700">
                    DAY
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">{formatPlanDate(plan)}</p>
                    <p className="text-[10px] text-slate-400 truncate">{plan.location}</p>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-800 shrink-0">{plan.targetCount}<span className="text-[10px] font-medium text-slate-400"> biz</span></span>
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {pendingPlan && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setPendingPlan(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[420px] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden">
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4"><Target className="w-8 h-8 text-blue-600" /></div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Confirm Your Target</h3>
                <p className="text-sm text-slate-500 mb-6">You are about to set the following daily mission target:</p>
                <div className="bg-slate-50 rounded-2xl p-5 space-y-3 mb-6 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Period</span>
                    <span className="text-sm font-black text-blue-600">Daily Mission</span>
                  </div>
                  <div className="border-t border-slate-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Date</span>
                    <span className="text-sm font-bold text-slate-700">{new Date(pendingPlan.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="border-t border-slate-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</span>
                    <span className="text-sm font-bold text-slate-900">{pendingPlan.location}</span>
                  </div>
                  <div className="border-t border-slate-200" />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target</span>
                    <span className="text-2xl font-black text-slate-900">{pendingPlan.targetCount} businesses</span>
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