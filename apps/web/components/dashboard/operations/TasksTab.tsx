'use client';

import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  Plus, 
  MoreHorizontal, 
  ChevronRight,
  Filter,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';

const tasks = [
  { id: 1, title: 'Follow up with Nexus Retail', category: 'Leads', priority: 'High', due: 'Today, 2:00 PM', status: 'Pending' },
  { id: 2, title: 'Prepare Demo Deck for Stellar Tech', category: 'Demos', priority: 'Medium', due: 'Today, 4:00 PM', status: 'Pending' },
  { id: 3, title: 'Verify QR deployment for Blue Diamond', category: 'Onboarding', priority: 'Critical', due: 'Overdue', status: 'Pending' },
  { id: 4, title: 'Renew subscription for Green Valley', category: 'Businesses', priority: 'Low', due: 'Tomorrow', status: 'Pending' },
];

export default function TasksTab() {
  const { showToast } = useToast();

  const handleAction = (action: string) => {
    showToast(`${action} action triggered`, 'info');
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: '18', color: 'text-slate-900', bg: 'bg-white' },
          { label: 'Overdue', value: '3', color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Due Today', value: '5', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', value: '12', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, idx) => (
          <div key={idx} className={cn("p-6 rounded-3xl border border-slate-100 shadow-sm", stat.bg)}>
            <h4 className="text-2xl font-black text-slate-900 leading-none mb-1">{stat.value}</h4>
            <p className={cn("text-[10px] font-black uppercase tracking-widest", stat.color)}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => handleAction('Create Task')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-10 rounded-xl px-6 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Task
          </Button>
          <Button 
            onClick={() => handleAction('Open Filters')}
            variant="outline" 
            className="border-slate-200 text-slate-500 text-xs font-bold h-10 rounded-xl px-6 hover:bg-slate-50 flex items-center gap-2"
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500">May 12, 2026</span>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
        {tasks.map((task) => (
          <div key={task.id} className="p-6 hover:bg-slate-50 transition-colors group flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-grow">
              <button 
                onClick={() => showToast(`Task: "${task.title}" completed!`, 'success')}
                className="w-6 h-6 rounded-lg border-2 border-slate-200 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-all group/check shrink-0"
              >
                <CheckSquare className="w-4 h-4 text-blue-600 opacity-0 group-hover/check:opacity-100" />
              </button>
              <div>
                <h5 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{task.title}</h5>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.category}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    task.priority === 'Critical' ? "text-red-600" :
                    task.priority === 'High' ? "text-orange-600" : "text-blue-600"
                  )}>{task.priority} Priority</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 shrink-0">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Due Date</p>
                <p className={cn(
                  "text-xs font-bold",
                  task.due === 'Overdue' ? "text-red-600" : "text-slate-700"
                )}>{task.due}</p>
              </div>
              <button 
                onClick={() => handleAction('Options')}
                className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600 transition-all"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
