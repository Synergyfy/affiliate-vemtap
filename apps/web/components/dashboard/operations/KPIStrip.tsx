'use client';

import { motion } from 'framer-motion';
import { 
  Users, 
  PhoneCall, 
  PlayCircle, 
  Rocket,
  ListTodo,
  CalendarClock,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useLeadStats } from '@/services/useLeadsHooks';
import { useMyBusinesses } from '@/services/useBusinessHooks';
import { useOperationsStats } from '@/services/useOperationsHooks';

export default function KPIStrip() {
  const { data: leadStats, isLoading: isLoadingLeads } = useLeadStats();
  const { data: businessData, isLoading: isLoadingBusinesses } = useMyBusinesses({ limit: 1 });
  const { data: operationsStats, isLoading: isLoadingOperations } = useOperationsStats();

  const isLoading = isLoadingLeads || isLoadingBusinesses || isLoadingOperations;

  const stats = [
    { label: 'Total Leads', value: leadStats?.total ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Total' },
    { label: 'Follow-ups', value: leadStats?.potential ?? 0, icon: PhoneCall, color: 'text-orange-600', bg: 'bg-orange-50', trend: 'Potential' },
    { label: 'Interested', value: leadStats?.interested ?? 0, icon: PlayCircle, color: 'text-purple-600', bg: 'bg-purple-50', trend: 'Warm' },
    { label: 'Businesses Won', value: businessData?.meta?.total ?? 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Total' },
    { label: 'Contacted', value: leadStats?.contacted ?? 0, icon: Rocket, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Active' },
    { label: 'Pending Tasks', value: operationsStats?.pendingTasks ?? 0, icon: ListTodo, color: 'text-orange-600', bg: 'bg-orange-50', trend: 'Open' },
    { label: 'Upcoming Demos', value: operationsStats?.upcomingDemos ?? 0, icon: CalendarClock, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Scheduled' },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {stats.map((kpi, idx) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
          className="flex-shrink-0 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm min-w-[180px] hover:shadow-md transition-shadow cursor-default"
        >
          <div className="flex justify-between items-start mb-3">
            <div className={cn("p-2 rounded-xl", kpi.bg)}>
              <kpi.icon className={cn("w-5 h-5", kpi.color)} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.trend}</span>
          </div>
          <div>
            {isLoading ? (
              <div className="h-8 w-12 bg-slate-100 animate-pulse rounded-lg mb-1" />
            ) : (
              <h4 className="text-2xl font-black text-slate-900">{kpi.value}</h4>
            )}
            <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
