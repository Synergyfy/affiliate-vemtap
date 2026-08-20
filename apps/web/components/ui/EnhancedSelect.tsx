'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface SharedProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

interface MultiSelectProps extends SharedProps {
  selected: string[];
  onToggle: (value: string) => void;
  onClear?: () => void;
  onSelectAll?: () => void;
  selectAllLabel?: string;
}

interface SingleSelectProps extends SharedProps {
  value: string | null;
  onChange: (value: string) => void;
  onClear?: () => void;
  displayValue?: string;
}

function useOutsideClose(ref: React.RefObject<HTMLElement>, onClose: () => void) {
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, onClose]);
}

function SelectShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full">
      {children}
    </div>
  );
}

function SearchInput({ query, setQuery }: { query: string; setQuery: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
      <Search className="w-4 h-4 text-slate-400 shrink-0" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search…"
        autoFocus
        className="w-full text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none bg-transparent"
      />
      {query && (
        <button type="button" onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function OptionRow({
  option,
  active,
  onPick,
  icon,
}: {
  option: SelectOption;
  active: boolean;
  onPick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onPick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
        active ? 'bg-blue-50' : 'hover:bg-slate-50',
      )}
    >
      {option.icon}
      <span className="flex-1 min-w-0">
        <span className={cn('block text-sm truncate', active ? 'font-bold text-blue-700' : 'font-medium text-slate-700')}>
          {option.label}
        </span>
        {option.description && (
          <span className="block text-[11px] text-slate-400 font-medium truncate">{option.description}</span>
        )}
      </span>
      {icon ?? (
        <span
          className={cn(
            'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all',
            active ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white',
          )}
        >
          {active && <Check className="w-3 h-3 text-white" />}
        </span>
      )}
    </button>
  );
}

export function EnhancedMultiSelect({
  label,
  placeholder = 'Select options…',
  options,
  selected,
  onToggle,
  onClear,
  onSelectAll,
  selectAllLabel = 'Select all',
  disabled,
  searchable = true,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, () => setOpen(false));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.description || '').toLowerCase().includes(q),
    );
  }, [options, query]);

  const selectedOptions = options.filter((o) => selected.includes(o.value));
  const shownLabel = selectedOptions.length > 0 ? selectedOptions[0].label : null;
  const hiddenCount = selectedOptions.length - (shownLabel ? 1 : 0);

  return (
    <div className={cn('w-full', className)}>
      {label && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>}
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setOpen((v) => !v);
            setQuery('');
          }}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            'w-full flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl border bg-white text-left transition-all overflow-hidden',
            open
              ? 'border-blue-400 ring-2 ring-blue-500/20'
              : 'border-slate-200 hover:border-slate-300',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          <span className="flex-1 min-w-0">
            {selectedOptions.length === 0 ? (
              <span className="text-sm text-slate-400 font-medium">{placeholder}</span>
            ) : (
              <span className="flex items-center gap-1.5 min-w-0">
                {shownLabel && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-700 truncate max-w-[140px]">
                    {shownLabel}
                  </span>
                )}
                {hiddenCount > 0 && (
                  <span className="text-[11px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap">
                    +{hiddenCount} more
                  </span>
                )}
              </span>
            )}
          </span>
          <ChevronDown className={cn('w-4 h-4 text-slate-400 shrink-0 transition-transform', open && 'rotate-180')} />
        </button>

        {open && !disabled && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
            {searchable && <SearchInput query={query} setQuery={setQuery} />}
            <div className="max-h-60 overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs font-medium text-slate-400">No options match “{query}”.</p>
              ) : (
                filtered.map((opt) => (
                  <OptionRow
                    key={opt.value}
                    option={opt}
                    active={selected.includes(opt.value)}
                    onPick={() => onToggle(opt.value)}
                  />
                ))
              )}
            </div>
            {(onClear || onSelectAll) && (
              <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-slate-100 bg-slate-50/80">
                {onSelectAll && (
                  <button
                    type="button"
                    onClick={onSelectAll}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 min-w-0 whitespace-nowrap"
                  >
                    <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{selectAllLabel}</span>
                  </button>
                )}
                {onClear && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-red-600 min-w-0 whitespace-nowrap"
                  >
                    <X className="w-3.5 h-3.5 shrink-0" />
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function EnhancedSingleSelect({
  label,
  placeholder = 'Select…',
  options,
  value,
  onChange,
  onClear,
  displayValue,
  disabled,
  searchable = true,
  className,
}: SingleSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClose(ref, () => setOpen(false));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.description || '').toLowerCase().includes(q),
    );
  }, [options, query]);

  const activeOption = options.find((o) => o.value === value);

  return (
    <div className={cn('w-full', className)}>
      {label && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>}
      <div ref={ref} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setOpen((v) => !v);
            setQuery('');
          }}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            'w-full flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl border bg-white text-left transition-all overflow-hidden',
            open
              ? 'border-blue-400 ring-2 ring-blue-500/20'
              : 'border-slate-200 hover:border-slate-300',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        >
          <span className="flex-1 min-w-0 truncate text-sm font-medium text-slate-700">
            {displayValue ?? activeOption?.label ?? <span className="text-slate-400">{placeholder}</span>}
          </span>
          <ChevronDown className={cn('w-4 h-4 text-slate-400 shrink-0 transition-transform', open && 'rotate-180')} />
        </button>

        {open && !disabled && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
            {searchable && <SearchInput query={query} setQuery={setQuery} />}
            <div className="max-h-60 overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs font-medium text-slate-400">No options match “{query}”.</p>
              ) : (
                filtered.map((opt) => (
                  <OptionRow
                    key={opt.value}
                    option={opt}
                    active={value === opt.value}
                    onPick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    icon={
                      value === opt.value ? (
                        <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : undefined
                    }
                  />
                ))
              )}
            </div>
            {onClear && value && (
              <div className="flex items-center justify-end px-3 py-2 border-t border-slate-100 bg-slate-50/60">
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    setOpen(false);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}