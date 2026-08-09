'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useMarketMapping } from '@/components/dashboard/market-mapping/MarketMappingContext';
import PipelineView from '@/components/dashboard/market-mapping/PipelineView';
import BusinessCaptureDrawer from '@/components/dashboard/market-mapping/BusinessCaptureDrawer';
import { ArrowLeft, Navigation, LayoutGrid, Table, MapPin, Clock, CheckCircle2, Plus, Target, TrendingUp, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PlannedVisit } from '@/types/affiliate-market-mapping';
import { useToast } from '@/hooks/use-toast';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  NOT_YET: { label: 'To Visit', color: 'text-slate-600', bg: 'bg-slate-100' },
  VISITED: { label: 'Visited', color: 'text-blue-600', bg: 'bg-blue-100' },
  CONTACTED: { label: 'Contacted', color: 'text-purple-600', bg: 'bg-purple-100' },
  INTERESTED: { label: 'Interested', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  NOT_INTERESTED: { label: 'Not Interested', color: 'text-red-600', bg: 'bg-red-100' },
  CUSTOMER: { label: 'Customer', color: 'text-amber-600', bg: 'bg-amber-100' },
};

const SUMMARY_STYLE = [
  { key: 'NOT_YET', label: 'To Visit', icon: Clock, color: 'text-white', bg: 'bg-slate-600/70' },
  { key: 'VISITED', label: 'Visited', icon: MapPin, color: 'text-white', bg: 'bg-blue-500/70' },
  { key: 'CONTACTED', label: 'Contacted', icon: TrendingUp, color: 'text-white', bg: 'bg-purple-500/70' },
  { key: 'INTERESTED', label: 'Interested', icon: UserCheck, color: 'text-white', bg: 'bg-emerald-500/70' },
  { key: 'CUSTOMER', label: 'Customers', icon: CheckCircle2, color: 'text-white', bg: 'bg-amber-500/70' },
  { key: 'NOT_INTERESTED', label: 'Declined', icon: Clock, color: 'text-white', bg: 'bg-red-500/70' },
];

export default function PipelinePage() {
  const { visits, setSelectedVisit, selectedVisit, saveCapture, addVisits, missionPlans } = useMarketMapping();
  const { showToast } = useToast();
  const [horizonFilter, setHorizonFilter] = useState<'ALL' | 'DAY' | 'WEEK'>('ALL');
  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('pipeline');
  const [autoOpenCreate, setAutoOpenCreate] = useState(false);

  const activePlan = missionPlans[missionPlans.length - 1];

  useEffect(() => {
    if (window.location.search.includes('create=1')) {
      setAutoOpenCreate(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const filteredVisits = useMemo(() => {
    if (horizonFilter === 'ALL') return visits;
    return visits.filter(v => v.horizon === horizonFilter);
  }, [visits, horizonFilter]);

  const summary = useMemo(() => {
    const total = filteredVisits.length;
    const counts: Record<string, number> = {};
    filteredVisits.forEach(v => {
      counts[v.status] = (counts[v.status] || 0) + 1;
    });
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    return {
      total,
      counts,
      pct,
      interested: (counts.INTERESTED || 0) + (counts.CUSTOMER || 0),
      interestedPct: total > 0 ? Math.round(((counts.INTERESTED || 0) + (counts.CUSTOMER || 0)) / total * 100) : 0,
      customerPct: pct(counts.CUSTOMER || 0),
      pipelineHealth: pct((counts.INTERESTED || 0) + (counts.CUSTOMER || 0) + (counts.CONTACTED || 0)),
    };
  }, [filteredVisits]);

  useEffect(() => {
    if (autoOpenCreate) {
      const created = createNewBusiness();
      if (created) setSelectedVisit(created);
      setAutoOpenCreate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenCreate]);

  const createNewBusiness = (): PlannedVisit | null => {
    const target = summary.total + 1;
    const newVisit: PlannedVisit = {
      id: `biz-${Date.now()}`,
      name: `Business ${target}`,
      category: '',
      status: 'NOT_YET',
      isPlaceholder: true,
      address: activePlan?.location || '',
      horizon: horizonFilter === 'ALL' ? 'DAY' : horizonFilter,
    };
    addVisits([newVisit]);
    showToast('New business added — fill in what you know now, or save and complete after your meeting.', 'success');
    return newVisit;
  };

  const handleAddBusiness = () => {
    const created = createNewBusiness();
    setSelectedVisit(created);
  };

  const handleSave = (updatedVisit: any) => {
    saveCapture(updatedVisit);
    setSelectedVisit(null);
    showToast('Business data saved.', 'success');
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/dashboard/market-mapping" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-indigo-600" />
              Sales Pipeline
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              All businesses captured from Execute Visits
            </p>
          </div>
          <button
            onClick={handleAddBusiness}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white text-xs font-black rounded-xl shadow-lg shadow-blue-200/50"
          >
            <Plus className="w-4 h-4" />
            Add New Business
          </button>
        </div>

        {/* Summary — everything at a glance, in % */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-3xl p-5 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 blur-[70px] rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-xs font-black uppercase tracking-widest text-white/70">Pipeline Summary</h2>
              <span className="text-[10px] font-bold text-white/60 bg-white/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Target className="w-3 h-3" /> {summary.total} businesses
              </span>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {SUMMARY_STYLE.map(item => {
                const count = summary.counts[item.key] || 0;
                const pct = summary.pct(count);
                return (
                  <div key={item.key} className={cn("rounded-2xl p-3 text-center", item.bg, item.color)}>
                    <item.icon className="w-4 h-4 mx-auto mb-1" />
                    <p className="text-lg font-black leading-none">{count}</p>
                    <p className="text-[10px] font-bold mt-1 uppercase tracking-wide">{item.label}</p>
                    <p className="text-[10px] font-black opacity-70 mt-0.5">{pct}%</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Pipeline Health</span>
                  <span className="text-sm font-black">{summary.pipelineHealth}%</span>
                </div>
                <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${summary.pipelineHealth}%` }} />
                </div>
                <p className="text-[10px] text-white/60 mt-1.5">Contacted + Interested + Customers</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Profile + GPS completed</span>
                  <span className="text-sm font-black">{summary.customerPct}%</span>
                </div>
                <p className="text-[10px] text-white/60">Tracked via business information &amp; location</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls — responsive, no overlap */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl flex-1 min-w-[220px]">
            {(['ALL', 'DAY', 'WEEK'] as const).map(h => (
              <button
                key={h}
                onClick={() => setHorizonFilter(h)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-xs font-semibold transition-all text-center whitespace-nowrap",
                  horizonFilter === h ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {h === 'ALL' ? 'All' : h === 'DAY' ? 'Daily' : 'Weekly'}
              </button>
            ))}
          </div>

          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setViewMode('pipeline')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'pipeline' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
              aria-label="Pipeline view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'table' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
              aria-label="Table view"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'pipeline' ? (
          <PipelineView
            visits={filteredVisits}
            onSelectVisit={(visit) => setSelectedVisit(visit)}
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {filteredVisits.length > 0 ? (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Business</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredVisits.map(visit => {
                        const st = statusConfig[visit.status] || statusConfig.NOT_YET;
                        return (
                          <tr
                            key={visit.id}
                            onClick={() => setSelectedVisit(visit)}
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", visit.isPlaceholder ? "bg-slate-100" : "bg-emerald-50")}>
                                  {visit.isPlaceholder ? <Clock className="w-4 h-4 text-slate-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                                </div>
                                <span className="text-sm font-semibold text-slate-800 truncate max-w-[160px]">{visit.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">{visit.category || '—'}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[120px]">{visit.address || '—'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold", st.bg, st.color)}>
                                {st.label}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", visit.isPlaceholder ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700")}>
                                {visit.isPlaceholder ? 'Placeholder' : 'Added'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden divide-y divide-slate-100">
                  {filteredVisits.map(visit => {
                    const st = statusConfig[visit.status] || statusConfig.NOT_YET;
                    return (
                      <button
                        key={visit.id}
                        onClick={() => setSelectedVisit(visit)}
                        className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", visit.isPlaceholder ? "bg-slate-100" : "bg-emerald-50")}>
                            {visit.isPlaceholder ? <Clock className="w-4 h-4 text-slate-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{visit.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">{visit.category || '—'} · {visit.address || 'No location'}</p>
                          </div>
                        </div>
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ml-2", st.bg, st.color)}>
                          {st.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <p className="text-sm font-semibold text-slate-600">No businesses yet</p>
                <p className="text-xs text-slate-400 mt-1">Add businesses in Execute Visits or tap "Add New Business" above.</p>
              </div>
            )}
          </div>
        )}

        {/* Drawer */}
        <BusinessCaptureDrawer
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onSave={handleSave}
        />
      </div>
    </DashboardLayout>
  );
}