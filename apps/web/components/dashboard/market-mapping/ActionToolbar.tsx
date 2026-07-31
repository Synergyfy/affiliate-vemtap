'use client';

import { Plus, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ActionToolbarProps {
  onSearch?: (q: string) => void;
  onFilter?: () => void;
  onAddBusiness?: () => void;
}

export default function ActionToolbar({ onSearch, onFilter, onAddBusiness }: ActionToolbarProps) {
  const [query, setQuery] = useState('');

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <div className="relative flex-1 sm:flex-none sm:w-56">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search business..."
          value={query}
          onChange={e => { setQuery(e.target.value); onSearch?.(e.target.value); }}
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-400 transition-colors"
        />
      </div>
      <button onClick={onFilter} className="p-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
        <Filter className="w-4 h-4" />
      </button>
      <button onClick={onAddBusiness} className="px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:bg-blue-700 transition-colors">
        <Plus className="w-4 h-4" /> Add
      </button>
    </div>
  );
}
