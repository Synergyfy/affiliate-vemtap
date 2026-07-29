'use client';

import { TerritoryStats } from '@/types/affiliate-market-mapping';
import { ChevronRight, Calendar, User, MapPin, Target, CheckCircle2, RefreshCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissionHeaderProps {
  stats: TerritoryStats;
  onRefresh?: () => void;
}

export default function MissionHeader({ stats, onRefresh }: MissionHeaderProps) {
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const affiliateName = "Emmanuel Nnamdi"; // Mock for now, would come from auth context

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Top Row: Breadcrumbs and Date */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{stats.city}</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span>{stats.area}</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{stats.clusterName}</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          {currentDate}
        </div>
      </div>

      <div className="border-t border-slate-100" />

      {/* Main Row: Mission Details and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Affiliate and Mission */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Assigned Affiliate</p>
            <h2 className="text-base font-black text-slate-900 leading-tight mb-1">{affiliateName}</h2>
            
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-100">
                <Target className="w-3 h-3" /> {stats.missionGoal}
              </span>
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" /> Mission Active
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={onRefresh} className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors" title="Export">
            <Download className="w-4 h-4" />
          </button>
          <button className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors">
            Plan New Mission
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
            Continue Mission
          </button>
        </div>
      </div>
    </div>
  );
}
