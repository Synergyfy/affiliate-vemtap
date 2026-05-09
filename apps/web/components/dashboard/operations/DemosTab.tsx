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

const demos = [
  { 
    id: 1, 
    business: 'Nexus Retail Group', 
    type: 'Virtual', 
    date: 'Today, 2:00 PM', 
    duration: '45 min', 
    presenter: 'You', 
    status: 'Confirmed',
    location: 'Zoom Meeting'
  },
  { 
    id: 2, 
    business: 'Stellar Tech Corp', 
    type: 'On-site', 
    date: 'Tomorrow, 10:00 AM', 
    duration: '1h 30m', 
    presenter: 'Alex Johnson', 
    status: 'Scheduled',
    location: 'Ikeja City Mall, Lagos'
  },
  { 
    id: 3, 
    business: 'Blue Diamond Hotels', 
    type: 'Virtual', 
    date: 'May 14, 3:30 PM', 
    duration: '1h', 
    presenter: 'You', 
    status: 'Scheduled',
    location: 'Google Meet'
  }
];

export default function DemosTab() {
  const { showToast } = useToast();

  const handleAction = (action: string) => {
    showToast(`${action} action triggered`, 'info');
  };

  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <div className="grid lg:grid-cols-4 gap-6">
        {[
          { label: 'Demos This Week', value: '8', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Conversion Rate', value: '42%', icon: PlayCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Upcoming Today', value: '2', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Avg. Duration', value: '52m', icon: User, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4 shadow-inner", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <h4 className="text-2xl font-black text-slate-900">{stat.value}</h4>
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900">Upcoming Demos</h3>
        <Button 
          onClick={() => handleAction('Schedule Demo')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-10 rounded-xl px-6"
        >
          Schedule New Demo
        </Button>
      </div>

      {/* Demos Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demos.map((demo) => (
          <div key={demo.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-50 transition-all group overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  demo.type === 'Virtual' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                )}>
                  {demo.type} Demo
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    demo.status === 'Confirmed' ? "bg-emerald-500 animate-pulse" : "bg-blue-500"
                  )} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{demo.status}</span>
                </div>
              </div>

              <h4 className="text-lg font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{demo.business}</h4>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-6 font-medium">
                <User className="w-3.5 h-3.5" />
                Presenter: {demo.presenter}
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                <div className="flex items-center gap-3 text-xs">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-700">{demo.date}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{demo.duration} session</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {demo.type === 'Virtual' ? <Video className="w-4 h-4 text-slate-400" /> : <MapPin className="w-4 h-4 text-slate-400" />}
                  <span className="truncate">{demo.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => handleAction(demo.type === 'Virtual' ? 'Joining Meeting' : 'Viewing Details')}
                  className="flex-grow bg-slate-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest h-11 rounded-xl shadow-lg transition-all"
                >
                  {demo.type === 'Virtual' ? 'Join Meeting' : 'View Details'}
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
            
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preparation Task</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600">Deck Ready</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
