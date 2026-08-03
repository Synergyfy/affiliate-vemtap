'use client';

import { useState } from 'react';
import { Calendar, Plus, Save, Hash } from 'lucide-react';
import { PlannedVisit } from '@/types/affiliate-market-mapping';
import { cn } from '@/lib/utils';

interface PlanMyDayProps {
  onAddVisits: (visits: PlannedVisit[]) => void;
  clusterName: string;
}

type Mode = 'KNOWN' | 'UNKNOWN';

export default function PlanMyDay({ onAddVisits, clusterName }: PlanMyDayProps) {
  const [mode, setMode] = useState<Mode>('KNOWN');
  
  // Known mode state
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  
  // Unknown mode state
  const [unknownCount, setUnknownCount] = useState<number>(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'KNOWN' && businessName) {
      const newVisit: PlannedVisit = {
        id: `v-${Date.now()}`,
        name: businessName,
        category: category || 'Uncategorized',
        status: 'NOT_YET',
        isPlaceholder: false
      };
      onAddVisits([newVisit]);
      setBusinessName('');
      setCategory('');
    } else if (mode === 'UNKNOWN' && unknownCount > 0) {
      const newVisits: PlannedVisit[] = Array.from({ length: unknownCount }).map((_, i) => ({
        id: `v-placeholder-${Date.now()}-${i}`,
        name: '',
        category: 'Unknown',
        status: 'NOT_YET',
        isPlaceholder: true
      }));
      onAddVisits(newVisits);
      setUnknownCount(5);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Plan My Day in {clusterName}
        </h3>
        <p className="text-xs text-slate-500 mt-1">
           Add the businesses you intend to visit today, or leave names blank when they are not known yet.
        </p>
      </div>

      <div className="p-5">
        <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-2xl w-full md:w-auto md:inline-flex">
          <button
            type="button"
            onClick={() => setMode('KNOWN')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex-1 md:flex-none text-center",
              mode === 'KNOWN' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            I Know The Names
          </button>
          <button
            type="button"
            onClick={() => setMode('UNKNOWN')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex-1 md:flex-none text-center",
              mode === 'UNKNOWN' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
             I Don&apos;t Know Names
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'KNOWN' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. HealthPlus Pharmacy"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Pharmacy, Restaurant"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" /> Number of Businesses to Visit
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={unknownCount}
                  onChange={(e) => setUnknownCount(parseInt(e.target.value))}
                  className="w-full max-w-xs accent-blue-600"
                />
                <span className="text-xl font-black text-blue-600 w-8">{unknownCount}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                 This will create {unknownCount} unnamed planned visits inside {clusterName}.
              </p>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-colors"
            >
              {mode === 'KNOWN' ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {mode === 'KNOWN' ? 'Add Business' : 'Generate Placeholders'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
