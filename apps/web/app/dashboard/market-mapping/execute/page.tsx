'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useMarketMapping } from '@/components/dashboard/market-mapping/MarketMappingContext';
import BusinessCaptureDrawer from '@/components/dashboard/market-mapping/BusinessCaptureDrawer';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Navigation, Plus, Target, MapPin, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { MissionHorizon, PlannedVisit } from '@/types/affiliate-market-mapping';

export default function ExecutePage() {
  const { stats, visits, selectedVisit, setSelectedVisit, saveCapture, missionPlans, performance, addVisits } = useMarketMapping();
  const { showToast } = useToast();
  const [horizonFilter, setHorizonFilter] = useState<MissionHorizon>('DAY');

  const dayPlan = missionPlans.find(p => p.horizon === 'DAY');
  const weekPlan = missionPlans.find(p => p.horizon === 'WEEK');

  // Only show tabs for plans that exist
  const availableHorizons = useMemo(() => {
    const horizons: MissionHorizon[] = [];
    if (dayPlan) horizons.push('DAY');
    if (weekPlan) horizons.push('WEEK');
    return horizons;
  }, [dayPlan, weekPlan]);

  // Auto-select first available horizon
  const activeHorizon = availableHorizons.includes(horizonFilter) ? horizonFilter : availableHorizons[0] || 'DAY';
  const activePlan = missionPlans.find(p => p.horizon === activeHorizon);

  const filteredVisits = useMemo(() => {
    return visits.filter(v => v.horizon === activeHorizon);
  }, [visits, activeHorizon]);

  const addedCount = filteredVisits.length;
  const targetCount = activePlan?.targetCount || 20;
  const remaining = Math.max(0, targetCount - addedCount);

  const handleSave = (updatedVisit: any, closeDrawer = true) => {
    saveCapture(updatedVisit);
    if (closeDrawer) setSelectedVisit(null);
    showToast('Business data saved.', 'success');
  };

  const addBusiness = () => {
    const newVisit: PlannedVisit = {
      id: `v-${activeHorizon.toLowerCase()}-${Date.now()}`,
      name: `Business ${addedCount + 1}`,
      category: '',
      status: 'NOT_YET',
      isPlaceholder: true,
      address: activePlan?.location || '',
      horizon: activeHorizon,
    };
    addVisits([newVisit]);
    showToast('Business added', 'success');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Back Navigation */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard/market-mapping" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-emerald-600" />
              Execute Visits
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {activePlan?.location || 'No location set'} · {addedCount} added · {remaining} remaining
            </p>
          </div>
        </div>

        {/* Horizon Filter — only show tabs with plans */}
        {availableHorizons.length > 1 && (
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            {availableHorizons.map(h => (
              <button key={h} onClick={() => setHorizonFilter(h)} className={cn("flex-1 py-2 rounded-lg text-xs font-semibold transition-all text-center", activeHorizon === h ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                {h === 'DAY' ? 'Daily' : 'Weekly'}
              </button>
            ))}
          </div>
        )}

        {/* Target Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{activeHorizon === 'DAY' ? 'Daily' : 'Weekly'} Target</p>
                <p className="text-lg font-bold text-slate-800">{targetCount} businesses</p>
              </div>
            </div>
            {activePlan?.location && (
              <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                <MapPin className="w-3.5 h-3.5" />
                {activePlan.location}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(100, (addedCount / targetCount) * 100)}%` }} />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{addedCount} of {targetCount} added</span>
            <span className={cn("font-semibold", remaining === 0 ? "text-emerald-600" : "text-amber-600")}>
              {remaining === 0 ? 'Target reached!' : `${remaining} remaining`}
            </span>
          </div>
        </div>

        {/* Add Business Button */}
        <button onClick={addBusiness} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors">
          <Plus className="w-4 h-4" />
          Add Business {remaining > 0 && `(${remaining} left)`}
        </button>

        {/* Business List */}
        {filteredVisits.length > 0 ? (
          <div className="space-y-2">
            {filteredVisits.map(visit => (
              <button key={visit.id} onClick={() => setSelectedVisit(visit)} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between hover:border-blue-300 transition-colors text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", visit.isPlaceholder ? "bg-slate-100" : "bg-emerald-50")}>
                    {visit.isPlaceholder ? <Clock className="w-4 h-4 text-slate-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{visit.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{visit.category} · {visit.address || 'No location'}</p>
                  </div>
                </div>
                <div className={cn("text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ml-2", visit.isPlaceholder ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700")}>
                  {visit.isPlaceholder ? 'Placeholder' : 'Added'}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">No businesses yet</p>
            <p className="text-xs text-slate-400">Tap &quot;Add Business&quot; above to start</p>
          </div>
        )}

        {/* Edit Mission */}
        <Link href="/dashboard/market-mapping/plan" className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-sm font-semibold rounded-2xl transition-colors">
          Edit Mission
        </Link>

        {/* Drawer */}
        <BusinessCaptureDrawer visit={selectedVisit} onClose={() => setSelectedVisit(null)} onSave={handleSave} />
      </div>
    </DashboardLayout>
  );
}
