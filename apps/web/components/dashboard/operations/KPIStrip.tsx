'use client';

import { motion } from 'framer-motion';
import { 
  Users, 
  PhoneCall, 
  PlayCircle, 
  CheckCircle2, 
  Rocket, 
  AlertCircle, 
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const kpis = [
  { label: 'New Leads', value: '24', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
  { label: 'Follow-ups Due', value: '8', icon: PhoneCall, color: 'text-orange-600', bg: 'bg-orange-50', trend: '3 High' },
  { label: 'Scheduled Demos', value: '5', icon: PlayCircle, color: 'text-purple-600', bg: 'bg-purple-50', trend: 'Today' },
  { label: 'Businesses Won', value: '12', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '₦1.2M' },
  { label: 'Active Onboarding', value: '7', icon: Rocket, color: 'text-blue-600', bg: 'bg-blue-50', trend: '2 Near Go-Live' },
  { label: 'Support Alerts', value: '3', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', trend: 'Critical' },
  { label: 'Renewals Due', value: '15', icon: RefreshCw, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '30 Days' },
];

export default function KPIStrip() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {kpis.map((kpi, idx) => (
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
            <h4 className="text-2xl font-black text-slate-900">{kpi.value}</h4>
            <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
