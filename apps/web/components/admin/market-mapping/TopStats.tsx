'use client';

import { motion } from 'framer-motion';
import { 
  MapPin, 
  Layers, 
  Building2, 
  CheckCircle2, 
  Users, 
  Target, 
  Crown, 
  UserCheck, 
  TrendingUp, 
  Footprints, 
  UserPlus 
} from 'lucide-react';
import { MarketMappingStats } from '@/types/market-mapping';
import { cn } from '@/lib/utils';

interface TopStatsProps {
  stats: MarketMappingStats;
}

export default function TopStats({ stats }: TopStatsProps) {
  const statItems = [
    { label: 'Commercial Areas', value: stats.commercialAreas.toLocaleString(), icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Commercial Clusters', value: stats.commercialClusters.toLocaleString(), icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Businesses Mapped', value: stats.businessesMapped.toLocaleString(), icon: Building2, color: 'text-slate-700', bg: 'bg-slate-100' },
    { label: 'Verified Businesses', value: stats.verifiedBusinesses.toLocaleString(), icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Vemtap Customers', value: stats.vemtapCustomers.toLocaleString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Prospects', value: stats.prospects.toLocaleString(), icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Anchor Businesses', value: stats.anchorBusinesses.toLocaleString(), icon: Crown, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Assigned Affiliates', value: stats.assignedAffiliates.toLocaleString(), icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Avg Penetration', value: `${stats.averagePenetration}%`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: "Today's Visits", value: stats.todayVisits.toLocaleString(), icon: Footprints, color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: "Today's New Customers", value: stats.todayNewCustomers.toLocaleString(), icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-3 mb-6">
      {statItems.map((item, idx) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.03 }}
          className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all cursor-default"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate" title={item.label}>
              {item.label}
            </span>
            <div className={cn("p-1.5 rounded-lg shrink-0", item.bg)}>
              <item.icon className={cn("w-3.5 h-3.5", item.color)} />
            </div>
          </div>
          <h4 className="text-lg font-extrabold text-slate-900 leading-tight">
            {item.value}
          </h4>
        </motion.div>
      ))}
    </div>
  );
}
