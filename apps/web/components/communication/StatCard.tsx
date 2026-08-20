'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
  bg?: string;
  hint?: string;
  index?: number;
  className?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = 'text-blue-600',
  bg = 'bg-blue-50',
  hint,
  index = 0,
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn('bg-white p-5 rounded-3xl border border-slate-200 shadow-sm', className)}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <div className={cn('p-2.5 rounded-2xl', bg)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
      </div>
      <h3 className="text-3xl font-black text-slate-900 tracking-tight font-mono">{value}</h3>
      {hint && <p className="text-xs text-slate-500 mt-1 font-medium">{hint}</p>}
    </motion.div>
  );
}