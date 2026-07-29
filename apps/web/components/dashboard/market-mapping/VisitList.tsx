'use client';

import { PlannedVisit } from '@/types/affiliate-market-mapping';
import { cn } from '@/lib/utils';
import { Clock, MapPin, CheckCircle2, Calendar, ChevronRight } from 'lucide-react';

interface VisitListProps {
  visits: PlannedVisit[];
  onSelectVisit: (visit: PlannedVisit) => void;
}

export default function VisitList({ visits, onSelectVisit }: VisitListProps) {
  const waitingVisits = visits.filter(v => v.status === 'NOT_YET');
  const completedVisits = visits.filter(v => v.status !== 'NOT_YET');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NOT_YET': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'VISITED': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'CONTACT_MADE': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'MEETING_SCHEDULED': return <Calendar className="w-4 h-4 text-purple-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'NOT_YET': return 'Waiting for Visit';
      case 'VISITED': return 'Visited';
      case 'CONTACT_MADE': return 'Contact Made';
      case 'MEETING_SCHEDULED': return 'Meeting Scheduled';
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-600" />
          Today's Field Execution
        </h3>
        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
          {completedVisits.length} / {visits.length} Done
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {visits.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-900">No visits planned yet</p>
            <p className="text-xs text-slate-500 mt-1">Use the "Plan My Day" tool above to add businesses to your list.</p>
          </div>
        ) : (
          <>
            {/* Waiting Section */}
            {waitingVisits.length > 0 && (
              <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Up Next ({waitingVisits.length})</span>
              </div>
            )}
            {waitingVisits.map(visit => (
              <button
                key={visit.id}
                onClick={() => onSelectVisit(visit)}
                className="w-full text-left p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5",
                    visit.isPlaceholder ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                  )}>
                    {getStatusIcon(visit.status)}
                  </div>
                  <div>
                    <h4 className={cn("text-sm font-bold", visit.isPlaceholder ? "text-amber-700 italic" : "text-slate-900")}>
                      {visit.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{visit.category}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                        {getStatusLabel(visit.status)}
                      </span>
                      {visit.isPlaceholder && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          Needs Data Capture
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}

            {/* Completed Section */}
            {completedVisits.length > 0 && (
              <div className="px-5 py-2 bg-emerald-50 border-y border-emerald-100 sticky top-0 z-10">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">Completed ({completedVisits.length})</span>
              </div>
            )}
            {completedVisits.map(visit => (
              <button
                key={visit.id}
                onClick={() => onSelectVisit(visit)}
                className="w-full text-left p-5 hover:bg-slate-50 transition-colors flex items-center justify-between group opacity-75"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    {getStatusIcon(visit.status)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 line-through decoration-slate-300">
                      {visit.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{visit.category}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {getStatusLabel(visit.status)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-slate-200 transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
