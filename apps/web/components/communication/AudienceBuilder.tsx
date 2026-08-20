'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { Loader2, Users, AlertTriangle, ChevronDown, X, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudienceEstimate } from '@/services/useCommunicationHooks';
import { AudienceFilter, AudienceDateAdded, EMPTY_AUDIENCE } from '@/types/communication';
import OverMessagingNotice from './OverMessagingNotice';
import { useDebounce } from '@/hooks/use-debounce';
import { EnhancedMultiSelect, SelectOption } from '@/components/ui/EnhancedSelect';

export const STATUS_OPTIONS: SelectOption[] = [
  { value: 'NOT_YET', label: 'New / Not Yet Contacted' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'VISITED', label: 'Visited' },
  { value: 'INTERESTED', label: 'Interested' },
  { value: 'DEMO_SCHEDULED', label: 'Demo Scheduled' },
  { value: 'DEMO_DONE', label: 'Demo Done' },
  { value: 'NOT_INTERESTED', label: 'Not Interested' },
  { value: 'CUSTOMER', label: 'Customer' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'LOST', label: 'Lost / Closed' },
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

const DATE_PRESETS: { value: AudienceDateAdded['range']; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'custom', label: 'Custom' },
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

function ClickableDateInput({
  value,
  onChange,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        try {
          ref.current?.showPicker();
        } catch {
          ref.current?.focus();
        }
      }}
      className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300 focus-within:ring-2 focus-within:ring-blue-500/20 text-left transition-all"
    >
      {icon}
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent focus:outline-none text-slate-700"
      />
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

  const toggle = (key: 'statuses' | 'salespeople' | 'locations') => (value: string) => {
    const current = filters[key] || [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  const setAll = (key: 'statuses' | 'salespeople' | 'locations') => () => {
    const allOptions = key === 'statuses' ? STATUS_OPTIONS : key === 'salespeople' ? SALESPERSON_OPTIONS : LOCATION_OPTIONS;
    onChange({ ...filters, [key]: allOptions.map((o) => o.value) });
  };

  const clear = (key: 'statuses' | 'salespeople' | 'locations') => () => {
    onChange({ ...filters, [key]: [] });
  };

  const setDateRange = (range: AudienceDateAdded['range']) => {
    onChange({ ...filters, dateAdded: { range } });
  };

  const reset = () => onChange({ ...EMPTY_AUDIENCE });

  const activeFilterCount =
    (filters.statuses?.length || 0) + (filters.salespeople?.length || 0) + (filters.locations?.length || 0) + (filters.dateAdded ? 1 : 0);

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
              selected={filters.statuses || []}
              onToggle={toggle('statuses')}
              onClear={clear('statuses')}
              onSelectAll={setAll('statuses')}
              selectAllLabel="All statuses"
            />
            <EnhancedMultiSelect
              label="By Salesperson"
              placeholder="All salespeople"
              options={SALESPERSON_OPTIONS}
              selected={filters.salespeople || []}
              onToggle={toggle('salespeople')}
              onClear={clear('salespeople')}
              onSelectAll={setAll('salespeople')}
              selectAllLabel="All salespeople"
            />
            <EnhancedMultiSelect
              label="By Location / Area"
              placeholder="All areas"
              options={LOCATION_OPTIONS}
              selected={filters.locations || []}
              onToggle={toggle('locations')}
              onClear={clear('locations')}
              onSelectAll={setAll('locations')}
              selectAllLabel="All areas"
            />
          </div>

          {/* Date added */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" />
              By Date Added
            </p>
            <div className="flex flex-wrap gap-2">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setDateRange(preset.value)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all',
                    filters.dateAdded?.range === preset.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600',
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {filters.dateAdded?.range === 'custom' && (
              <div className="flex gap-3 mt-3">
                <ClickableDateInput
                  value={filters.dateAdded?.from || ''}
                  icon={<CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />}
                  onChange={(v) =>
                    onChange({
                      ...filters,
                      dateAdded: { range: 'custom', from: v, to: filters.dateAdded?.to },
                    })
                  }
                />
                <ClickableDateInput
                  value={filters.dateAdded?.to || ''}
                  icon={<CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />}
                  onChange={(v) =>
                    onChange({
                      ...filters,
                      dateAdded: { range: 'custom', from: filters.dateAdded?.from, to: v },
                    })
                  }
                />
              </div>
            )}
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-100">
            <ToggleRow
              label="Only contacts with a phone number"
              checked={filters.hasPhone ?? true}
              onChange={(v) => onChange({ ...filters, hasPhone: v })}
            />
            <ToggleRow
              label="Exclude subscribed / customers"
              checked={filters.excludeSubscribed ?? true}
              onChange={(v) => onChange({ ...filters, excludeSubscribed: v })}
            />
            <ToggleRow
              label="Exclude not-interested"
              checked={filters.excludeNotInterested ?? true}
              onChange={(v) => onChange({ ...filters, excludeNotInterested: v })}
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
              {estimate?.count ?? 0} <span className="text-sm font-bold text-slate-500">contact{(estimate?.count ?? 0) !== 1 ? 's' : ''} selected</span>
            </p>
          )}
        </div>
        {isLoading ? null : (estimate && estimate.count > 0 && (
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            {estimate.overMessagingCount > 0
              ? `${estimate.overMessagingCount} excluded by frequency rules`
              : 'All eligible for messaging'}
          </p>
        ))}
        <OverMessagingNotice count={estimate?.overMessagingCount ?? 0} warnings={estimate?.warnings || []} />
      </div>
    </div>
  );
}

export default memo(AudienceBuilder);