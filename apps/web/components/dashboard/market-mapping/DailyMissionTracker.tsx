'use client';

import { TerritoryStats } from '@/types/affiliate-market-mapping';
import { Target, CheckCircle2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DailyMissionTrackerProps {
  stats: TerritoryStats;
}

export default function DailyMissionTracker({ stats }: DailyMissionTrackerProps) {
  const completionRate = Math.round((stats.visitedToday / stats.plannedToday) * 100) || 0;

  // Generate boxes for visual progress (□□□)
  const boxes = Array.from({ length: stats.plannedToday }).map((_, i) => (
    <div 
      key={i} 
      className={cn(
        "w-4 h-4 rounded-sm border",
        i < stats.visitedToday 
          ? "bg-emerald-500 border-emerald-600 shadow-sm shadow-emerald-500/50" 
          : "bg-slate-100 border-slate-200"
      )}
    />
  ));

  return (
    <div className="bg-slate-900 rounded-3xl p-6 mb-6 text-white shadow-lg relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-20" />
      
      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
        
        {/* Left Side: Mission Visual */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xl flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-400" />
              Today&apos;s Mission Progress
            </h3>
            <span className="text-3xl font-black text-emerald-400">{completionRate}%</span>
          </div>
          
          <div className="flex flex-wrap gap-1">
            {boxes}
          </div>

          <div className="flex items-center gap-6 text-sm font-bold text-slate-400">
            <div>
              <span className="text-white text-lg block">{stats.plannedToday}</span>
              Planned
            </div>
            <div>
              <span className="text-emerald-400 text-lg block">{stats.visitedToday}</span>
              Visited
            </div>
            <div>
              <span className="text-amber-400 text-lg block">{Math.max(0, stats.plannedToday - stats.visitedToday)}</span>
              Remaining
            </div>
          </div>
        </div>

        {/* Right Side: Additional Metrics */}
        <div className="grid grid-cols-2 gap-3 w-full md:w-auto md:min-w-[300px]">
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-4 border border-slate-700">
            <CheckCircle2 className="w-5 h-5 text-blue-400 mb-2" />
            <h4 className="text-2xl font-black mb-1">4</h4>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">Meetings Done</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-4 border border-slate-700">
            <TrendingUp className="w-5 h-5 text-emerald-400 mb-2" />
            <h4 className="text-2xl font-black mb-1">{stats.customersAcquired}</h4>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">New Customers</p>
          </div>
          <div className="col-span-2 bg-slate-800/50 backdrop-blur-md rounded-2xl p-4 border border-slate-700">
            <h4 className="text-2xl font-black mb-1">2</h4>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold">Proposals Sent</p>
          </div>
        </div>

      </div>
    </div>
  );
}
