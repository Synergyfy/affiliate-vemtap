'use client';

import { TerritoryStats } from '@/types/affiliate-market-mapping';
import { Flag, ShieldAlert, ArrowRight } from 'lucide-react';

interface MarketCompletionSummaryProps {
  stats: TerritoryStats;
}

export default function MarketCompletionSummary({ stats }: MarketCompletionSummaryProps) {
  const isComplete = stats.clusterCompletion >= 80;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-6 text-center relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
        <div 
          className="h-full bg-blue-600 transition-all duration-1000"
          style={{ width: `${stats.clusterCompletion}%` }}
        />
      </div>

      <div className="flex justify-center mb-6 mt-4">
        <div className="w-20 h-20 bg-slate-50 border-4 border-slate-100 rounded-full flex items-center justify-center relative shadow-inner">
          <Flag className="w-8 h-8 text-blue-600" />
          <div className="absolute -bottom-2 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full border-2 border-white shadow-sm">
            {stats.clusterCompletion}%
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-black text-slate-900 mb-2">Market Domination Goal</h3>
      
      {isComplete ? (
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          Congratulations! You have reached the required 80% penetration rate for <strong className="text-slate-900">{stats.clusterName}</strong>. You can now request assignment to a new cluster or continue reinforcing this area.
        </p>
      ) : (
        <p className="text-sm text-slate-600 max-w-lg mx-auto">
          The <strong className="text-slate-900">{stats.clusterName}</strong> commercial cluster is currently at {stats.clusterCompletion}% completion. Until the overall penetration reaches <strong>80%</strong>, this remains an active mission.
        </p>
      )}

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        {isComplete ? (
          <button className="px-6 py-3 bg-emerald-600 text-white text-sm font-black rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2">
            Request New Territory <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button className="px-6 py-3 bg-slate-100 text-slate-700 text-sm font-black rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> View Remaining Anchors
            </button>
            <button className="px-6 py-3 bg-blue-600 text-white text-sm font-black rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
              Continue Mission
            </button>
          </>
        )}
      </div>
    </div>
  );
}
