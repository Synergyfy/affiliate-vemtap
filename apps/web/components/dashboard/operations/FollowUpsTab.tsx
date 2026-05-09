'use client';

import { 
  PhoneCall, 
  MessageCircle, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Calendar as CalendarIcon,
  MoreHorizontal,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';

const followUps = [
  { id: 1, business: 'Nexus Retail Group', contact: 'David Chen', type: 'Call', dueDate: 'Today, 2:00 PM', priority: 'High', status: 'Pending' },
  { id: 2, business: 'Blue Diamond Hotels', contact: 'Sarah Miller', type: 'Email', dueDate: 'Today, 4:30 PM', priority: 'Medium', status: 'Pending' },
  { id: 3, business: 'Z-Global Logistics', contact: 'James Wilson', type: 'WhatsApp', dueDate: 'Tomorrow, 10:00 AM', priority: 'High', status: 'Upcoming' },
  { id: 4, business: 'Green Valley Farms', contact: 'Emma Thompson', type: 'Meeting', dueDate: 'May 12, 11:00 AM', priority: 'Low', status: 'Upcoming' },
];

export default function FollowUpsTab() {
  const { showToast } = useToast();

  const handleAction = (action: string) => {
    showToast(`${action} action triggered`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => handleAction('Daily View')}
            variant="outline" 
            className="bg-blue-600 text-white border-blue-600 text-xs font-bold h-10 rounded-xl px-6"
          >
            Daily View
          </Button>
          <Button 
            onClick={() => handleAction('Calendar View')}
            variant="outline" 
            className="border-slate-200 text-slate-500 text-xs font-bold h-10 rounded-xl px-6 hover:bg-slate-50"
          >
            Calendar
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400">Sort by:</span>
          <select 
            onChange={(e) => showToast(`Sorting by ${e.target.value}`, 'info')}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option>Priority (High to Low)</option>
            <option>Due Date (Soonest)</option>
          </select>
        </div>
      </div>

      {/* Follow-ups List */}
      <div className="grid gap-4">
        {followUps.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-[24px] border border-slate-100 hover:border-blue-100 shadow-sm transition-all group">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                  item.priority === 'High' ? "bg-red-50 text-red-600" : 
                  item.priority === 'Medium' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                )}>
                  {item.type === 'Call' && <PhoneCall className="w-6 h-6" />}
                  {item.type === 'Email' && <Mail className="w-6 h-6" />}
                  {item.type === 'WhatsApp' && <MessageCircle className="w-6 h-6" />}
                  {item.type === 'Meeting' && <CalendarIcon className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">{item.business}</h4>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                      item.priority === 'High' ? "bg-red-100 text-red-700" : 
                      item.priority === 'Medium' ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {item.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Contact: {item.contact}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:flex lg:items-center gap-8 lg:gap-12 flex-grow justify-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Due Date
                  </p>
                  <p className="text-xs font-bold text-slate-700">{item.dueDate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Status
                  </p>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                    item.status === 'Pending' ? "bg-orange-50 text-orange-600 border border-orange-100" : "bg-slate-50 text-slate-500 border border-slate-100"
                  )}>
                    {item.status}
                  </span>
                </div>
                <div className="col-span-2 md:col-span-2 lg:flex items-center gap-2">
                  <Button 
                    onClick={() => handleAction(`Complete ${item.business}`)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest h-10 px-4 rounded-xl flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Complete
                  </Button>
                  <Button 
                    onClick={() => handleAction(`Reschedule ${item.business}`)}
                    variant="outline" 
                    className="border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 text-[10px] font-black uppercase tracking-widest h-10 px-4 rounded-xl"
                  >
                    Reschedule
                  </Button>
                  <button 
                    onClick={() => handleAction(`Options for ${item.business}`)}
                    className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State / Bottom Info */}
      <div className="text-center p-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h4 className="text-lg font-bold text-slate-900 mb-2">No More High Priority Follow-ups</h4>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
          You&apos;ve cleared your most urgent follow-ups for today. Great job staying on top of your deals!
        </p>
        <Button 
          onClick={() => handleAction('View History')}
          variant="outline" 
          className="border-slate-200 text-xs font-bold h-11 rounded-xl px-8"
        >
          View All Completed Activities
        </Button>
      </div>
    </div>
  );
}
