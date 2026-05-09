'use client';

import { useParams } from 'next/navigation';
import LeadCaptureForm from '@/components/leads/LeadCaptureForm';
import { 
  ShieldCheck, 
  Target, 
  Users, 
  Zap,
  Globe,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PublicCapturePage() {
  const params = useParams();
  const agentId = params.agentId as string;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 md:px-8">
      {/* Brand Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl text-center mb-10"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">V</div>
          <span className="text-2xl font-black text-slate-900">Vemtap <span className="text-blue-600">Acquisition</span></span>
        </div>
        <h1 className="text-xl font-black text-slate-900 mb-2">Business Lead Capture</h1>
        <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">
          Quickly submit business details to **Agent #{agentId.slice(0, 8)}**. 
          We&apos;ll handle the onboarding from here.
        </p>
      </motion.div>

      {/* Main Form Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white rounded-[48px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden"
      >
        <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Quick Submission</p>
              <h2 className="text-lg font-black">Fast-Track Onboarding</h2>
            </div>
          </div>
          <ShieldCheck className="w-8 h-8 text-emerald-500 opacity-50" />
        </div>

        <div className="p-8 md:p-12">
          <LeadCaptureForm agentId={agentId} isPublic={true} />
        </div>

        <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Globe className="w-3 h-3" /> Secure Capture
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3" /> Verified Agent
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer Info */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center text-slate-400"
      >
        <p className="text-[10px] font-black uppercase tracking-widest mb-4">Powered by Vemtap Enterprise Operations</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/login" className="text-[10px] font-black text-blue-600 hover:underline">Agent Login</Link>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <Link href="/support" className="text-[10px] font-black hover:text-slate-600">Support Center</Link>
        </div>
      </motion.div>
    </div>
  );
}
