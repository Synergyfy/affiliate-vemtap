'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useSalesFollowUps } from '@/services/useSalesPipeline';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Phone, MessageSquare, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import FollowUpCompletionModal from '@/components/sales/FollowUpCompletionModal';
import { FollowUp } from '@/types/sales-pipeline';

export default function SalesFollowUpsPage() {
  const { showToast } = useToast();
  const { data: followUpsData, isLoading, refetch } = useSalesFollowUps();
  const [completingFollowUp, setCompletingFollowUp] = useState<FollowUp | null>(null);

  const allFollowUps: FollowUp[] = followUpsData?.dueToday || [];

  const handleComplete = (followUp: FollowUp) => {
    setCompletingFollowUp(followUp);
  };

  const handleCompleted = () => {
    setCompletingFollowUp(null);
    refetch();
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-4 pb-6">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm pb-4">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/dashboard/market-mapping/pipeline"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                Follow-ups
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {allFollowUps.length} follow-up{allFollowUps.length !== 1 ? 's' : ''} due today
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-50 animate-pulse rounded-[24px] border border-slate-100" />
            ))}
          </div>
        ) : allFollowUps.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-[32px] p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">All caught up!</h3>
            <p className="text-sm text-slate-500 font-medium">No follow-ups due today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allFollowUps.map((followUp: FollowUp, idx: number) => (
              <motion.div
                key={followUp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black text-slate-900 truncate">
                        Follow-up due
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {followUp.scheduledDate ? new Date(followUp.scheduledDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) : 'Today'}
                      </p>
                      {followUp.notes && (
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2">{followUp.notes}</p>
                      )}
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-black px-2.5 py-1 rounded-full shrink-0",
                    followUp.status === 'PENDING' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-slate-50 text-slate-600'
                  )}>
                    {followUp.status}
                  </span>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/dashboard/market-mapping/pipeline`}
                    className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                  >
                    View Pipeline
                  </Link>
                  <button
                    onClick={() => handleComplete(followUp)}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Complete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Completion Modal */}
        {completingFollowUp && (
          <FollowUpCompletionModal
            isOpen={!!completingFollowUp}
            onClose={() => setCompletingFollowUp(null)}
            leadId={completingFollowUp.leadId}
            leadName="Lead"
            currentStage="INTERESTED"
            onComplete={handleCompleted}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
