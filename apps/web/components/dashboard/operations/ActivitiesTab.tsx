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
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const activities = [
  { id: 1, type: 'demo', title: 'Demo Completed', business: 'Nexus Retail Group', time: '10:45 AM', date: 'Today', icon: PlayCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 2, type: 'lead', title: 'New Lead Created', business: 'Stellar Tech Corp', time: '09:30 AM', date: 'Today', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 3, type: 'onboarding', title: 'QR Setup Completed', business: 'Blue Diamond Hotels', time: '04:15 PM', date: 'Yesterday', icon: Rocket, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 4, type: 'call', title: 'Follow-up Call Logged', business: 'Green Valley Farms', time: '11:20 AM', date: 'Yesterday', icon: PhoneCall, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 5, type: 'business', title: 'Subscription Renewed', business: 'Z-Global Logistics', time: '02:00 PM', date: 'May 10', icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
];

export default function ActivitiesTab() {
  const { showToast } = useToast();

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
        {activities.map((activity) => (
          <div key={activity.id} className="relative pl-12">
            <div className={cn(
              "absolute left-0 top-0 w-10 h-10 rounded-xl flex items-center justify-center z-10 shadow-sm border border-white",
              activity.bg
            )}>
              <activity.icon className={cn("w-5 h-5", activity.color)} />
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex flex-col sm:flex-row justify-between gap-2 mb-2">
                <h5 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{activity.title}</h5>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activity.date}, {activity.time}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">{activity.business}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <button 
                  onClick={() => handleAction(`Viewing ${activity.title} Log`)}
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                >
                  View Full Log
                </button>
              </div>
            </div>
          </div>
        ))}
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
