'use client';

import { PlannedVisit, getCompletenessScore } from '@/types/affiliate-market-mapping';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, ChevronRight, Star, Phone, UserCircle, Crown } from 'lucide-react';

interface BusinessListTableProps {
  visits: PlannedVisit[];
  onSelectVisit: (visit: PlannedVisit) => void;
}

export default function BusinessListTable({ visits, onSelectVisit }: BusinessListTableProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'NOT_YET': return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', label: 'To Visit', border: 'border-amber-200' };
      case 'VISITED': return { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Visited', border: 'border-blue-200' };
      case 'CONTACTED': return { icon: Phone, color: 'text-purple-500', bg: 'bg-purple-50', label: 'Contacted', border: 'border-purple-200' };
      case 'INTERESTED': return { icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Interested', border: 'border-emerald-200' };
      case 'NOT_INTERESTED': return { icon: UserCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Not Interested', border: 'border-red-200' };
      case 'CUSTOMER': return { icon: Crown, color: 'text-orange-500', bg: 'bg-orange-50', label: 'Customer', border: 'border-orange-200' };
      default: return { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50', label: status, border: 'border-slate-200' };
    }
  };

  if (visits.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <p className="text-sm text-slate-400 font-medium">No businesses found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visits.map(visit => {
        const score = getCompletenessScore(visit);
        const status = getStatusConfig(visit.status);
        const StatusIcon = status.icon;
        return (
          <button
            key={visit.id}
            onClick={() => onSelectVisit(visit)}
            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-left hover:border-blue-200 hover:ring-2 hover:ring-blue-50 transition-all"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", status.bg)}>
              <StatusIcon className={cn("w-4 h-4", status.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-semibold truncate", visit.isPlaceholder ? "text-slate-400 italic" : "text-slate-800")}>{visit.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{visit.category}{visit.address ? ` · ${visit.address}` : ''}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={cn("w-2.5 h-2.5", i <= Math.round((score / 19) * 5) ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                ))}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </button>
        );
      })}
    </div>
  );
}
