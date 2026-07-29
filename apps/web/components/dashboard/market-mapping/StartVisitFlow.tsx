'use client';

import { useState, useEffect } from 'react';
import { Camera, MapPin, CheckCircle2, UserCheck, X, FileText, Briefcase } from 'lucide-react';
import { PlannedVisit } from '@/types/affiliate-market-mapping';
import { cn } from '@/lib/utils';

interface StartVisitFlowProps {
  onComplete: (data: Partial<PlannedVisit>) => void;
  onCancel: () => void;
}

export default function StartVisitFlow({ onComplete, onCancel }: StartVisitFlowProps) {
  const [step, setStep] = useState(1);
  const [seconds, setSeconds] = useState(0);
  
  // Form State
  const [decisionMakerMet, setDecisionMakerMet] = useState<boolean | null>(null);
  const [interested, setInterested] = useState<'YES' | 'NO' | 'MAYBE' | null>(null);
  const [demoDone, setDemoDone] = useState(false);
  const [notes, setNotes] = useState('');
  
  // GPS State
  const [gpsCaptured, setGpsCaptured] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleFinish = () => {
    let status = 'VISITED';
    if (decisionMakerMet) status = 'CONTACT_MADE';
    if (interested === 'YES') status = 'MEETING_SCHEDULED';

    onComplete({
      status: status as any,
    });
  };

  return (
    <div className="flex-grow flex flex-col bg-slate-50">
      
      {/* Active Visit Banner */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between shadow-inner">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="font-bold text-sm tracking-widest uppercase">Visit In Progress</span>
        </div>
        <div className="font-mono text-2xl font-black">
          {formatTime(seconds)}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-5 space-y-6">
        
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-black text-slate-900 text-center mb-6">1. Arrival & Check-In</h3>
            
            <button 
              onClick={() => {
                setGpsCaptured(true);
                setTimeout(() => setStep(2), 1000);
              }}
              className={cn(
                "w-full p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-colors",
                gpsCaptured ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-300 bg-white hover:border-blue-500 text-slate-600 hover:text-blue-600 cursor-pointer"
              )}
            >
              <MapPin className="w-10 h-10" />
              <span className="font-bold">{gpsCaptured ? 'Location Verified' : 'Ping GPS Location'}</span>
            </button>

            <button className="w-full p-6 rounded-2xl border-2 border-slate-300 bg-white hover:border-blue-500 text-slate-600 hover:text-blue-600 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer">
              <Camera className="w-10 h-10" />
              <span className="font-bold">Capture Storefront Photo</span>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
            <h3 className="text-lg font-black text-slate-900 text-center mb-6">2. Meeting Outcome</h3>
            
            <div className="space-y-3">
              <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-500">Did you meet the decision maker?</label>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setDecisionMakerMet(true)} className={cn("py-3 rounded-xl font-bold border transition-colors", decisionMakerMet === true ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200")}>Yes</button>
                <button onClick={() => setDecisionMakerMet(false)} className={cn("py-3 rounded-xl font-bold border transition-colors", decisionMakerMet === false ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200")}>No</button>
              </div>
            </div>

            {decisionMakerMet && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
                <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-500">Level of Interest</label>
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setInterested('YES')} className={cn("py-3 rounded-xl font-bold border transition-colors", interested === 'YES' ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200")}>Yes</button>
                  <button onClick={() => setInterested('MAYBE')} className={cn("py-3 rounded-xl font-bold border transition-colors", interested === 'MAYBE' ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 border-slate-200")}>Maybe</button>
                  <button onClick={() => setInterested('NO')} className={cn("py-3 rounded-xl font-bold border transition-colors", interested === 'NO' ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-600 border-slate-200")}>No</button>
                </div>
                
                <label className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={demoDone} onChange={e => setDemoDone(e.target.checked)} className="w-5 h-5 accent-blue-600" />
                  <span className="font-bold text-sm text-slate-700">App Demo Performed?</span>
                </label>
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-500">Visit Notes</label>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="What was discussed? What are the next steps?"
                className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 h-24 resize-none"
              />
            </div>
          </div>
        )}

      </div>

      <div className="p-5 bg-white border-t border-slate-200 grid grid-cols-2 gap-3">
        {step === 1 ? (
          <>
            <button onClick={onCancel} className="py-4 font-bold text-slate-500 bg-slate-100 rounded-xl">Cancel</button>
            <button onClick={() => setStep(2)} className="py-4 font-bold text-white bg-blue-600 rounded-xl">Continue Meeting</button>
          </>
        ) : (
          <>
            <button onClick={() => setStep(1)} className="py-4 font-bold text-slate-500 bg-slate-100 rounded-xl">Back</button>
            <button onClick={handleFinish} className="py-4 font-black text-white bg-emerald-600 rounded-xl">Finish Visit</button>
          </>
        )}
      </div>
    </div>
  );
}
