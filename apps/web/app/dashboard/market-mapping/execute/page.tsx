'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useMarketMapping } from '@/components/dashboard/market-mapping/MarketMappingContext';
import BusinessCaptureDrawer from '@/components/dashboard/market-mapping/BusinessCaptureDrawer';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Navigation, Plus, Target, MapPin, CheckCircle2, Clock, Crown, Star, Handshake, ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MissionHorizon, PlannedVisit } from '@/types/affiliate-market-mapping';
import { mockAnchorBusinesses, mockPriorityVisits, mockPartnershipVisits } from '@/lib/affiliate-mock';

type ViewMode = 'default' | 'anchors' | 'priority' | 'partnership';

const VIEW_CONFIG: Record<ViewMode, { title: string; subtitle: string; icon: any; color: string; bg: string }> = {
  default: { title: 'Execute Visits', subtitle: 'Your planned mission visits', icon: Navigation, color: 'text-emerald-600', bg: 'bg-emerald-600' },
  anchors: { title: 'Remaining Anchors', subtitle: 'Anchor businesses yet to be contacted', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-600' },
  priority: { title: 'Priority Visits', subtitle: 'High-rated recommended businesses', icon: Star, color: 'text-amber-600', bg: 'bg-amber-600' },
  partnership: { title: 'Partnership Opportunities', subtitle: 'Businesses open to partnership deals', icon: Handshake, color: 'text-blue-600', bg: 'bg-blue-600' },
};

export default function ExecutePageWrapper() {
  return (
    <Suspense>
      <ExecutePage />
    </Suspense>
  );
}

function ExecutePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewParam = (searchParams.get('view') || 'default') as ViewMode;
  const fromPage = searchParams.get('from') || '/dashboard/market-mapping';
  const activeView = VIEW_CONFIG[viewParam] ? viewParam : 'default';
  const config = VIEW_CONFIG[activeView];

  const { stats, visits, selectedVisit, setSelectedVisit, saveCapture, missionPlans, performance, addVisits } = useMarketMapping();
  const { showToast } = useToast();
  const [horizonFilter, setHorizonFilter] = useState<MissionHorizon>('DAY');

  const dayPlan = missionPlans.find(p => p.horizon === 'DAY');
  const weekPlan = missionPlans.find(p => p.horizon === 'WEEK');

  const availableHorizons = useMemo(() => {
    const horizons: MissionHorizon[] = [];
    if (dayPlan) horizons.push('DAY');
    if (weekPlan) horizons.push('WEEK');
    return horizons;
  }, [dayPlan, weekPlan]);

  const activeHorizon = availableHorizons.includes(horizonFilter) ? horizonFilter : availableHorizons[0] || 'DAY';
  const activePlan = missionPlans.find(p => p.horizon === activeHorizon);

  // Context-aware visit list
  const contextVisits = useMemo(() => {
    switch (activeView) {
      case 'anchors': return mockAnchorBusinesses;
      case 'priority': return mockPriorityVisits;
      case 'partnership': return mockPartnershipVisits;
      default: return visits.filter(v => v.horizon === activeHorizon);
    }
  }, [activeView, visits, activeHorizon]);

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
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Back Navigation */}
        <div className="flex items-center gap-3">
          <Link href={fromPage} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <config.icon className={cn("w-5 h-5", config.color)} />
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

        {/* Context Banner */}
        {activeView !== 'default' && (
          <div className={cn(
            "rounded-2xl p-4 flex items-center justify-between",
            activeView === 'anchors' && "bg-purple-50 border border-purple-100",
            activeView === 'priority' && "bg-amber-50 border border-amber-100",
            activeView === 'partnership' && "bg-blue-50 border border-blue-100",
          )}>
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.bg, "bg-opacity-10")}>
                <config.icon className={cn("w-5 h-5", config.color)} />
              </div>
              <div>
                <p className={cn("text-sm font-bold", config.color)}>
                  {activeView === 'anchors' && 'Anchor businesses are high-traffic establishments that can drive network growth.'}
                  {activeView === 'priority' && 'These are AI-recommended businesses rated by opportunity score.'}
                  {activeView === 'partnership' && 'Businesses with potential for cross-promotion and partnership deals.'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{addedCount} businesses in this list</p>
              </div>
            </div>
            <Link href="/dashboard/market-mapping/insights" className={cn("text-xs font-bold px-3 py-1.5 rounded-lg", config.bg, "text-white")}>
              Back to Insights
            </Link>
          </div>
        )}

        {/* Horizon Filter — only show in default view with multiple plans */}
        {activeView === 'default' && availableHorizons.length > 1 && (
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
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {activeView === 'default' ? `${activeHorizon === 'DAY' ? 'Daily' : 'Weekly'} Target` : config.title}
                </p>
                <p className="text-lg font-bold text-slate-800">{targetCount} businesses</p>
              </div>
            </div>
            {activeView === 'default' && activePlan?.location && (
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
            <span className="text-slate-500 font-medium">{addedCount} of {targetCount} listed</span>
            <span className={cn("font-semibold", remaining === 0 ? "text-emerald-600" : "text-amber-600")}>
              {remaining === 0 ? 'All listed!' : `${remaining} remaining`}
            </span>
          </div>
        </div>

        {/* Add Business Button — only in default view */}
        {activeView === 'default' && (
          <button onClick={addBusiness} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />
            Add Business {remaining > 0 && `(${remaining} left)`}
          </button>
        )}

        {/* Visit List */}
        {contextVisits.length > 0 ? (
          <div className="space-y-2">
            {contextVisits.map(visit => {
              const badge = getVisitBadge(visit);
              return (
                <button key={visit.id} onClick={() => setSelectedVisit(visit)} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center justify-between hover:border-blue-300 transition-colors text-left">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", getVisitBg(visit))}>
                      {getVisitIcon(visit)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{visit.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{visit.category} · {visit.address || 'No location'}</p>
                    </div>
                  </div>
                  <div className={cn("text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ml-2", badge.cls)}>
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

        {/* Edit Mission — only in default view */}
        {activeView === 'default' && (
          <Link href="/dashboard/market-mapping/plan" className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-sm font-semibold rounded-2xl transition-colors">
            Edit Mission
          </Link>
        )}

        {/* Context-specific action buttons */}
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

        {/* Drawer */}
        <BusinessCaptureDrawer visit={selectedVisit} onClose={() => setSelectedVisit(null)} onSave={handleSave} />
      </div>
    </DashboardLayout>
  );
}
