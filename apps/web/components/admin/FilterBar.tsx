import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
  filterOptions?: FilterOption[];
  filterLabel?: string;
  extraActions?: React.ReactNode;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  activeFilter,
  onFilterChange,
  filterOptions,
  filterLabel = "Filter",
  extraActions
}: FilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
      <div className="relative flex-grow max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 sm:py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        {searchQuery && (
          <button 
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-3 h-3 text-slate-400" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {filterOptions && onFilterChange && (
          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border rounded-xl text-xs sm:text-sm text-slate-600 font-medium transition-all hover:bg-slate-50",
                activeFilter && activeFilter !== 'All' ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-slate-200"
              )}
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {activeFilter === 'All' || !activeFilter ? filterLabel : activeFilter}
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 overflow-hidden"
                >
                  <div className="p-2 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{filterLabel} Options</p>
                  </div>
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onFilterChange(option.value);
                        setIsFilterOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                        activeFilter === option.value 
                          ? "bg-blue-600 text-white" 
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        {extraActions}
      </div>
    </div>
  );
}
