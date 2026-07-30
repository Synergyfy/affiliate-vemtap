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
import { useTasks, useCreateTask, useUpdateTask } from '@/services/useOperationsHooks';

export default function TasksTab() {
  const { showToast } = useToast();
  const { data: tasksData, isLoading } = useTasks();
  const tasks = Array.isArray(tasksData) ? tasksData : [];

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const handleAction = (action: string) => {
    showToast(`${action} action triggered`, 'info');
  };

  const handleCreateTask = async () => {
    const title = prompt('Task title:');
    if (!title) return;
    try {
      await createTask.mutateAsync({ title });
      showToast('Task created successfully', 'success');
    } catch {
      showToast('Failed to create task', 'error');
    }
  };

  const handleCompleteTask = async (id: string, title: string) => {
    try {
      await updateTask.mutateAsync({ id, data: { status: 'COMPLETED' } });
      showToast(`Task "${title}" completed`, 'success');
    } catch {
      showToast('Failed to update task', 'error');
    }
  };

  const overdueCount = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length;
  const todayCount = tasks.filter(t => {
    if (!t.dueDate) return false;
    const date = new Date(t.dueDate);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }).length;
  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: tasks.length.toString(), color: 'text-slate-900', bg: 'bg-white' },
          { label: 'Overdue', value: overdueCount.toString(), color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Due Today', value: todayCount.toString(), color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', value: completedCount.toString(), color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, idx) => (
          <div key={idx} className={cn("p-6 rounded-3xl border border-slate-100 shadow-sm", stat.bg)}>
            <h4 className="text-2xl font-black text-slate-900 leading-none mb-1">{isLoading ? '...' : stat.value}</h4>
            <p className={cn("text-[10px] font-black uppercase tracking-widest", stat.color)}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleCreateTask}
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
          <span className="text-xs font-bold text-slate-500">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-50 animate-pulse" />
          ))
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <CheckSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No tasks found</p>
          </div>
        ) : tasks.map((task) => {
          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
          
          return (
            <div key={task.id} className="p-6 hover:bg-slate-50 transition-colors group flex items-center justify-between gap-6">
              <div className="flex items-center gap-4 flex-grow">
                <button 
                  onClick={() => task.status !== 'COMPLETED' && handleCompleteTask(task.id, task.title)}
                  className={cn(
                    "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all group/check shrink-0",
                    task.status === 'COMPLETED' ? "bg-emerald-500 border-emerald-500" : "border-slate-200 hover:border-blue-500 hover:bg-blue-50"
                  )}
                >
                  <CheckSquare className={cn(
                    "w-4 h-4",
                    task.status === 'COMPLETED' ? "text-white" : "text-blue-600 opacity-0 group-hover/check:opacity-100"
                  )} />
                </button>
                <div>
                  <h5 className={cn(
                    "text-sm font-bold mb-1 group-hover:text-blue-600 transition-colors",
                    task.status === 'COMPLETED' ? "text-slate-400 line-through" : "text-slate-900"
                  )}>{task.title}</h5>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.assignedTo?.fullName || 'Assigned to You'}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      task.priority === 'HIGH' ? "text-red-600" :
                      task.priority === 'MEDIUM' ? "text-orange-600" : "text-blue-600"
                    )}>{task.priority} Priority</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Due Date</p>
                  <p className={cn(
                    "text-xs font-bold",
                    isOverdue ? "text-red-600" : "text-slate-700"
                  )}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</p>
                </div>
                <button 
                  onClick={() => handleAction('Options')}
                  className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
