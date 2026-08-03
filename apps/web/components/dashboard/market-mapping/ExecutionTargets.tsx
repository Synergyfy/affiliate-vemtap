'use client';

import { TerritoryStats } from '@/types/affiliate-market-mapping';
import { Target, CheckCircle2, MapPin, Users, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecutionTargetsProps {
  stats: TerritoryStats;
}

export default function ExecutionTargets({ stats }: ExecutionTargetsProps) {
  const dailyProgress = stats.plannedToday > 0 ? Math.round((stats.visitedToday / stats.plannedToday) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Daily Targets */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Target className="w-16 h-16" />
        </div>
        <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-500" />
          Today&apos;s Target
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 mb-1">Planned Visits</p>
            <p className="text-2xl font-black text-slate-900">{stats.plannedToday}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 mb-1">Visited</p>
            <p className="text-2xl font-black text-emerald-600">{stats.visitedToday}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-slate-500">Completion</span>
            <span className={cn(dailyProgress >= 100 ? "text-emerald-600" : "text-blue-600")}>
              {dailyProgress}%
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500 rounded-full", dailyProgress >= 100 ? "bg-emerald-500" : "bg-blue-500")}
              style={{ width: `${Math.min(dailyProgress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Territory Overview */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <MapPin className="w-16 h-16" />
        </div>
        <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-purple-500" />
          Territory: {stats.clusterName}
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 mb-1">Assigned</p>
            <p className="text-lg font-black text-slate-900">{stats.totalAssigned}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 mb-1">Remaining</p>
            <p className="text-lg font-black text-amber-600">{stats.remainingInCluster}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 mb-1">Customers</p>
            <p className="text-lg font-black text-emerald-600">{stats.customersAcquired}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 mb-1">Completion</p>
            <p className="text-lg font-black text-purple-600">{stats.clusterCompletion}%</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-5 shadow-sm text-white flex flex-col justify-center">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-100">Weekly Target</p>
              <p className="text-lg font-black">75 Visits / 10 Customers</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-100">Cluster Progress</p>
              <p className="text-sm font-bold">You are 12 visits away from Stage 4</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
