'use client';

import { 
  Rocket, 
  CheckCircle2, 
  Clock, 
  User, 
  QrCode, 
  GraduationCap, 
  TestTube, 
  Play,
  FileText,
  ChevronRight,
  MoreHorizontal,
  Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';

const stages = [
  { id: 'payment', name: 'Payment Confirmed', icon: FileText },
  { id: 'welcome', name: 'Welcome Sent', icon: Mail },
  { id: 'info', name: 'Info Collection', icon: User },
  { id: 'qr', name: 'QR Setup', icon: QrCode },
  { id: 'training', name: 'Staff Training', icon: GraduationCap },
  { id: 'testing', name: 'Testing', icon: TestTube },
  { id: 'live', name: 'Go Live', icon: Rocket },
];

const onboardingQueue = [
  { 
    id: 1, 
    business: 'Nexus Retail Group', 
    currentStage: 'qr', 
    progress: 55, 
    assignedTo: 'You', 
    dueDate: '2 days left',
    tasks: ['Generate QR for 3 branches', 'Verify branch locations']
  },
  { 
    id: 2, 
    business: 'Stellar Tech Corp', 
    currentStage: 'training', 
    progress: 72, 
    assignedTo: 'Alex J.', 
    dueDate: 'Today',
    tasks: ['Conduct admin dashboard training', 'Setup staff roles']
  },
  { 
    id: 3, 
    business: 'Blue Diamond Hotels', 
    currentStage: 'welcome', 
    progress: 15, 
    assignedTo: 'You', 
    dueDate: '5 days left',
    tasks: ['Confirm contact details', 'Send onboarding kit']
  }
];

export default function OnboardingTab() {
  const { showToast } = useToast();

  const handleAction = (action: string) => {
    showToast(`${action} action triggered`, 'info');
  };

  return (
    <div className="space-y-8">
      {/* Visual Pipeline Header */}
      <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 overflow-x-auto scrollbar-hide">
        <div className="flex items-center justify-between min-w-[800px] px-4">
          {stages.map((stage, idx) => (
            <div 
              key={stage.id} 
              onClick={() => handleAction(`Viewing ${stage.name} Stage`)}
              className="flex flex-col items-center gap-3 relative group cursor-pointer"
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all z-10 shadow-sm",
                idx === 0 ? "bg-emerald-600 text-white" : 
                idx === 3 ? "bg-blue-600 text-white animate-pulse" : "bg-white text-slate-400 border border-slate-200"
              )}>
                <stage.icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.1em] text-center max-w-[80px]",
                idx === 3 ? "text-blue-600" : "text-slate-400"
              )}>{stage.name}</span>
              
              {idx < stages.length - 1 && (
                <div className={cn(
                  "absolute top-6 left-12 w-[calc(100%-24px)] h-0.5 -z-0",
                  idx < 3 ? "bg-emerald-500" : "bg-slate-200"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-900 px-2">Onboarding Queue</h3>

      {/* Queue Cards */}
      <div className="grid gap-6">
        {onboardingQueue.map((item) => (
          <div key={item.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-50 transition-all group p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row justify-between gap-8">
              <div className="flex-grow space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xl font-black text-slate-900 mb-1">{item.business}</h4>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        Currently: {stages.find(s => s.id === item.currentStage)?.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <User className="w-3 h-3" /> Assigned to {item.assignedTo}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Onboarding Progress</p>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${item.progress}%` }} />
                      </div>
                      <span className="text-sm font-black text-slate-900">{item.progress}%</span>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Pending Tasks
                    </h5>
                    <ul className="space-y-2">
                      {item.tasks.map((task, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <button 
                            onClick={() => showToast(`Task: "${task}" completed!`, 'success')}
                            className="w-4 h-4 rounded border border-slate-300 mt-0.5 shrink-0 hover:bg-emerald-50 hover:border-emerald-500 transition-colors"
                          />
                          <span className="text-xs text-slate-600 font-medium">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col justify-between p-4 border border-slate-100 rounded-2xl">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Activation</p>
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-orange-500" />
                          {item.dueDate}
                        </p>
                      </div>
                      <Button 
                        onClick={() => handleAction('View Checklist')}
                        variant="ghost" 
                        className="p-0 h-auto text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline"
                      >
                        View Checklist
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Button 
                        onClick={() => handleAction('Advancing Stage')}
                        className="flex-grow bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest h-10 rounded-xl"
                      >
                        Advance Stage
                      </Button>
                      <Button 
                        onClick={() => handleAction('Options')}
                        variant="outline" 
                        className="h-10 w-10 border-slate-100 rounded-xl flex items-center justify-center p-0"
                      >
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:w-48 shrink-0 flex flex-col gap-3">
                <button 
                  onClick={() => handleAction(`Executing Next Step for ${item.business}`)}
                  className="w-full bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center hover:bg-emerald-100 transition-all group/btn"
                >
                  <Play className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-20 group-hover/btn:opacity-100 transition-opacity" />
                  <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Next Step</p>
                  <p className="text-[10px] font-bold text-emerald-600">Final Verification</p>
                </button>
                <div 
                  onClick={() => handleAction(`Claim Activation Bonus for ${item.business}`)}
                  className="bg-slate-900 p-4 rounded-2xl text-center cursor-pointer hover:bg-slate-800 transition-all"
                >
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Activation Bonus</p>
                  <p className="text-sm font-black text-white">₦2,500</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
