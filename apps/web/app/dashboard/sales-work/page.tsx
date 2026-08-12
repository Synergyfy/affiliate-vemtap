'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  PlayCircle,
  MapPin,
  Briefcase,
  Phone,
  Calendar,
  BarChart3,
  ChevronRight,
  ChevronDown,
  WifiOff,
  Target,
  CalendarPlus,
  Sparkles,
  FileText,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { cn } from '@/lib/utils';
import { useSalesPipeline } from '@/services/useSalesPipeline';
import { useActiveMission, useMissionProgress } from '@/services/useFieldActivity';
import { useMarketMapping } from '@/components/dashboard/market-mapping/MarketMappingContext';
import { useMarketMappingVisits } from '@/services/useMarketMappingHooks';
import { useAffiliateStats } from '@/services/useDashboardHooks';
import LeadDetailView from '@/components/sales/LeadDetailView';
import BusinessCaptureDrawer from '@/components/dashboard/market-mapping/BusinessCaptureDrawer';
import { SalesPipelineEntry } from '@/types/sales-pipeline';
import { PlannedVisit } from '@/types/affiliate-market-mapping';

export default function SalesWorkPage() {
  const router = useRouter();
  const { missionPlans, stats, selectedVisit, setSelectedVisit, saveCapture } = useMarketMapping();
  const { data: rawVisits = [] } = useMarketMappingVisits();
  const { data: pipelineData } = useSalesPipeline();
  const { data: mission } = useActiveMission();
  const { data: missionProgress } = useMissionProgress(mission?.id);
  const { data: affiliateStats } = useAffiliateStats();

  const [selectedLead, setSelectedLead] = useState<SalesPipelineEntry | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  const allLeads: SalesPipelineEntry[] = pipelineData?.data || [];

  const todayIso = new Date().toISOString().slice(0, 10);

  const businessesToVisit = useMemo(() => {
    const existingNames = new Set<string>();
    const items: Array<{
      id: string;
      name: string;
      subtitle: string;
      type: 'visit' | 'lead';
      visit?: PlannedVisit;
      lead?: SalesPipelineEntry;
    }> = [];

    // Primary source: visits from GET /market-mapping/visits
    // Show NOT_YET visits created today, or any visit whose nextVisitDate is today
    rawVisits
      .filter((v) => {
        const createdKey = v.createdAt ? String(v.createdAt).slice(0, 10) : '';
        const nextKey = v.nextVisitDate ? String(v.nextVisitDate).slice(0, 10) : '';
        const createdToday = createdKey === todayIso;
        const nextVisitToday = nextKey === todayIso;

        if (v.status === 'NOT_YET') return createdToday || nextVisitToday;
        if (v.status === 'VISITED') return createdToday || nextVisitToday;
        return false;
      })
      .forEach((visit) => {
        const nameKey = visit.name.trim().toLowerCase();
        existingNames.add(nameKey);
        items.push({
          id: visit.id,
          name: visit.name,
          subtitle: visit.address || visit.exactAddress || visit.category || 'Market Mapping',
          type: 'visit',
          visit,
        });
      });

    // Secondary source: pipeline leads (NEW_LEAD / VISITED) not already listed
    allLeads
      .filter((l) => l.pipelineStage === 'NEW_LEAD' || l.pipelineStage === 'VISITED')
      .forEach((lead) => {
        const nameKey = lead.businessName.trim().toLowerCase();
        if (!existingNames.has(nameKey)) {
          existingNames.add(nameKey);
          items.push({
            id: lead.id,
            name: lead.businessName,
            subtitle: lead.location || lead.industry || 'Lead',
            type: 'lead',
            lead,
          });
        }
      });

    return items;
  }, [rawVisits, allLeads, todayIso]);

  const getLocalDateKey = (dateStr?: string | Date) => {
    if (!dateStr) return '';
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const today = new Date();
  const todayKey = getLocalDateKey(today);
  const dayPlan = missionPlans.find(p => p.horizon === 'DAY' && getLocalDateKey(p.startDate || p.createdAt) === todayKey);
  const weekPlan = missionPlans.find(p => {
    if (p.horizon !== 'WEEK' || !p.startDate) return false;
    const start = new Date(p.startDate);
    const end = p.endDate ? new Date(p.endDate) : new Date(start.getTime() + 6 * 86400000);
    return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= today && today <= end;
  });
  const activePlan = dayPlan || weekPlan;

  const targetCount = dayPlan?.targetCount || weekPlan?.targetCount || stats.plannedToday || mission?.targetCount || 20;
  const activeLocation = activePlan?.location || stats.clusterName || mission?.location || '';

  // Daily Mission progress: how many businesses the user ADDED today (from DB)
  const visitedCount = affiliateStats?.todayBusinessesAdded ?? 0;
  const percentDone = targetCount > 0 ? Math.min(100, Math.round((visitedCount / targetCount) * 100)) : 0;

  // Today's Progress: all sourced from the DB via affiliateStats
  const todayStats = useMemo(() => {
    if (affiliateStats) {
      return {
        visitsToday: affiliateStats.todayVisitsCount ?? 0,
        leadsCaptured: affiliateStats.todayBusinessesAdded ?? 0,
        followUpsDue: affiliateStats.todayFollowUpsDue ?? 0,
        demosDue: affiliateStats.todayDemosDue ?? 0,
        conversions: affiliateStats.todayConversions ?? 0,
      };
    }
    // Fallback to client-side computation while stats are loading
    const todayStr = new Date().toLocaleDateString('en-CA');
    const todayLeads = allLeads.filter((l) => l.createdAt?.startsWith(todayStr.slice(0, 10)));
    const todayVisits = rawVisits.filter((v: any) => {
      const createdKey = v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-CA') : '';
      return createdKey === todayStr;
    });
    return {
      visitsToday: todayVisits.filter((v: any) => v.status !== 'NOT_YET').length,
      leadsCaptured: todayLeads.length + todayVisits.length,
      followUpsDue: allLeads.filter((l) => l.pipelineStage === 'FOLLOW_UP').length,
      demosDue: allLeads.filter((l) => l.pipelineStage === 'DEMO').length,
      conversions: 0,
    };
  }, [affiliateStats, allLeads, rawVisits]);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLeadUpdated = () => setSelectedLead(null);

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-3 pb-10">
        {/* Header */}
        <div className="sticky top-0 z-20 -mx-4 px-4 pt-3 pb-2 bg-slate-50/95 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-700 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-slate-900 leading-tight">My Sales Work</h1>
              <p className="text-[11px] text-slate-500">
                Record and track today's business visits
              </p>
            </div>
            {isOffline && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> Offline
              </span>
            )}
          </div>
        </div>

        {/* Step 1 · Plan Mission — collapsible */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <button
            type="button"
            onClick={() => setPlanOpen(!planOpen)}
            className="w-full flex items-center gap-3 p-3.5 text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CalendarPlus className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">Plan Your Day</p>
              <p className="text-sm font-semibold text-slate-900 truncate">
                {activePlan || mission ? `${targetCount} businesses planned` : 'Mission not set yet'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {activeLocation || 'Tap to set your location and targets'}
              </p>
            </div>
            <Link
              href="/dashboard/market-mapping/plan"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[11px] font-semibold transition-all"
            >
              {activePlan || mission ? 'Edit' : 'Plan'}
            </Link>
            <ChevronDown className={cn('w-4 h-4 text-slate-400 shrink-0 transition-transform', planOpen && 'rotate-180')} />
          </button>

          <AnimatePresence initial={false}>
            {planOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <div className="px-3.5 pb-3.5 border-t border-slate-100 pt-3 space-y-3">
                  {activePlan || mission ? (
                    <>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{activeLocation || 'Assigned Location'}</span>
                        <span className="ml-auto shrink-0 font-semibold text-slate-800">
                          {visitedCount}/{targetCount}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${percentDone}%` }}
                        />
                      </div>
                      {mission?.businesses && mission.businesses.length > 0 && (
                        <div className="bg-slate-50 rounded-lg px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Next business</p>
                          <p className="text-sm font-semibold text-slate-800 truncate">
                            {mission.businesses[0].name}
                          </p>
                        </div>
                      )}
                      <Link
                        href="/dashboard/market-mapping/plan"
                        className="flex items-center justify-center w-full py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
                      >
                        Edit Mission Plan
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Set a location and daily business target so you can execute bookings and visits today.
                      </p>
                      <Link
                        href="/dashboard/market-mapping/plan"
                        className="flex items-center justify-center w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                      >
                        Set up your mission
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Step 2 · Field Work — action below content */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-3.5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <PlayCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Field Work</p>
                <h3 className="text-sm font-semibold text-slate-900 truncate">Record Businesses</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {activePlan || mission ? 'Open the field and record each visit' : 'Plan a mission first'}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/market-mapping/execute"
              className={cn(
                'flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-white text-xs font-semibold transition-all active:scale-[0.99]',
                activePlan || mission ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 pointer-events-none'
              )}
            >
              {activePlan || mission ? 'Go to Field Work' : 'Plan your mission first'}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/dashboard/market-mapping/pipeline?create=1"
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-all active:scale-[0.99]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New Business
            </Link>
          </div>
        </motion.div>

        {/* Today's Mission */}
        {(activePlan || mission) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Today&apos;s Mission</p>
                <h3 className="text-sm font-semibold text-slate-900 truncate">
                  {activePlan ? `${activePlan.horizon === 'DAY' ? 'Daily' : 'Weekly'} Mission` : (mission?.name || 'Daily Mission')}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {activeLocation || mission?.location}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-slate-500">Progress</span>
              <span className="font-semibold text-slate-800">
                {visitedCount} / {targetCount}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${percentDone}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2.5 text-[11px]">
              <span className="text-slate-500">{Math.max(0, targetCount - visitedCount)} remaining</span>
            </div>
          </motion.div>
        )}

        {/* Today's Progress */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Today&apos;s Progress</h3>
            <span className="text-[10px] text-slate-400">
              {new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: todayStats.visitsToday, label: 'Visits', class: 'text-slate-900' },
              { value: todayStats.leadsCaptured, label: 'Leads', class: 'text-slate-900' },
              { value: todayStats.followUpsDue, label: 'Follow-ups', class: 'text-orange-600' },
              { value: todayStats.demosDue, label: 'Demos', class: 'text-indigo-600' },
            ].map((s) => (
              <div key={s.label} className="bg-slate-50 rounded-lg p-2.5 text-center">
                <p className={cn('text-lg font-bold leading-none', s.class)}>{s.value}</p>
                <p className="text-[9px] font-medium text-slate-500 mt-1 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Conversions</span>
            <span className="text-sm font-bold text-amber-700">{todayStats.conversions}</span>
          </div>
        </motion.div>

        {/* Businesses to Visit */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.09 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5"
        >
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Businesses to Visit</h3>
            <span className="text-[10px] font-semibold text-slate-500">
              {businessesToVisit.length} pending
            </span>
          </div>
          <div className="space-y-1.5">
            {businessesToVisit
              .slice(0, 5)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.type === 'lead' && item.lead) {
                      setSelectedLead(item.lead);
                    } else if (item.type === 'visit' && item.visit) {
                      setSelectedVisit(item.visit);
                    }
                  }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              ))}
            {businessesToVisit.length === 0 && (
              <div className="text-center py-4">
                <p className="text-[11px] text-slate-400">No businesses to visit right now</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Follow-ups Due */}
        {todayStats.followUpsDue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.11 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5"
          >
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Follow-ups Due</h3>
              <span className="text-[10px] font-bold text-orange-600">{todayStats.followUpsDue}</span>
            </div>
            <div className="space-y-1.5">
              {allLeads
                .filter((l) => l.pipelineStage === 'FOLLOW_UP')
                .slice(0, 5)
                .map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900 truncate">{lead.businessName}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                ))}
            </div>
          </motion.div>
        )}

        {/* Demos Due */}
        {todayStats.demosDue > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.13 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5"
          >
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Demos Due</h3>
              <span className="text-[10px] font-bold text-indigo-600">{todayStats.demosDue}</span>
            </div>
            <div className="space-y-1.5">
              {allLeads
                .filter((l) => l.pipelineStage === 'DEMO')
                .slice(0, 5)
                .map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-900 truncate">{lead.businessName}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {lead.demoScheduledDate ? new Date(lead.demoScheduledDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Today'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm p-3.5"
        >
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Market &amp; Pipeline</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { href: '/dashboard/market-mapping/pipeline', label: 'Pipeline', icon: BarChart3, cls: 'bg-blue-50 hover:bg-blue-100 text-blue-600' },
              { href: '/dashboard/sales/follow-ups', label: 'Follow-ups', icon: Phone, cls: 'bg-orange-50 hover:bg-orange-100 text-orange-600' },
              { href: '/dashboard/market-mapping/insights', label: 'Insights', icon: Sparkles, cls: 'bg-purple-50 hover:bg-purple-100 text-purple-600' },
              { href: '/dashboard/market-mapping/insights/reports', label: 'Reports', icon: FileText, cls: 'bg-rose-50 hover:bg-rose-100 text-rose-600' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', item.cls)}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold text-slate-600">{item.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Lead Detail Drawer */}
        {selectedLead && (
          <LeadDetailView
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdated={handleLeadUpdated}
          />
        )}

        {/* Business Capture Drawer */}
        {selectedVisit && (
          <BusinessCaptureDrawer
            visit={selectedVisit}
            onClose={() => setSelectedVisit(null)}
            onSave={(updatedVisit) => {
              saveCapture(updatedVisit);
              setSelectedVisit(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}