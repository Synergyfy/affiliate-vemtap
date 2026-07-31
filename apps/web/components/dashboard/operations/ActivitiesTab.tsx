'use client';

import { 
  History, 
  Users, 
  PhoneCall, 
  PlayCircle, 
  Briefcase, 
  Rocket, 
  CheckCircle2, 
  MessageSquare,
  Search,
  Filter,
  CheckSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useActivities } from '@/services/useOperationsHooks';

const activityIconMap: Record<string, any> = {
  LEAD_CREATED: { icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  DEMO_SCHEDULED: { icon: PlayCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
  DEMO_COMPLETED: { icon: PlayCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ONBOARDING_STAGE_CHANGED: { icon: Rocket, color: 'text-orange-600', bg: 'bg-orange-50' },
  TASK_COMPLETED: { icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  BUSINESS_REFERRED: { icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
};

export default function ActivitiesTab() {
  const { showToast } = useToast();
  const { data: activitiesData, isLoading } = useActivities();
  const activities = Array.isArray(activitiesData) ? activitiesData : [];

  const handleAction = (action: string) => {
    showToast(`${action} action triggered`, 'info');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative flex-grow max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search activity logs..." 
            onChange={(e) => showToast(`Searching for ${e.target.value}`, 'info')}
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleAction('Open Activity Filters')}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Filter className="w-3 h-3" />
            Filter By Type
          </button>
        </div>
      </div>

      <div className="relative space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="relative pl-12">
              <div className="absolute left-0 top-0 w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
              <div className="h-24 bg-slate-50 animate-pulse rounded-3xl border border-slate-100" />
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="pl-12 text-slate-400 font-bold uppercase tracking-widest text-xs italic">
            No activity history yet.
          </div>
        ) : activities.map((activity) => {
          const config = activityIconMap[activity.type] || { icon: History, color: 'text-slate-600', bg: 'bg-slate-50' };
          const Icon = config.icon;

          return (
            <div key={activity.id} className="relative pl-12">
              <div className={cn(
                "absolute left-0 top-0 w-10 h-10 rounded-xl flex items-center justify-center z-10 shadow-sm border border-white",
                config.bg
              )}>
                <Icon className={cn("w-5 h-5", config.color)} />
              </div>
              
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex flex-col sm:flex-row justify-between gap-2 mb-2">
                  <h5 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{activity.title}</h5>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(activity.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">{activity.businessName || 'System'}</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-300" />
                  <button 
                    onClick={() => handleAction(`Viewing ${activity.title} Log`)}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-8">
        <button 
          onClick={() => handleAction('Loading more activities')}
          className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
        >
          Load More History
        </button>
      </div>
    </div>
  );
}
