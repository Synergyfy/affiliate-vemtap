'use client';

import { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import {
  Navigation, MapPin, CheckCircle2, Plus, Crown, Star, Target,
  Clock, Phone, ArrowLeft, Edit3, User, Handshake,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PlannedVisit, MissionHorizon, getCompletenessScore } from '@/types/affiliate-market-mapping';
import { useMarketMapping } from '@/components/dashboard/market-mapping/MarketMappingContext';
import BusinessCaptureDrawer from '@/components/dashboard/market-mapping/BusinessCaptureDrawer';
import { useActiveMission } from '@/services/useFieldActivity';
import { useMarketMappingAnchors, usePriorityVisits, usePartnerships } from '@/services/useMarketMappingHooks';
import { FieldBusiness } from '@/types/field-activity';

type ViewMode = 'default' | 'anchors' | 'priority' | 'partnership';

const VIEW_CONFIG: Record<ViewMode, { title: string; subtitle: string; icon: any; color: string; bg: string }> = {
  default: { title: 'Execute Visits', subtitle: 'Your planned mission visits', icon: Navigation, color: 'text-emerald-600', bg: 'bg-emerald-600' },
  anchors: { title: 'Remaining Anchors', subtitle: 'Anchor businesses yet to be contacted', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-600' },
  priority: { title: 'Priority Visits', subtitle: 'High-rated recommended businesses', icon: Star, color: 'text-amber-600', bg: 'bg-amber-600' },
  partnership: { title: 'Partnership Opportunities', subtitle: 'Businesses open to partnership deals', icon: Handshake, color: 'text-blue-600', bg: 'bg-blue-600' },
};

function toPlannedRow(b: FieldBusiness): PlannedVisit {
  const statusMap: Record<string, PlannedVisit['status']> = {
    NOT_YET: 'NOT_YET',
    VISITING: 'CONTACTED',
    VISITED: 'VISITED',
    COMPLETED: 'CUSTOMER',
  };
  return {
    id: b.id,
    name: b.name,
    category: b.category,
    status: statusMap[b.status] || 'NOT_YET',
    isPlaceholder: b.isPlaceholder ?? false,
    address: b.address,
    exactAddress: b.exactAddress,
    phone: b.phone,
    ownerName: b.ownerName,
    contactPosition: b.contactPosition,
    contactEmail: b.contactEmail,
    dailyCustomers: b.dailyCustomers,
    businessSize: b.businessSize,
    visitNotes: b.visitNotes,
    isAnchor: b.isAnchor,
    horizon: 'DAY',
  };
}

// Market mapping API visit → PlannedVisit
function toVisitRow(v: any): PlannedVisit {
  return {
    id: v.id,
    name: v.name,
    category: v.category || '',
    status: v.status || 'NOT_YET',
    isPlaceholder: v.isPlaceholder ?? false,
    address: v.address,
    exactAddress: v.exactAddress,
    phone: v.phone,
    ownerName: v.ownerName,
    contactPosition: v.contactPosition,
    contactEmail: v.contactEmail,
    horizon: v.horizon,
    dailyCustomers: v.dailyCustomers,
    businessSize: v.businessSize,
    openingHours: v.openingHours,
    openingDays: v.openingDays,
    gpsLat: v.gpsLat,
    gpsLng: v.gpsLng,
    gpsAddress: v.gpsAddress,
    nextVisitDate: v.nextVisitDate,
    nextVisitTime: v.nextVisitTime,
    decisionMakerMet: v.decisionMakerMet,
    interested: v.interested,
    demoDone: v.demoDone,
    visitNotes: v.visitNotes,
    isAnchor: v.isAnchor,
  };
}

// Sales Executive Field Activity Page — a full day list of businesses to
// execute: visit, update info or add new businesses.
function SalesExecutiveExecutePage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { data: mission } = useActiveMission();
  const marketMapping = useMarketMapping();

  const [rows, setRows] = useState<PlannedVisit[]>([]);
  const [activeRow, setActiveRow] = useState<PlannedVisit | null>(null);
  const initRef = useRef(false);

  const targetCount = mission?.targetCount || mission?.businesses?.length || 20;
  const completedCount = rows.filter(
    r => !r.isPlaceholder && (r.status === 'VISITED' || r.status === 'CONTACTED' || r.status === 'INTERESTED' || r.status === 'CUSTOMER')
  ).length;
  const remaining = Math.max(0, targetCount - rows.length);
  const percentFilled = targetCount > 0 ? Math.min(100, Math.round((rows.length / targetCount) * 100)) : 0;

  useEffect(() => {
    if (mission && !initRef.current) {
      setRows((mission.businesses ?? [])
        .map(toPlannedRow)
        .filter(b => !b.isPlaceholder)
      );
      initRef.current = true;
    }
  }, [mission]);

  const openAddBusiness = () => {
    const newVisit: PlannedVisit = {
      id: `exec-${Date.now()}`,
      name: `Business ${rows.length + 1}`,
      category: 'Unknown',
      status: 'NOT_YET',
      isPlaceholder: true,
      address: mission?.location || '',
      horizon: 'DAY',
    };
    setActiveRow(newVisit);
  };

  const handleCloseWithoutSave = () => {
    if (activeRow?.isPlaceholder && marketMapping.visits.some(v => v.id === activeRow.id)) {
      marketMapping.setVisits(prev => prev.filter(v => v.id !== activeRow.id));
      marketMapping.setStats(prev => ({ ...prev, plannedToday: Math.max(0, prev.plannedToday - 1) }));
    }
    setActiveRow(null);
  };

  const handleRecordSaved = (updated: PlannedVisit, closeDrawer = true) => {
    const exists = rows.some(p => p.id === updated.id);
    const hasInfo = getCompletenessScore(updated) > 0;

    if (!exists && !hasInfo) {
      if (closeDrawer) setActiveRow(null);
      showToast('Add at least one detail before saving.', 'error');
      return;
    }

    if (exists) {
      marketMapping.saveCapture(updated);
    } else {
      marketMapping.addVisits([updated]);
    }

    setRows(prev =>
      prev.some(p => p.id === updated.id)
        ? prev.map(p => (p.id === updated.id ? updated : p))
        : [...prev, updated]
    );
    if (closeDrawer) {
      setActiveRow(null);
      showToast('Business information saved.', 'success');
    } else {
      setActiveRow(updated);
    }
  };

  const statusBadge = (r: PlannedVisit) => {
    if (r.isPlaceholder) return { text: 'To record', cls: 'bg-slate-100 text-slate-500' };
    switch (r.status) {
      case 'VISITED':
      case 'CUSTOMER': return { text: 'Completed', cls: 'bg-emerald-100 text-emerald-700' };
      case 'INTERESTED':
      case 'CONTACTED': return { text: 'Contacted', cls: 'bg-blue-100 text-blue-700' };
      default: return { text: 'Pending', cls: 'bg-amber-100 text-amber-700' };
    }
  };

  const backHref = user?.role === 'AFFILIATE' || user?.role === 'AGENT'
    ? '/dashboard/sales-work'
    : '/dashboard/market-mapping';

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={backHref} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-slate-900 truncate">
              Field Work
            </h1>
            <p className="text-xs text-slate-500 font-medium truncate">
              {mission?.location || 'Your daily plan'} · {rows.length} of {targetCount} businesses listed
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100 shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            {completedCount} done
          </span>
        </div>

        {/* List progress */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Today's businesses
            </p>
            <p className="text-xs font-bold text-slate-500">
              {rows.length} of {targetCount}
            </p>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${percentFilled}%` }} />
          </div>
          <p className="text-[10px] font-semibold text-slate-400 mt-1.5 text-right">{percentFilled}% of daily target listed</p>
        </div>

        {/* Add Business CTA */}
        <button
          onClick={openAddBusiness}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          {remaining > 0 ? `Add Business (${remaining} left)` : 'Add Business'}
        </button>

        {rows.length === 0 ? (
          /* Placeholder add — no businesses planned yet */
          <div className="bg-white border-2 border-dashed border-blue-200 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">Nothing on today&apos;s list yet</h3>
            <p className="text-sm text-slate-500 mb-5">
              Tap &quot;Add Business&quot; to create a placeholder for your daily plan and record it when you visit.
            </p>
            <button
              onClick={openAddBusiness}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm"
            >
              <Plus className="w-4 h-4" />
              Add your first business
            </button>
          </div>
        ) : (
          /* The day list — every planned business */
          <div className="space-y-2">
            {rows.map((r, idx) => {
              const badge = statusBadge(r);
              const filled = getCompletenessScore(r);
              const totalFields = 19;
              const left = Math.max(0, totalFields - filled);
              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      r.isPlaceholder ? 'bg-slate-100' : r.isAnchor ? 'bg-purple-50' : 'bg-blue-50'
                    )}>
                      {r.isPlaceholder ? (
                        <Clock className="w-5 h-5 text-slate-400" />
                      ) : r.isAnchor ? (
                        <Crown className="w-5 h-5 text-purple-600" />
                      ) : (
                        <MapPin className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-900 truncate">{r.name}</p>
                        {r.isAnchor && (
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {r.category !== 'Unknown' ? r.category : 'Business'} · {r.address || mission?.location || 'No location'}
                      </p>
                    </div>
                    <span className={cn('text-[10px] font-bold px-2 py-1 rounded-full shrink-0', badge.cls)}>
                      {badge.text}
                    </span>
                  </div>

                  {!r.isPlaceholder && (r.ownerName || r.phone || r.exactAddress) && (
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-3 px-0.5 flex-wrap">
                      {r.ownerName && (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" /> {r.ownerName}
                        </span>
                      )}
                      {r.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {r.phone}
                        </span>
                      )}
                      {r.exactAddress && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400" /> {r.exactAddress}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Information
                        </p>
                        <p className="text-[10px] font-bold text-slate-500">
                          {filled}/{totalFields} fields
                        </p>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            filled === totalFields ? 'bg-emerald-500' : filled > 0 ? 'bg-blue-500' : 'bg-slate-300'
                          )}
                          style={{ width: `${(filled / totalFields) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400 mt-1">
                        {left > 0 ? `${left} field${left === 1 ? '' : 's'} left to fill` : 'All fields complete'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveRow(r)}
                    className={cn(
                      'w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2',
                      r.isPlaceholder ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    )}
                  >
                    {r.isPlaceholder ? <Plus className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    {r.isPlaceholder ? 'Add Business Info' : 'Record Visit'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeRow && (
          <BusinessCaptureDrawer
            visit={activeRow}
            onClose={handleCloseWithoutSave}
            onSave={handleRecordSaved}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

// Original Execute Page (for non-SALES_EXECUTIVE users) - preserved unchanged
function ExecutePage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const viewParam = (searchParams.get('view') || 'default') as ViewMode;
  const defaultFrom = user?.role === 'AFFILIATE' || user?.role === 'AGENT'
    ? '/dashboard/sales-work'
    : '/dashboard/market-mapping';
  const fromPage = searchParams.get('from') || defaultFrom;
  const activeView = VIEW_CONFIG[viewParam] ? viewParam : 'default';
  const config = VIEW_CONFIG[activeView];

  const { stats, visits, selectedVisit, setSelectedVisit, saveCapture, missionPlans, performance, addVisits } = useMarketMapping();
  const { data: anchorRows } = useMarketMappingAnchors();
  const { data: priorityRows } = usePriorityVisits();
  const { data: partnershipRows } = usePartnerships();
  const { showToast } = useToast();
  const [horizonFilter, setHorizonFilter] = useState<MissionHorizon>('DAY');

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const dayPlan = missionPlans.find(p => p.horizon === 'DAY' && (p.startDate || '').slice(0, 10) === todayKey);
  const weekPlan = missionPlans.find(p => {
    if (p.horizon !== 'WEEK' || !p.startDate) return false;
    const start = new Date(p.startDate);
    const end = p.endDate ? new Date(p.endDate) : new Date(start.getTime() + 6 * 86400000);
    return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= today && today <= end;
  });

  const availableHorizons = useMemo(() => {
    const horizons: MissionHorizon[] = [];
    if (dayPlan) horizons.push('DAY');
    if (weekPlan) horizons.push('WEEK');
    return horizons;
  }, [dayPlan, weekPlan]);

  const activeHorizon = availableHorizons.includes(horizonFilter) ? horizonFilter : availableHorizons[0] || 'DAY';
  const activePlan = missionPlans.find(p => p.horizon === activeHorizon);

  const contextVisits = useMemo(() => {
    switch (activeView) {
      case 'anchors': return (anchorRows ?? []).map(toVisitRow);
      case 'priority': return (priorityRows ?? []).map(toVisitRow);
      case 'partnership': return (partnershipRows ?? []).map(toVisitRow);
      default: return visits.filter(v => v.horizon === activeHorizon);
    }
  }, [activeView, visits, activeHorizon, anchorRows, priorityRows, partnershipRows]);

  const addedCount = contextVisits.length;
  const targetCount = activeView === 'default' ? (activePlan?.targetCount || 20) : contextVisits.length;
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

  const getVisitIcon = (visit: PlannedVisit) => {
    if (visit.isPlaceholder) return <Clock className="w-4 h-4 text-slate-400" />;
    if (visit.isAnchor) return <Crown className="w-4 h-4 text-purple-600" />;
    if (visit.status === 'VISITED' || visit.status === 'CUSTOMER') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
  };

  const getVisitBg = (visit: PlannedVisit) => {
    if (visit.isPlaceholder) return 'bg-slate-100';
    if (visit.isAnchor) return 'bg-purple-50';
    return 'bg-emerald-50';
  };

  const getVisitBadge = (visit: PlannedVisit) => {
    if (visit.isPlaceholder) return { text: 'Placeholder', cls: 'bg-slate-100 text-slate-500' };
    if (visit.isAnchor) return { text: 'Anchor', cls: 'bg-purple-100 text-purple-700' };
    if (visit.status === 'VISITED') return { text: 'Visited', cls: 'bg-emerald-100 text-emerald-700' };
    if (visit.status === 'INTERESTED') return { text: 'Interested', cls: 'bg-blue-100 text-blue-700' };
    return { text: 'Added', cls: 'bg-emerald-100 text-emerald-700' };
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Link href={fromPage} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <config.icon className={cn('w-5 h-5', config.color)} />
              {config.title}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {activeView === 'default'
                ? `${activePlan?.location || 'No location set'} · ${addedCount} added · ${remaining} remaining`
                : config.subtitle
              }
            </p>
          </div>
        </div>

        {activeView !== 'default' && (
          <div className={cn(
            'rounded-2xl p-4 flex items-center justify-between',
            activeView === 'anchors' && 'bg-purple-50 border border-purple-100',
            activeView === 'priority' && 'bg-amber-50 border border-amber-100',
            activeView === 'partnership' && 'bg-blue-50 border border-blue-100',
          )}>
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.bg, 'bg-opacity-10')}>
                <config.icon className={cn('w-5 h-5', config.color)} />
              </div>
              <div>
                <p className={cn('text-sm font-bold', config.color)}>
                  {activeView === 'anchors' && 'Anchor businesses are high-traffic establishments that can drive network growth.'}
                  {activeView === 'priority' && 'These are AI-recommended businesses rated by opportunity score.'}
                  {activeView === 'partnership' && 'Businesses with potential for cross-promotion and partnership deals.'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{addedCount} businesses in this list</p>
              </div>
            </div>
            <Link href="/dashboard/market-mapping/insights" className={cn('text-xs font-bold px-3 py-1.5 rounded-lg', config.bg, 'text-white')}>
              Back to Insights
            </Link>
          </div>
        )}

        {activeView === 'default' && availableHorizons.length > 1 && (
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            {availableHorizons.map(h => (
              <button key={h} onClick={() => setHorizonFilter(h)} className={cn('flex-1 py-2 rounded-lg text-xs font-semibold transition-all text-center', activeHorizon === h ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                {h === 'DAY' ? 'Daily' : 'Weekly'}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {activeView === 'default' ? `${activeHorizon === 'DAY' ? 'Daily' : 'Weekly'} Target` : config.title}
                </p>
                <p className="text-lg font-black text-slate-800">{targetCount} businesses</p>
              </div>
            </div>
            {activeView === 'default' && activePlan?.location && (
              <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                <MapPin className="w-3.5 h-3.5" />
                {activePlan.location}
              </div>
            )}
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5 mb-3">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(100, (addedCount / targetCount) * 100)}%` }} />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{addedCount} of {targetCount} listed</span>
            <span className={cn('font-semibold', remaining === 0 ? 'text-emerald-600' : 'text-amber-600')}>
              {remaining === 0 ? 'All listed!' : `${remaining} remaining`}
            </span>
          </div>
        </div>

        {activeView === 'default' && (
          <button onClick={addBusiness} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Add Business {remaining > 0 && `(${remaining} left)`}
          </button>
        )}

        {contextVisits.length > 0 ? (
          <div className="space-y-2">
            {contextVisits.map(visit => {
              const badge = getVisitBadge(visit);
              return (
                <button key={visit.id} onClick={() => setSelectedVisit(visit)} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between hover:border-blue-300 transition-colors text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('w-9 h-9 rounded-2xl flex items-center justify-center shrink-0', getVisitBg(visit))}>
                      {getVisitIcon(visit)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{visit.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{visit.category} · {visit.address || 'No location'}</p>
                    </div>
                  </div>
                  <div className={cn('text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ml-2', badge.cls)}>
                    {badge.text}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">No businesses found</p>
            <p className="text-xs text-slate-400">
              {activeView === 'anchors' && 'All anchor businesses have been contacted.'}
              {activeView === 'priority' && 'No priority visits available right now.'}
              {activeView === 'partnership' && 'No partnership opportunities at this time.'}
              {activeView === 'default' && 'Tap "Add Business" above to start'}
            </p>
          </div>
        )}

        {activeView === 'default' && (
          <Link href="/dashboard/market-mapping/plan" className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-sm font-semibold rounded-2xl transition-colors">
            Edit Mission
          </Link>
        )}

        {activeView === 'anchors' && (
          <Link href="/dashboard/market-mapping/plan" className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-2xl transition-colors">
            <Plus className="w-4 h-4" /> Add to Mission Plan
          </Link>
        )}
        {activeView === 'priority' && (
          <Link href="/dashboard/market-mapping/plan" className="flex items-center justify-center gap-2 w-full py-3 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-2xl transition-colors">
            <Plus className="w-4 h-4" /> Add Priority to Mission
          </Link>
        )}
        {activeView === 'partnership' && (
          <Link href="/dashboard/market-mapping/plan" className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl transition-colors">
            <Plus className="w-4 h-4" /> Add Partnership to Mission
          </Link>
        )}

        <BusinessCaptureDrawer visit={selectedVisit} onClose={() => setSelectedVisit(null)} onSave={handleSave} />
      </div>
    </DashboardLayout>
  );
}

function ExecutePageWrapper() {
  return (
    <Suspense fallback={null}>
      <ExecuteRouter />
    </Suspense>
  );
}

// Routes users to the field-activity execution workflow when it is available to
// their role. Special Market Mapping view modes (anchors/priority/partnership)
// always keep the original list-based Execute page.
function ExecuteRouter() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const viewParam = (searchParams.get('view') || 'default') as ViewMode;
  const isFieldRole = user?.role === 'SALES_EXECUTIVE' || user?.role === 'AFFILIATE' || user?.role === 'AGENT';

  if (viewParam !== 'default') {
    return <ExecutePage />;
  }

  if (isFieldRole) {
    return <SalesExecutiveExecutePage />;
  }

  return <ExecutePage />;
}

export default ExecutePageWrapper;