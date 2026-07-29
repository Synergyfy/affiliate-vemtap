'use client';

import { TerritoryStats } from '@/types/affiliate-market-mapping';
import { Briefcase, Target, Map, Users, Star, Crown, TrendingUp, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TerritoryStatsCardsProps {
  stats: TerritoryStats;
}

export default function TerritoryStatsCards({ stats }: TerritoryStatsCardsProps) {
  const cards = [
    { label: 'Businesses', value: stats.totalAssigned, icon: Briefcase, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    { label: 'Visited Today', value: stats.visitedToday, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Remaining', value: stats.remainingInCluster, icon: Map, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Customers', value: stats.customersAcquired, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Prospects', value: stats.prospects, icon: Star, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { label: 'Anchor Businesses', value: stats.anchorBusinesses, icon: Crown, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: 'Market Penetration', value: `${stats.marketPenetration}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { label: 'Completion', value: `${stats.clusterCompletion}%`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((card, idx) => (
        <div key={idx} className={cn("rounded-2xl p-4 flex flex-col items-center justify-center text-center border", card.bg, card.border)}>
          <card.icon className={cn("w-5 h-5 mb-2 opacity-80", card.color)} />
          <h4 className="text-xl font-black text-slate-900 leading-none mb-1">{card.value}</h4>
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
