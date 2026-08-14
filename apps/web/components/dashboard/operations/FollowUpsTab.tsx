'use client';

import { useState } from 'react';
import { 
  PhoneCall, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MoreHorizontal,
  RefreshCw,
  Calendar,
  List,
  X,
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { useLeads, useUpdateLead } from '@/services/useLeadsHooks';
import { motion, AnimatePresence } from 'framer-motion';

export default function FollowUpsTab() {
  const { showToast } = useToast();
  const { data: response, isLoading } = useLeads({ status: 'CONTACTED' });
  const leads = response?.data || [];
  const updateLead = useUpdateLead();
  const [viewMode, setViewMode] = useState<'list' | 'daily' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showRescheduleModal, setShowRescheduleModal] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState('');

  // Filter leads that have follow-up dates and are not completed
  const followUps = leads.filter(lead => lead.followUpDate).map(lead => ({
    id: lead.id,
    business: lead.businessName,
    contact: lead.contactName,
    dueDate: lead.followUpDate ? new Date(lead.followUpDate).toLocaleString() : 'N/A',
    priority: lead.priority ? lead.priority.charAt(0) + lead.priority.slice(1).toLowerCase() : 'Medium',
    status: 'Pending',
    leadData: lead,
  }));

  const handleAction = (action: string) => {
    showToast(`${action} action triggered`, 'info');
  };

  const handleComplete = async (id: string) => {
    try {
      await updateLead.mutateAsync({ id, data: { status: 'CUSTOMER' as any } });
      showToast('Follow-up marked as completed', 'success');
    } catch {
      showToast('Failed to complete follow-up', 'error');
    }
  };

  const handleReschedule = async (id: string) => {
    if (!rescheduleDate) return;
    try {
      await updateLead.mutateAsync({ id, data: { followUpDate: rescheduleDate } });
      showToast('Follow-up rescheduled', 'success');
      setShowRescheduleModal(null);
      setRescheduleDate('');
      setRescheduleNote('');
    } catch {
      showToast('Failed to reschedule follow-up', 'error');
    }
  };

  const changeDay = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + offset);
    setCurrentDate(newDate);
  };

  const todayStr = new Date().toLocaleDateString();
  const currentDateStr = currentDate.toLocaleDateString();

  const dailyFollowUps = followUps.filter(f => {
    const fDate = f.leadData.followUpDate ? new Date(f.leadData.followUpDate).toLocaleDateString() : '';
    return fDate === currentDateStr;
  });

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const hasFollowUpOnDay = (day: Date) => {
    const dayStr = day.toLocaleDateString();
    return followUps.some(f => {
      const fDate = f.leadData.followUpDate ? new Date(f.leadData.followUpDate).toLocaleDateString() : '';
      return fDate === dayStr;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => { setViewMode('daily'); setCurrentDate(new Date()); }}
            variant="outline" 
            className={cn("text-xs font-bold h-10 rounded-xl px-6", viewMode === 'daily' ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-500")}
          >
            <List className="w-3.5 h-3.5 mr-1.5" />
            Daily View
          </Button>
          <Button 
            onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
            variant="outline" 
            className={cn("border-slate-200 text-xs font-bold h-10 rounded-xl px-6", viewMode === 'calendar' ? "bg-blue-600 text-white border-blue-600" : "text-slate-500")}
          >
            <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
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

      {/* Follow-ups Content */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 p-4">
            <button onClick={() => changeDay(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900">{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p className="text-[10px] font-bold text-slate-400">{dailyFollowUps.length} follow-up{dailyFollowUps.length !== 1 ? 's' : ''} scheduled</p>
            </div>
            <button onClick={() => changeDay(1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          {dailyFollowUps.length === 0 ? (
            <div className="text-center p-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-slate-900 mb-2">All Clear for Today</h4>
              <p className="text-sm text-slate-500">No follow-ups scheduled for this day.</p>
            </div>
          ) : dailyFollowUps.map((item) => (
            <FollowUpCard key={item.id} item={item} onComplete={handleComplete} onReschedule={(id) => { setShowRescheduleModal(id); setRescheduleDate(''); }} />
          ))}
        </div>
      )}

      {viewMode === 'calendar' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-100 p-4">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <p className="text-sm font-bold text-slate-900">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center py-2">{day}</div>
            ))}
            {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {getCalendarDays().map(day => {
              const hasFollowUp = hasFollowUpOnDay(day);
              const isToday = day.toLocaleDateString() === todayStr;
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => { setCurrentDate(day); setViewMode('daily'); }}
                  className={cn(
                    "aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all",
                    isToday ? "bg-blue-600 text-white" : hasFollowUp ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-600"
                  )}
                >
                  {day.getDate()}
                  {hasFollowUp && !isToday && <div className="w-1 h-1 rounded-full bg-blue-500 mt-0.5" />}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-400">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-600" /> Today</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-100 border border-blue-300" /> Has Follow-ups</div>
          </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="grid gap-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-50 animate-pulse rounded-[24px] border border-slate-100" />
            ))
          ) : followUps.length === 0 ? (
            <div className="text-center p-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-slate-900 mb-2">No More High Priority Follow-ups</h4>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                You&apos;ve cleared your most urgent follow-ups for today. Great job staying on top of your deals!
              </p>
            </div>
          ) : followUps.map((item) => (
            <FollowUpCard key={item.id} item={item} onComplete={handleComplete} onReschedule={(id) => { setShowRescheduleModal(id); setRescheduleDate(''); }} />
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      <AnimatePresence>
        {showRescheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowRescheduleModal(null); setRescheduleDate(''); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden p-8"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-6">Reschedule Follow-up</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Date</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Note (optional)</label>
                  <textarea
                    value={rescheduleNote}
                    onChange={(e) => setRescheduleNote(e.target.value)}
                    placeholder="Reason for rescheduling..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm min-h-[80px] resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => { setShowRescheduleModal(null); setRescheduleDate(''); setRescheduleNote(''); }}
                  className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReschedule(showRescheduleModal)}
                  disabled={!rescheduleDate}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50"
                >
                  Reschedule
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FollowUpCard({ item, onComplete, onReschedule }: { item: any; onComplete: (id: string) => void; onReschedule: (id: string) => void }) {
  return (
    <div className="bg-white p-6 rounded-[24px] border border-slate-100 hover:border-blue-100 shadow-sm transition-all group">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
            item.priority === 'High' ? "bg-red-50 text-red-600" : 
            item.priority === 'Medium' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
          )}>
            <PhoneCall className="w-6 h-6" />
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
              item.status === 'Pending' ? "bg-orange-50 text-orange-600 border border-orange-100" : "bg-slate-50 text-slate-500"
            )}>
              {item.status}
            </span>
          </div>
          <div className="col-span-2 md:col-span-2 lg:flex items-center gap-2">
            <Button 
              onClick={() => onComplete(item.id)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest h-10 px-4 rounded-xl flex items-center gap-2"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Complete
            </Button>
            <Button 
              onClick={() => onReschedule(item.id)}
              variant="outline" 
              className="border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 text-[10px] font-black uppercase tracking-widest h-10 px-4 rounded-xl"
            >
              Reschedule
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
