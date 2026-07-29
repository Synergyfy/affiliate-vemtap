'use client';

import { TerritoryStats } from '@/types/affiliate-market-mapping';
import { Target, Users, Map, Clock, Rocket, AlertTriangle } from 'lucide-react';

interface MissionControlProps {
  stats: TerritoryStats;
}

export default function MissionControl({ stats }: MissionControlProps) {
  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl mb-12 text-white overflow-hidden relative">
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-30" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-600 rounded-full blur-[100px] opacity-20" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-800">
          <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/50 rounded-2xl flex items-center justify-center">
            <Rocket className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Mission Control</h2>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">{stats.clusterName} Operations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1">
              <Target className="w-3.5 h-3.5" /> Mission Goal
            </p>
            <p className="text-lg font-bold text-slate-200">{stats.missionGoal}</p>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1">
              <Map className="w-3.5 h-3.5" /> Progress
            </p>
            <p className="text-lg font-bold text-emerald-400">{stats.visitedToday} / {stats.plannedToday} completed</p>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5" /> New Customers
            </p>
            <p className="text-lg font-bold text-blue-400">{stats.customersAcquired}</p>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5" /> Remaining Time
            </p>
            <p className="text-lg font-bold text-amber-400">{stats.remainingTime}</p>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-5 border border-slate-700/50">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Recommended Next Action
          </p>
          <p className="text-sm md:text-base font-medium text-slate-300 leading-relaxed">
            {stats.recommendedAction}
          </p>
        </div>
      </div>
    </div>
  );
}
