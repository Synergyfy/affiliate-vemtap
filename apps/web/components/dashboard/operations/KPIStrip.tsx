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
  const { isLoading: isLoadingBusinesses } = useMyBusinesses({ limit: 1 });
  const { data: operationsStats, isLoading: isLoadingOperations } = useOperationsStats();

  const isLoading = isLoadingLeads || isLoadingBusinesses || isLoadingOperations;

  const stats = [
    { label: 'Total Leads', value: leadStats?.total ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Total' },
    { label: 'To Visit', value: leadStats?.notVisited ?? 0, icon: PhoneCall, color: 'text-orange-600', bg: 'bg-orange-50', trend: 'Not visited' },
    { label: 'Interested', value: leadStats?.byStatus?.INTERESTED ?? 0, icon: PlayCircle, color: 'text-purple-600', bg: 'bg-purple-50', trend: 'Warm' },
    { label: 'Visits', value: leadStats?.visited ?? 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Visited' },
    { label: 'Contacted', value: leadStats?.byStatus?.CONTACTED ?? 0, icon: Rocket, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Active' },
    { label: 'Pending Tasks', value: operationsStats?.pendingTasks ?? 0, icon: ListTodo, color: 'text-orange-600', bg: 'bg-orange-50', trend: 'Open' },
    { label: 'Upcoming Demos', value: operationsStats?.upcomingDemos ?? 0, icon: CalendarClock, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Scheduled' },
  ];

  return (
    <div className="grid grid-cols-2 sm:flex sm:gap-4 sm:overflow-x-auto pb-4 scrollbar-hide gap-3">
      {stats.map((kpi, idx) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm sm:min-w-[180px] hover:shadow-md transition-shadow cursor-default"
        >
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <div className={cn("p-1.5 sm:p-2 rounded-xl", kpi.bg)}>
              <kpi.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", kpi.color)} />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.trend}</span>
          </div>
          <div>
            {isLoading ? (
              <div className="h-6 sm:h-8 w-12 bg-slate-100 animate-pulse rounded-lg mb-1" />
            ) : (
              <h4 className="text-lg sm:text-2xl font-black text-slate-900">{kpi.value}</h4>
            )}
            <p className="text-[10px] sm:text-xs font-medium text-slate-500">{kpi.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
