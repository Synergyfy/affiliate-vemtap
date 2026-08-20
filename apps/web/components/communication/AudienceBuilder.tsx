'use client';

import { memo, useEffect, useState } from 'react';
import { Loader2, Users, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudienceEstimate } from '@/services/useCommunicationHooks';
import { AudienceFilter, EMPTY_AUDIENCE } from '@/types/communication';
import OverMessagingNotice from './OverMessagingNotice';
import { useDebounce } from '@/hooks/use-debounce';
import { EnhancedMultiSelect, SelectOption } from '@/components/ui/EnhancedSelect';

export const STATUS_OPTIONS: SelectOption[] = [
  { value: 'NEW', label: 'New / Not Yet Contacted' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'VISITED', label: 'Visited' },
  { value: 'INTERESTED', label: 'Interested' },
  { value: 'FOLLOW_UP_REQUIRED', label: 'Follow-up Required' },
  { value: 'NOT_INTERESTED', label: 'Not Interested' },
  { value: 'SUBSCRIBED', label: 'Subscribed' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'LOST_CLOSED', label: 'Lost / Closed' },
];

export const LOCATION_OPTIONS: SelectOption[] = [
  { value: 'Apo', label: 'Apo' },
  { value: 'Garki', label: 'Garki' },
  { value: 'Guzape', label: 'Guzape' },
  { value: 'Wuse', label: 'Wuse' },
  { value: 'Wuse 2', label: 'Wuse 2' },
  { value: 'Maitama', label: 'Maitama' },
];

export const SALESPERSON_OPTIONS: SelectOption[] = [
  { value: 'Agent A', label: 'Agent A' },
  { value: 'Agent B', label: 'Agent B' },
  { value: 'Agent C', label: 'Agent C' },
];

interface AudienceBuilderProps {
  filters: AudienceFilter;
  onChange: (filters: AudienceFilter) => void;
  compact?: boolean;
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-2 group"
    >
      <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900">{label}</span>
      <span
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0',
          checked ? 'bg-blue-600' : 'bg-slate-200',
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </span>
    </button>
  );
}

function AudienceBuilder({ filters, onChange, compact }: AudienceBuilderProps) {
  const [expanded, setExpanded] = useState(!compact);
  const debouncedFilters = useDebounce(filters, 400);
  const [estimateFilters, setEstimateFilters] = useState<AudienceFilter>(filters);

  useEffect(() => {
    setEstimateFilters(debouncedFilters);
  }, [debouncedFilters]);

  const { data: estimate, isLoading } = useAudienceEstimate(estimateFilters);

  const toggleStatus = (value: string) => {
    const current = filters.statuses || [];
    const next = current.includes(value as any) ? current.filter((v) => v !== value) : [...current, value as any];
    onChange({ ...filters, statuses: next });
  };

  const setAllStatuses = () => {
    onChange({ ...filters, statuses: STATUS_OPTIONS.map((o) => o.value as any) });
  };

  const clearStatuses = () => {
    onChange({ ...filters, statuses: [] });
  };

  const reset = () => onChange({ ...EMPTY_AUDIENCE });

  const activeFilterCount =
    (filters.statuses?.length || 0) + (filters.salespersonIds?.length || 0) + (filters.location ? 1 : 0);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-slate-900">Audience</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied` : 'No filters applied'}
            </p>
          </div>
        </div>
        <ChevronDown className={cn('w-5 h-5 text-slate-400 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <EnhancedMultiSelect
              label="By Status"
              placeholder="All statuses"
              options={STATUS_OPTIONS}
              selected={(filters.statuses || []) as string[]}
              onToggle={toggleStatus}
              onClear={clearStatuses}
              onSelectAll={setAllStatuses}
              selectAllLabel="All statuses"
            />
            <EnhancedMultiSelect
              label="By Salesperson"
              placeholder="All salespeople"
              options={SALESPERSON_OPTIONS}
              selected={filters.salespersonIds || []}
              onToggle={(value) => {
                const current = filters.salespersonIds || [];
                const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
                onChange({ ...filters, salespersonIds: next });
              }}
              onClear={() => onChange({ ...filters, salespersonIds: [] })}
              onSelectAll={() => onChange({ ...filters, salespersonIds: SALESPERSON_OPTIONS.map((o) => o.value) })}
              selectAllLabel="All salespeople"
            />
            <EnhancedMultiSelect
              label="By Location / Area"
              placeholder="All areas"
              options={LOCATION_OPTIONS}
              selected={filters.location ? [filters.location] : []}
              onToggle={(value) => {
                onChange({ ...filters, location: filters.location === value ? undefined : value });
              }}
              onClear={() => onChange({ ...filters, location: undefined })}
              onSelectAll={() => {}}
              selectAllLabel=""
            />
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-100">
            <ToggleRow
              label="Only contacts with a phone number"
              checked={filters.hasPhone ?? true}
              onChange={(v) => onChange({ ...filters, hasPhone: v })}
            />
          </div>

          <button
            type="button"
            onClick={reset}
            className="text-xs font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Reset filters
          </button>
        </div>
      )}

      {/* Live estimate */}
      <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Audience size</p>
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
              <Loader2 className="w-4 h-4 animate-spin" /> Estimating…
            </div>
          ) : (
            <p className="text-2xl font-black text-slate-900">
              {estimate?.eligibleCount ?? 0} <span className="text-sm font-bold text-slate-500">contact{(estimate?.eligibleCount ?? 0) !== 1 ? 's' : ''} selected</span>
            </p>
          )}
        </div>
        {isLoading ? null : (estimate && estimate.eligibleCount > 0 && (
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            {estimate.skippedFrequency > 0
              ? `${estimate.skippedFrequency} excluded by frequency rules`
              : 'All eligible for messaging'}
          </p>
        ))}
        <OverMessagingNotice count={estimate?.skippedFrequency ?? 0} warnings={[]} />
      </div>
    </div>
  );
}

export default memo(AudienceBuilder);
