'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useMarketMapping } from '@/components/dashboard/market-mapping/MarketMappingContext';
import PlanMission from '@/components/dashboard/market-mapping/PlanMission';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import { PlannedVisit } from '@/types/affiliate-market-mapping';

function PlanPageInner() {
  const { addVisits, missionPlans } = useMarketMapping();
  const { showToast } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get('plan');
  const initialPlan = planId ? missionPlans.find(p => p.id === planId) || null : null;

  const handleAddVisits = (newVisits: PlannedVisit[]) => {
    addVisits(newVisits);
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard/market-mapping');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back Navigation */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-blue-600" />
              Plan Your Mission
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Choose any day to set your daily visit target and location.
            </p>
          </div>
        </div>

        {/* Plan Mission Form + Cards + Execute Button */}
        <PlanMission onAddVisits={handleAddVisits} initialPlan={initialPlan} />

      </div>
    </DashboardLayout>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={null}>
      <PlanPageInner />
    </Suspense>
  );
}
