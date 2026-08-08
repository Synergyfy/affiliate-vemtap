'use client';

import {
  Users,
  CheckCircle2,
  TrendingUp,
  Clock,
  PlayCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useSalesMetrics } from '@/services/useSalesPipeline';
import { motion } from 'framer-motion';

export default function SalesPerformanceCard() {
  const { showToast } = useToast();
  const { data: metricsData, isLoading } = useSalesMetrics();
  const metrics = metricsData?.metrics;

  const handleAction = (label: string) => {
    showToast(`${label} feature coming soon`, 'info');
  };

  const stats = [
    {
      label: 'Leads Submitted',
      value: metrics?.leadsSubmitted ?? 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      onClick: () => handleAction('Leads'),
    },
    {
      label: 'Qualified',
      value: metrics?.qualifiedLeads ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      onClick: () => handleAction('Qualified leads'),
    },
    {
      label: 'Interested',
      value: metrics?.interestedLeads ?? 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      onClick: () => handleAction('Interested'),
    },
    {
      label: 'Follow-ups Due',
      value: metrics?.followUps ?? 0,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      onClick: () => handleAction('Follow-ups'),
    },
    {
      label: 'Demos',
      value: metrics?.demos ?? 0,
      icon: PlayCircle,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      onClick: () => handleAction('Demos'),
    },
    {
      label: 'Conversions',
      value: metrics?.conversions ?? 0,
      icon: CheckCircle2,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      onClick: () => handleAction('Conversions'),
    },
    {
      label: 'Invalid/Duplicate',
      value: (metrics?.invalid ?? 0) + (metrics?.duplicate ?? 0),
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      onClick: () => handleAction('Invalid/duplicate'),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-[28px] p-5 border border-slate-200 dark:border-slate-700 shadow-sm mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
          Today's Sales Activity
        </h3>
        <span className="text-[10px] font-bold text-slate-400">
          {metricsData?.date ? new Date(metricsData.date).toLocaleDateString() : ''}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, idx) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            onClick={stat.onClick}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all text-center",
              "hover:shadow-md active:scale-95",
              stat.bg,
              "dark:bg-slate-700/50",
            )}
          >
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
            {isLoading ? (
              <div className="w-6 h-5 bg-slate-200 dark:bg-slate-600 animate-pulse rounded" />
            ) : (
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {stat.value}
              </span>
            )}
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 leading-tight">
              {stat.label}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
