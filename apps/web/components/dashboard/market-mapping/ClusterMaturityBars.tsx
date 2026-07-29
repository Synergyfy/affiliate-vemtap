'use client';

import { ClusterMaturity } from '@/types/affiliate-market-mapping';
import { Activity, ShieldCheck, Target, Users, Handshake, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClusterMaturityBarsProps {
  maturity: ClusterMaturity;
  clusterName: string;
}

export default function ClusterMaturityBars({ maturity, clusterName }: ClusterMaturityBarsProps) {
  const bars = [
    { label: 'Business Discovery', value: maturity.discovery, icon: Activity, color: 'bg-blue-600', bg: 'bg-blue-100' },
    { label: 'Verification', value: maturity.verification, icon: ShieldCheck, color: 'bg-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Sales Visits', value: maturity.sales, icon: Target, color: 'bg-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Customers', value: maturity.customers, icon: Users, color: 'bg-amber-500', bg: 'bg-amber-100' },
    { label: 'Partnership', value: maturity.partnerships, icon: Handshake, color: 'bg-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Cluster Progress
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Tracking market penetration maturity for {clusterName}.
          </p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-slate-900">{maturity.overall}%</span>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-extrabold">Overall Completion</p>
        </div>
      </div>

      <div className="space-y-5">
        {bars.map((bar, idx) => (
          <div key={idx} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg", bar.bg)}>
                  <bar.icon className={cn("w-3.5 h-3.5", bar.color.replace('bg-', 'text-'))} />
                </div>
                <span className="text-xs font-bold text-slate-700">{bar.label}</span>
              </div>
              <span className="text-xs font-black text-slate-900">{bar.value}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-1000", bar.color)}
                style={{ width: `${bar.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
