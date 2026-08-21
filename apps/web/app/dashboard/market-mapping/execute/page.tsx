'use client';

import { Suspense, useState, useEffect, useRef, useMemo } from 'react';
import {
  Navigation, MapPin, CheckCircle2, Plus, Crown, Star, Target,
  Clock, Phone, ArrowLeft, Edit3, User, Handshake, Calendar,
  ChevronLeft, ChevronRight, ArrowUpDown
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PlannedVisit, MissionHorizon, getCompletenessScore } from '@/types/affiliate-market-mapping';
import { useMarketMapping } from '@/components/dashboard/market-mapping/MarketMappingContext';
import { useActiveMission } from '@/services/useFieldActivity';
import { useMarketMappingAnchors, usePriorityVisits, usePartnerships } from '@/services/useMarketMappingHooks';
import { FieldBusiness } from '@/types/field-activity';

type ViewMode = 'default' | 'anchors' | 'priority' | 'partnership';
type SortOrder = 'newest' | 'earliest';

interface DateGroup {
  dateKey: string;
  label: string;
  subLabel: string;
  isToday: boolean;
  isYesterday: boolean;
  items: PlannedVisit[];
  completedCount: number;
}

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
    name: v.name || v.businessName || '',
    category: v.category || v.industry || '',
    status: v.status || 'NOT_YET',
    isPlaceholder: v.isPlaceholder ?? false,
    address: v.address || v.businessAddress,
    exactAddress: v.exactAddress || v.location,
    phone: v.phone,
    ownerName: v.ownerName || v.contactName,
    contactPosition: v.contactPosition || v.contactRole,
    contactEmail: v.contactEmail || v.email,
    horizon: v.horizon,
    createdAt: v.createdAt,
    visitedAt: v.visitedAt,
    updatedAt: v.updatedAt,
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
    visitNotes: v.visitNotes || v.comments,
    isAnchor: v.isAnchor,
  };
}

function getLocalDateKey(dateStr?: string | Date): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function groupVisitsByDate(
  visits: PlannedVisit[],
  todayKey: string,
  yesterdayKey: string,
  sortOrder: SortOrder = 'newest'
): DateGroup[] {
  const map = new Map<string, PlannedVisit[]>();

  visits.forEach((v) => {
    const key = getLocalDateKey(v.createdAt) || todayKey;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(v);
  });

  const keys = Array.from(map.keys());
  // Sort keys: newest first (Today -> Yesterday -> older) vs earliest first
  keys.sort((a, b) => (sortOrder === 'newest' ? b.localeCompare(a) : a.localeCompare(b)));

  return keys.map((key) => {
    const items = map.get(key) || [];
    const isToday = key === todayKey;
    const isYesterday = key === yesterdayKey;

    let label = key;
    let subLabel = '';
    const parts = key.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      if (!isNaN(d.getTime())) {
        const fullFormatted = d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
        if (isToday) {
          label = 'Today';
          subLabel = fullFormatted;
        } else if (isYesterday) {
          label = 'Yesterday';
          subLabel = fullFormatted;
        } else {
          label = fullFormatted;
        }
      }
    }

    const completedCount = items.filter(
      (r) =>
        !r.isPlaceholder &&
        (r.status === 'VISITED' ||
          r.status === 'CONTACTED' ||
          r.status === 'INTERESTED' ||
          r.status === 'CUSTOMER')
    ).length;

    return {
      dateKey: key,
      label,
      subLabel,
      isToday,
      isYesterday,
      items,
      completedCount,
    };
  });
}

function BusinessCard({
  visit,
  onOpenCapture,
  activeLocation,
}: {
  visit: PlannedVisit;
  onOpenCapture: (v: PlannedVisit) => void;
  activeLocation?: string;
}) {
  const badge = (() => {
    if (visit.isPlaceholder) return { text: 'To record', cls: 'bg-slate-100 text-slate-600 border border-slate-200' };
    switch (visit.status) {
      case 'VISITED':
      case 'CUSTOMER':
        return { text: 'Completed', cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' };
      case 'INTERESTED':
      case 'CONTACTED':
        return { text: 'Contacted', cls: 'bg-blue-50 text-blue-700 border border-blue-200' };
      default:
        return { text: 'Pending', cls: 'bg-amber-50 text-amber-700 border border-amber-200' };
    }
  })();

  const filled = getCompletenessScore(visit);
  const totalFields = 19;
  const left = Math.max(0, totalFields - filled);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-sm hover:border-blue-300 transition-all">
      {/* Top row: Icon + Name + Star + Status Badge */}
      <div className="flex items-start sm:items-center gap-3 mb-2.5">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0',
            visit.isPlaceholder ? 'bg-slate-100' : visit.isAnchor ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
          )}
        >
          {visit.isPlaceholder ? (
            <Clock className="w-5 h-5 text-slate-400" />
          ) : visit.isAnchor ? (
            <Crown className="w-5 h-5 text-purple-600" />
          ) : (
            <MapPin className="w-5 h-5 text-blue-600" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-black text-slate-900 truncate">{visit.name}</p>
            {visit.isAnchor && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Anchor
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 truncate mt-0.5">
            {visit.category && visit.category !== 'Unknown' ? visit.category : 'Business'} ·{' '}
            {visit.address || activeLocation || 'No location set'}
          </p>
        </div>

        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', badge.cls)}>
          {badge.text}
        </span>
      </div>

      {/* Meta tags (Owner, Phone, Address, GPS) */}
      {!visit.isPlaceholder &&
        (visit.ownerName || visit.phone || visit.exactAddress || (visit.gpsLat && visit.gpsLng)) && (
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-3 px-0.5 flex-wrap">
            {visit.ownerName && (
              <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg max-w-[140px] truncate">
                <User className="w-3 h-3 text-slate-400 shrink-0" /> <span className="truncate">{visit.ownerName}</span>
              </span>
            )}
            {visit.phone && (
              <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" /> {visit.phone}
              </span>
            )}
            {visit.exactAddress && (
              <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg max-w-[180px] truncate">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> <span className="truncate">{visit.exactAddress}</span>
              </span>
            )}
            {visit.gpsLat && visit.gpsLng && (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[10px]">
                <Navigation className="w-3 h-3 text-emerald-600" /> GPS Saved
              </span>
            )}
          </div>
        )}

      {/* Completeness Bar */}
      <div className="bg-slate-50 rounded-xl p-2.5 mb-3 border border-slate-100">
        <div className="flex items-center justify-between text-[10px] mb-1.5">
          <span className="font-bold uppercase tracking-wider text-slate-400">Profile Complete</span>
          <span className="font-bold text-slate-600">
            {filled}/{totalFields} fields {left > 0 ? `(${left} left)` : '✓'}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              filled === totalFields ? 'bg-emerald-500' : filled > 0 ? 'bg-blue-500' : 'bg-slate-300'
            )}
            style={{ width: `${(filled / totalFields) * 100}%` }}
          />
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={() => onOpenCapture(visit)}
        className={cn(
          'w-full min-h-[42px] py-2.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm',
          visit.isPlaceholder ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
        )}
      >
        {visit.isPlaceholder ? <Plus className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
        {visit.isPlaceholder ? 'Add Business Info' : 'Record Visit'}
      </button>
    </div>
  );
}

// Pagination Controls Component (Touch-friendly & Super Mobile Responsive)
function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  if (totalItems <= 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 font-medium">
        <span>
          Showing <span className="font-black text-slate-900">{startItem}–{endItem}</span> of{' '}
          <span className="font-black text-slate-900">{totalItems}</span> leads
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Rows:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 min-h-[38px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Prev</span>
          </button>

          {/* Page numbers with gap indicator */}
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .map((p, idx, arr) => {
                const prevP = arr[idx - 1];
                const hasGap = prevP && p - prevP > 1;
                return (
                  <div key={p} className="flex items-center">
                    {hasGap && <span className="px-1 text-slate-400 text-xs">…</span>}
                    <button
                      type="button"
                      onClick={() => onPageChange(p)}
                      className={cn(
                        'w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0',
                        currentPage === p
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      {p}
                    </button>
                  </div>
                );
              })}
          </div>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 min-h-[38px]"
          >
            <span className="hidden xs:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// Sales Executive Field Activity Page — all businesses grouped by date (Today first, then Yesterday, etc.), with pagination
function SalesExecutiveExecutePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { data: mission } = useActiveMission();
  const marketMapping = useMarketMapping();

  const rows = useMemo<PlannedVisit[]>(() => {
    if (marketMapping.visits && marketMapping.visits.length > 0) {
      return marketMapping.visits;
    }
    if (mission?.businesses && mission.businesses.length > 0) {
      return (mission.businesses ?? [])
        .map(toPlannedRow)
        .filter((b) => !b.isPlaceholder);
    }
    return [];
  }, [marketMapping.visits, mission?.businesses]);

  const [sortOrder, setSortOrder] = useState<SortOrder>('newest'); // Today first by default
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const today = new Date();
  const todayKey = getLocalDateKey(today);
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayKey = getLocalDateKey(yesterday);

  const dayPlan = marketMapping.missionPlans.find(
    (p) => p.horizon === 'DAY' && getLocalDateKey(p.startDate || p.createdAt) === todayKey
  );
  const weekPlan = marketMapping.missionPlans.find((p) => {
    if (p.horizon !== 'WEEK' || !p.startDate) return false;
    const start = new Date(p.startDate);
    const end = p.endDate ? new Date(p.endDate) : new Date(start.getTime() + 6 * 86400000);
    return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= today && today <= end;
  });
  const activePlan = dayPlan || weekPlan;

  const targetCount =
    dayPlan?.targetCount ||
    weekPlan?.targetCount ||
    marketMapping.stats.plannedToday ||
    mission?.targetCount ||
    20;
  const activeLocation =
    activePlan?.location || marketMapping.stats.clusterName || mission?.location || 'Your daily plan';

  // Today-specific stats for top banner
  const todaysVisits = useMemo(() => {
    return rows.filter((r) => (getLocalDateKey(r.createdAt) || todayKey) === todayKey);
  }, [rows, todayKey]);

  const todayAddedCount = todaysVisits.length;
  const todayRemaining = Math.max(0, targetCount - todayAddedCount);
  const todayPercentFilled =
    targetCount > 0 ? Math.min(100, Math.round((todayAddedCount / targetCount) * 100)) : 0;

  const totalCompletedCount = rows.filter(
    (r) =>
      !r.isPlaceholder &&
      (r.status === 'VISITED' ||
        r.status === 'CONTACTED' ||
        r.status === 'INTERESTED' ||
        r.status === 'CUSTOMER')
  ).length;

  const todayCompletedCount = todaysVisits.filter(
    (r) =>
      !r.isPlaceholder &&
      (r.status === 'VISITED' ||
        r.status === 'CONTACTED' ||
        r.status === 'INTERESTED' ||
        r.status === 'CUSTOMER')
  ).length;

  // Sorted visits: newest (Today -> Yesterday -> Oldest) vs earliest
  const sortedVisits = useMemo(() => {
    return [...rows].sort((a, b) => {
      const da = getLocalDateKey(a.createdAt) || todayKey;
      const db = getLocalDateKey(b.createdAt) || todayKey;
      if (da !== db) {
        return sortOrder === 'newest' ? db.localeCompare(da) : da.localeCompare(db);
      }
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === 'newest' ? tb - ta : ta - tb;
    });
  }, [rows, todayKey, sortOrder]);

  const totalItems = sortedVisits.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedVisits = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedVisits.slice(start, start + pageSize);
  }, [sortedVisits, currentPage, pageSize]);

  // Group the paginated visits by date
  const dateGroups = useMemo(() => {
    return groupVisitsByDate(paginatedVisits, todayKey, yesterdayKey, sortOrder);
  }, [paginatedVisits, todayKey, yesterdayKey, sortOrder]);

  const openAddBusiness = () => {
    router.push('/dashboard/market-mapping/capture?new=1&from=execute');
  };

  const handleOpenCapture = (visit: PlannedVisit) => {
    router.push(`/dashboard/market-mapping/capture?id=${encodeURIComponent(visit.id)}&from=execute`);
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard/market-mapping');
    }
  };

  const handleSortToggle = (newSort: SortOrder) => {
    setSortOrder(newSort);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4 px-3 sm:px-0 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shrink-0 active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 truncate">Field Work</h1>
            <p className="text-xs text-slate-500 font-medium truncate">
              {activeLocation} · {rows.length} total lead{rows.length === 1 ? '' : 's'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-xs font-black border border-emerald-200 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {totalCompletedCount} done
          </span>
        </div>

        {/* Today's Mission Progress Card */}
        <div className="bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">
                  Today&apos;s Target
                </p>
                <p className="text-sm sm:text-base font-black text-slate-900 truncate">
                  {todayAddedCount} of {targetCount} businesses listed
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-xl shrink-0">
              {todayPercentFilled}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${todayPercentFilled}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-0.5">
            <span>
              {todayCompletedCount} visited today · {todayRemaining > 0 ? `${todayRemaining} left for today` : 'Daily target reached!'}
            </span>
            <span className="font-bold text-slate-700">{rows.length} across all days</span>
          </div>
        </div>

        {/* Action Button & Sort Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            onClick={openAddBusiness}
            className="flex-1 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-sm min-h-[48px]"
          >
            <Plus className="w-4 h-4" />
            {todayRemaining > 0 ? `Add Business (${todayRemaining} left today)` : 'Add Business'}
          </button>

          {rows.length > 0 && (
            <div className="flex items-center justify-between sm:justify-start gap-1 p-1 bg-slate-100 border border-slate-200 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => handleSortToggle('newest')}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-bold transition-all',
                  sortOrder === 'newest'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Today First
              </button>
              <button
                type="button"
                onClick={() => handleSortToggle('earliest')}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-bold transition-all',
                  sortOrder === 'earliest'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Oldest First
              </button>
            </div>
          )}
        </div>

        {rows.length === 0 ? (
          /* Empty state */
          <div className="bg-white border-2 border-dashed border-blue-200 rounded-2xl p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 mb-1">No businesses listed yet</h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-5 max-w-sm mx-auto">
              Tap &quot;Add Business&quot; to plan a business visit for your daily mission and capture details in the field.
            </p>
            <button
              onClick={openAddBusiness}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add your first business
            </button>
          </div>
        ) : (
          /* Date-Grouped List of Businesses with Pagination */
          <div className="space-y-6">
            {dateGroups.map((group) => (
              <div key={group.dateKey} className="space-y-2.5">
                {/* Date Group Header */}
                <div
                  className={cn(
                    'sticky top-0 z-10 flex items-center justify-between gap-2 p-3 rounded-2xl border backdrop-blur-md transition-all shadow-sm',
                    group.isToday
                      ? 'bg-blue-50/95 border-blue-200 text-blue-900'
                      : group.isYesterday
                      ? 'bg-slate-100/95 border-slate-300 text-slate-900'
                      : 'bg-slate-50/95 border-slate-200 text-slate-800'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs',
                        group.isToday ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                      )}
                    >
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs sm:text-sm font-black truncate">{group.label}</p>
                        {group.isToday && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-blue-600 text-white px-1.5 py-0.5 rounded-md">
                            Today
                          </span>
                        )}
                        {group.isYesterday && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-slate-600 text-white px-1.5 py-0.5 rounded-md">
                            Yesterday
                          </span>
                        )}
                      </div>
                      {group.subLabel && (
                        <p className="text-[10px] text-slate-500 font-medium truncate">{group.subLabel}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-[10px] sm:text-[11px] font-bold">
                    <span className="bg-white/80 border border-slate-200 px-2 py-0.5 rounded-md text-slate-700">
                      {group.items.length} listed
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                      {group.completedCount} done
                    </span>
                  </div>
                </div>

                {/* Items in this Date Group */}
                <div className="space-y-2.5">
                  {group.items.map((visit) => (
                    <BusinessCard
                      key={visit.id}
                      visit={visit}
                      onOpenCapture={handleOpenCapture}
                      activeLocation={activeLocation}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// Fallback Execute Page (for non-field users or alternative views)
function ExecutePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewParam = (searchParams.get('view') || 'default') as ViewMode;
  const fromParam = searchParams.get('from');
  const activeView = VIEW_CONFIG[viewParam] ? viewParam : 'default';
  const config = VIEW_CONFIG[activeView];

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fromParam || '/dashboard/market-mapping');
    }
  };

  const { stats, visits, missionPlans } = useMarketMapping();
  const { data: anchorRows } = useMarketMappingAnchors();
  const { data: priorityRows } = usePriorityVisits();
  const { data: partnershipRows } = usePartnerships();
  const [horizonFilter, setHorizonFilter] = useState<MissionHorizon>('DAY');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest'); // Today first by default
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const today = new Date();
  const todayKey = getLocalDateKey(today);
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayKey = getLocalDateKey(yesterday);

  const dayPlan = missionPlans.find(
    (p) => p.horizon === 'DAY' && getLocalDateKey(p.startDate || p.createdAt) === todayKey
  );
  const weekPlan = missionPlans.find((p) => {
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
  const activePlan = missionPlans.find((p) => p.horizon === activeHorizon);

  const contextVisits = useMemo(() => {
    switch (activeView) {
      case 'anchors':
        return (anchorRows ?? []).map(toVisitRow);
      case 'priority':
        return (priorityRows ?? []).map(toVisitRow);
      case 'partnership':
        return (partnershipRows ?? []).map(toVisitRow);
      default:
        return visits;
    }
  }, [activeView, visits, anchorRows, priorityRows, partnershipRows]);

  const todaysVisits = useMemo(() => {
    return contextVisits.filter((r) => (getLocalDateKey(r.createdAt) || todayKey) === todayKey);
  }, [contextVisits, todayKey]);

  const addedCount = contextVisits.length;
  const targetCount =
    activeView === 'default' ? activePlan?.targetCount || stats.plannedToday || 20 : contextVisits.length;
  const remaining = Math.max(0, targetCount - todaysVisits.length);

  // Sorted visits: newest (Today -> Yesterday -> Oldest) vs earliest
  const sortedVisits = useMemo(() => {
    return [...contextVisits].sort((a, b) => {
      const da = getLocalDateKey(a.createdAt) || todayKey;
      const db = getLocalDateKey(b.createdAt) || todayKey;
      if (da !== db) {
        return sortOrder === 'newest' ? db.localeCompare(da) : da.localeCompare(db);
      }
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === 'newest' ? tb - ta : ta - tb;
    });
  }, [contextVisits, todayKey, sortOrder]);

  const totalItems = sortedVisits.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedVisits = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedVisits.slice(start, start + pageSize);
  }, [sortedVisits, currentPage, pageSize]);

  const dateGroups = useMemo(() => {
    return groupVisitsByDate(paginatedVisits, todayKey, yesterdayKey, sortOrder);
  }, [paginatedVisits, todayKey, yesterdayKey, sortOrder]);

  const addBusiness = () => {
    router.push(`/dashboard/market-mapping/capture?new=1&from=execute&horizon=${activeHorizon}`);
  };

  const handleSelectVisit = (visit: PlannedVisit) => {
    router.push(`/dashboard/market-mapping/capture?id=${encodeURIComponent(visit.id)}&from=execute`);
  };

  const getVisitIcon = (visit: PlannedVisit) => {
    if (visit.isPlaceholder) return <Clock className="w-4 h-4 text-slate-400" />;
    if (visit.isAnchor) return <Crown className="w-4 h-4 text-purple-600" />;
    if (visit.status === 'VISITED' || visit.status === 'CUSTOMER')
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
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

  const handleSortToggle = (newSort: SortOrder) => {
    setSortOrder(newSort);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4 px-3 sm:px-0 pb-28">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shrink-0 active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <config.icon className={cn('w-5 h-5', config.color)} />
              {config.title}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {activeView === 'default'
                ? `${activePlan?.location || 'No location set'} · ${todaysVisits.length} of ${targetCount} today (${addedCount} total)`
                : config.subtitle}
            </p>
          </div>
        </div>

        {activeView !== 'default' && (
          <div
            className={cn(
              'rounded-2xl p-4 flex items-center justify-between gap-3',
              activeView === 'anchors' && 'bg-purple-50 border border-purple-100',
              activeView === 'priority' && 'bg-amber-50 border border-amber-100',
              activeView === 'partnership' && 'bg-blue-50 border border-blue-100'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', config.bg, 'bg-opacity-10')}>
                <config.icon className={cn('w-5 h-5', config.color)} />
              </div>
              <div className="min-w-0">
                <p className={cn('text-xs sm:text-sm font-bold', config.color)}>
                  {activeView === 'anchors' && 'Anchor businesses are high-traffic establishments.'}
                  {activeView === 'priority' && 'AI-recommended businesses rated by opportunity score.'}
                  {activeView === 'partnership' && 'Businesses with potential for cross-promotion.'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{addedCount} businesses in this list</p>
              </div>
            </div>
            <Link
              href="/dashboard/market-mapping/insights"
              className={cn('text-xs font-bold px-3 py-1.5 rounded-lg shrink-0', config.bg, 'text-white')}
            >
              Insights
            </Link>
          </div>
        )}

        {activeView === 'default' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {activeHorizon === 'DAY' ? 'Daily' : 'Weekly'} Target
                  </p>
                  <p className="text-base sm:text-lg font-black text-slate-800 truncate">
                    {todaysVisits.length} of {targetCount} businesses listed today
                  </p>
                </div>
              </div>
              {activePlan?.location && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">{activePlan.location}</span>
                </div>
              )}
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all"
                style={{ width: `${Math.min(100, (todaysVisits.length / targetCount) * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-500">{todaysVisits.length} listed today</span>
              <span className={cn('font-bold', remaining === 0 ? 'text-emerald-600' : 'text-amber-600')}>
                {remaining === 0 ? 'Target met!' : `${remaining} left today`}
              </span>
            </div>
          </div>
        )}

        {/* Action Button & Sort Control */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {activeView === 'default' && (
            <button
              onClick={addBusiness}
              className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] min-h-[48px]"
            >
              <Plus className="w-4 h-4" />
              Add Business {remaining > 0 && `(${remaining} left)`}
            </button>
          )}

          {contextVisits.length > 0 && (
            <div className="flex items-center justify-between sm:justify-start gap-1 p-1 bg-slate-100 border border-slate-200 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => handleSortToggle('newest')}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-bold transition-all',
                  sortOrder === 'newest' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Today First
              </button>
              <button
                type="button"
                onClick={() => handleSortToggle('earliest')}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-bold transition-all',
                  sortOrder === 'earliest' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Oldest First
              </button>
            </div>
          )}
        </div>

        {contextVisits.length > 0 ? (
          <div className="space-y-6">
            {dateGroups.map((group) => (
              <div key={group.dateKey} className="space-y-2.5">
                <div
                  className={cn(
                    'sticky top-0 z-10 flex items-center justify-between gap-2 p-3 rounded-2xl border backdrop-blur-md transition-all shadow-sm',
                    group.isToday
                      ? 'bg-blue-50/95 border-blue-200 text-blue-900'
                      : group.isYesterday
                      ? 'bg-slate-100/95 border-slate-300 text-slate-900'
                      : 'bg-slate-50/95 border-slate-200 text-slate-800'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="w-4 h-4 shrink-0 text-blue-600" />
                    <p className="text-xs sm:text-sm font-black truncate">{group.label}</p>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">
                    {group.items.length} listed
                  </span>
                </div>

                <div className="space-y-2">
                  {group.items.map((visit) => {
                    const badge = getVisitBadge(visit);
                    return (
                      <button
                        key={visit.id}
                        onClick={() => handleSelectVisit(visit)}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-3.5 sm:px-4 py-3 flex items-center justify-between hover:border-blue-300 transition-colors text-left gap-2"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn('w-9 h-9 rounded-2xl flex items-center justify-center shrink-0', getVisitBg(visit))}>
                            {getVisitIcon(visit)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{visit.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {visit.category} · {visit.address || 'No location'}
                            </p>
                          </div>
                        </div>
                        <div className={cn('text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ml-2', badge.cls)}>
                          {badge.text}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
            />
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
          <Link
            href="/dashboard/market-mapping/plan"
            className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 text-sm font-semibold rounded-2xl transition-colors min-h-[44px]"
          >
            Edit Mission Plan
          </Link>
        )}
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