'use client';

import { motion } from 'framer-motion';
import { Zap, Power, Trash2, Edit3, Clock, ArrowRight } from 'lucide-react';
import ChannelBadge from '@/components/communication/ChannelBadge';
import { AutomationRule, LeadStatus, Lead, CHANNEL_LABELS } from '@/types/communication';
import { cn } from '@/lib/utils';

interface RuleCardProps {
  rule: AutomationRule;
  templateName?: string;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (rule: AutomationRule) => void;
  onDelete: (id: string) => void;
  index?: number;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  NOT_YET: 'Not Yet',
  VISITED: 'Visited',
  CONTACTED: 'Contacted',
  INTERESTED: 'Interested',
  DEMO_SCHEDULED: 'Demo Scheduled',
  DEMO_DONE: 'Demo Done',
  NOT_INTERESTED: 'Not Interested',
  CUSTOMER: 'Customer',
  CONVERTED: 'Converted',
  LOST: 'Lost',
};

function formatTrigger(rule: AutomationRule): string {
  switch (rule.trigger.type) {
    case 'STATUS_CHANGED':
      return `When status becomes "${STATUS_LABELS[rule.trigger.toStatus] || rule.trigger.toStatus}"`;
    case 'STATUS_STILL_AFTER_DAYS':
      return `Still "${STATUS_LABELS[rule.trigger.status] || rule.trigger.status}" after ${rule.trigger.waitDays} day${rule.trigger.waitDays > 1 ? 's' : ''}${rule.trigger.andNotSubscribed ? ' (not subscribed)' : ''}`;
    case 'SUBSCRIBED':
      return 'When a lead subscribes / becomes customer';
  }
}

export default function RuleCard({ rule, templateName, onToggle, onEdit, onDelete, index = 0 }: RuleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        'bg-white border rounded-2xl p-4 shadow-sm transition-all',
        rule.enabled ? 'border-slate-200' : 'border-slate-100 opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-xl',
            rule.enabled ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400',
          )}>
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{rule.name}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{rule.target}</p>
          </div>
        </div>
        <button
          onClick={() => onToggle(rule.id, !rule.enabled)}
          className={cn(
            'relative w-9 h-5 rounded-full transition-colors shrink-0',
            rule.enabled ? 'bg-blue-600' : 'bg-slate-300',
          )}
        >
          <span className={cn(
            'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
            rule.enabled ? 'translate-x-4' : 'translate-x-0',
          )} />
        </button>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-medium">{formatTrigger(rule)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <ChannelBadge channel={rule.channel} />
          {templateName && (
            <span className="font-medium truncate max-w-[200px]">{templateName}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <div className="flex-1" />
        <button
          onClick={() => onEdit(rule)}
          aria-label="Edit rule"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(rule.id)}
          aria-label="Delete rule"
          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
