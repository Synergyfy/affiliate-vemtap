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
import { useOnboarding, useUpdateOnboarding, useOnboardingBonus } from '@/services/useOperationsHooks';

const stages = [
  { id: 'QR_DESIGN', name: 'QR Design', icon: QrCode },
  { id: 'SHIPMENT', name: 'Shipment', icon: Mail },
  { id: 'SETUP', name: 'Setup & Training', icon: GraduationCap },
  { id: 'ACTIVATION', name: 'Go Live', icon: Rocket },
];

export default function OnboardingTab() {
  const { showToast } = useToast();
  const { data: onboarding = [], isLoading } = useOnboarding();

  const updateOnboarding = useUpdateOnboarding();

  const { data: bonus } = useOnboardingBonus();

  const handleAction = (action: string) => {
    showToast(`${action} action triggered`, 'info');
  };

  const handleAdvanceStage = async (id: string, currentStage: string) => {
    const stageOrder = ['QR_DESIGN', 'SHIPMENT', 'SETUP', 'ACTIVATION'];
    const currentIdx = stageOrder.indexOf(currentStage);
    if (currentIdx === -1 || currentIdx >= stageOrder.length - 1) {
      showToast('Already at final stage', 'info');
      return;
    }
    const nextStage = stageOrder[currentIdx + 1];
    try {
      await updateOnboarding.mutateAsync({ id, data: { stage: nextStage } });
      showToast(`Advanced to ${stages.find(s => s.id === nextStage)?.name || nextStage}`, 'success');
    } catch {
      showToast('Failed to advance stage', 'error');
    }
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
        {isLoading ? (
          [...Array(2)].map((_, i) => (
            <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-[32px] border border-slate-100" />
          ))
        ) : onboarding.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
            <Rocket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-slate-900 mb-2">Queue is Empty</h4>
            <p className="text-sm text-slate-500">No businesses are currently in the onboarding pipeline.</p>
          </div>
        ) : onboarding.map((item) => {
          const stageIndex = stages.findIndex(s => s.id === item.stage);
          const progress = Math.round(((stageIndex + 1) / stages.length) * 100);
          
          return (
            <div key={item.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-50 transition-all group p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row justify-between gap-8">
                <div className="flex-grow space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 mb-1">{item.business.businessName}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                          Currently: {stages.find(s => s.id === item.stage)?.name || item.stage}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <User className="w-3 h-3" /> Affiliate: {item.business.affiliate?.fullName}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Onboarding Progress</p>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-sm font-black text-slate-900">{progress}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Next Steps
                      </h5>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-xs text-slate-600 font-medium">Verify {item.business.businessName} requirements for {item.stage}</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-xs text-slate-600 font-medium">Prepare deployment kit</span>
                        </li>
                      </ul>
                    </div>
                    <div className="flex flex-col justify-between p-4 border border-slate-100 rounded-2xl">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Updated</p>
                          <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            {new Date(item.updatedAt).toLocaleDateString()}
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
                          onClick={() => handleAdvanceStage(item.id, item.stage)}
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
                    onClick={() => handleAction(`Executing Next Step`)}
                    className="w-full bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center hover:bg-emerald-100 transition-all group/btn"
                  >
                    <Play className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-20 group-hover/btn:opacity-100 transition-opacity" />
                    <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Next Step</p>
                    <p className="text-[10px] font-bold text-emerald-600">{item.status}</p>
                  </button>
                  <div 
                    onClick={() => handleAction(`Claim Activation Bonus`)}
                    className="bg-slate-900 p-4 rounded-2xl text-center cursor-pointer hover:bg-slate-800 transition-all"
                  >
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Activation Bonus</p>
                    <p className="text-sm font-black text-white">₦{bonus?.amount?.toLocaleString() || '2,500'}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
