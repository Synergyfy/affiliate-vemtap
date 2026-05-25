'use client';

import { 
  Calendar, 
  PlayCircle, 
  Video, 
  MapPin, 
  Clock, 
  User, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { useDemos, useCreateDemo, useUpdateDemo } from '@/services/useOperationsHooks';

export default function DemosTab() {
  const { showToast } = useToast();
  const { data: demos = [], isLoading } = useDemos();

  const createDemo = useCreateDemo();
  const updateDemo = useUpdateDemo();

  const handleAction = (action: string) => {
    showToast(`${action} action triggered`, 'info');
  };

  const handleScheduleDemo = async () => {
    const businessName = prompt('Business name:');
    if (!businessName) return;
    const date = prompt('Demo date (YYYY-MM-DD):');
    if (!date) return;
    try {
      await createDemo.mutateAsync({ businessName, date });
      showToast('Demo scheduled successfully', 'success');
    } catch {
      showToast('Failed to schedule demo', 'error');
    }
  };

  const handleCompleteDemo = async (id: string) => {
    try {
      await updateDemo.mutateAsync({ id, data: { status: 'COMPLETED' } });
      showToast('Demo marked as completed', 'success');
    } catch {
      showToast('Failed to update demo', 'error');
    }
  };

  const handleJoinMeeting = (url?: string) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      showToast('No meeting link available', 'info');
    }
  };

  const upcomingToday = demos.filter(d => {
    const today = new Date().toLocaleDateString();
    const demoDate = new Date(d.date).toLocaleDateString();
    return today === demoDate && d.status === 'SCHEDULED';
  }).length;

  const completedCount = demos.filter(d => d.status === 'COMPLETED').length;
  const conversionRate = demos.length > 0 ? Math.round((completedCount / demos.length) * 100) : 0;

  const demoStats = [
    { label: 'Total Scheduled', value: demos.length.toString(), icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, icon: PlayCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Upcoming Today', value: upcomingToday.toString(), icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Completed Demos', value: completedCount.toString(), icon: User, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <div className="grid lg:grid-cols-4 gap-6">
        {demoStats.map((stat, idx) => (
          <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-inner", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <h4 className="text-2xl font-black text-slate-900">{isLoading ? '...' : stat.value}</h4>
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">Upcoming Demos</h3>
        <Button 
          onClick={handleScheduleDemo}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-10 rounded-xl px-6"
        >
          Schedule New Demo
        </Button>
      </div>

      {/* Demos Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-[32px] border border-slate-100" />
          ))
        ) : demos.length === 0 ? (
          <div className="col-span-full text-center p-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-slate-900 mb-2">No Upcoming Demos</h4>
            <p className="text-sm text-slate-500">You don&apos;t have any demonstrations scheduled at the moment.</p>
          </div>
        ) : demos.map((demo) => (
          <div key={demo.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-50 transition-all group overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  demo.meetingUrl ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                )}>
                  {demo.meetingUrl ? 'Virtual' : 'On-site'} Demo
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    demo.status === 'SCHEDULED' ? "bg-blue-500 animate-pulse" : "bg-emerald-500"
                  )} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{demo.status}</span>
                </div>
              </div>

              <h4 className="text-lg font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{demo.businessName}</h4>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
                <User className="w-3.5 h-3.5" />
                Presenter: {demo.agent?.fullName || 'You'}
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                <div className="flex items-center gap-3 text-xs">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-700">{new Date(demo.date).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>45 min session</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {demo.meetingUrl ? <Video className="w-4 h-4 text-slate-400" /> : <MapPin className="w-4 h-4 text-slate-400" />}
                  <span className="truncate">{demo.meetingUrl || 'Location TBD'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => demo.status === 'SCHEDULED' ? handleCompleteDemo(demo.id) : handleAction('Viewing Details')}
                  className="flex-grow bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest h-11 rounded-xl shadow-lg transition-all"
                >
                  {demo.status === 'SCHEDULED' ? 'Mark Completed' : demo.meetingUrl ? 'Join Meeting' : 'View Details'}
                </Button>
                <Button 
                  onClick={() => handleAction('Options')}
                  variant="outline" 
                  className="p-0 w-11 h-11 border-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-50"
                >
                  <MoreHorizontal className="w-5 h-5 text-slate-400" />
                </Button>
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
