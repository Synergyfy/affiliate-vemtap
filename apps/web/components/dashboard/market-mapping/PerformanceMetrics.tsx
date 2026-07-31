'use client';

import { AffiliatePerformance } from '@/types/affiliate-market-mapping';
import { Target, TrendingUp, Users, Wallet, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceMetricsProps {
  performance: AffiliatePerformance;
}

export default function PerformanceMetrics({ performance }: PerformanceMetricsProps) {
  
  const targetMetrics = [
    { 
      label: 'Daily Target', 
      progress: performance.dailyProgress, 
      target: performance.dailyTarget,
      color: 'bg-blue-500', 
      bg: 'bg-blue-50', 
      text: 'text-blue-600'
    },
    { 
      label: 'Weekly Target', 
      progress: performance.weeklyProgress, 
      target: performance.weeklyTarget,
      color: 'bg-emerald-500', 
      bg: 'bg-emerald-50', 
      text: 'text-emerald-600'
    },
    { 
      label: 'Monthly Target', 
      progress: performance.monthlyProgress, 
      target: performance.monthlyTarget,
      color: 'bg-purple-500', 
      bg: 'bg-purple-50', 
      text: 'text-purple-600'
    }
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="text-lg font-black text-slate-900">Your Targets & Performance</h3>
      </div>

      <div className="space-y-5 mb-8">
        {targetMetrics.map((metric, idx) => {
          const percentage = Math.min(100, Math.round((metric.progress / metric.target) * 100)) || 0;
          return (
            <div key={idx}>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-600">{metric.label}</span>
                <span className={metric.text}>{metric.progress} / {metric.target}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className={cn("h-full transition-all duration-1000", metric.color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="mt-1 text-right text-[10px] font-bold text-slate-400">
                {percentage}% Completed
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-100">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <Users className="w-5 h-5 text-slate-400 mb-2" />
          <h4 className="text-xl font-black text-slate-900 leading-none mb-1">{performance.monthVisits}</h4>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Total Visits</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
          <Wallet className="w-5 h-5 text-emerald-500 mb-2" />
          <h4 className="text-xl font-black text-emerald-900 leading-none mb-1">₦{(performance.monthRevenue).toLocaleString()}</h4>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">Est. Commission</p>
        </div>
      </div>
    </div>
  );
}
