'use client';

import { Building2, Users, Target, UserCheck, TrendingUp, Footprints } from 'lucide-react';
import { MarketMappingStats } from '@/types/market-mapping';

interface TopStatsProps {
  stats: MarketMappingStats;
}

export default function TopStats({ stats }: TopStatsProps) {
  const items = [
    { label: 'Businesses Mapped', value: stats.businessesMapped.toLocaleString(), icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Vemtap Customers', value: stats.vemtapCustomers.toLocaleString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Prospects', value: stats.prospects.toLocaleString(), icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Assigned Affiliates', value: stats.assignedAffiliates.toLocaleString(), icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Avg Penetration', value: `${stats.averagePenetration}%`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: "Today's Visits", value: stats.todayVisits.toLocaleString(), icon: Footprints, color: 'text-sky-600', bg: 'bg-sky-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map(item => (
        <div key={item.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <div className={item.bg + ' p-2 rounded-xl'}>
            <item.icon className={`w-5 h-5 ${item.color}`} />
          </div>
          <div>
            <p className="text-lg font-extrabold text-slate-900 leading-tight">{item.value}</p>
            <p className="text-[11px] font-semibold text-slate-500">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
