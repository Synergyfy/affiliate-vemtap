'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useMarketMapping } from '@/components/dashboard/market-mapping/MarketMappingContext';
import PlanMission from '@/components/dashboard/market-mapping/PlanMission';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import Link from 'next/link';
import { PlannedVisit } from '@/types/affiliate-market-mapping';

export default function PlanPage() {
  const { addVisits, missionPlans } = useMarketMapping();
  const { showToast } = useToast();

  const handleAddVisits = (newVisits: PlannedVisit[]) => {
    addVisits(newVisits);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Back Navigation */}
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/market-mapping" 
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-blue-600" />
              Plan Your Mission
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Set your start date and daily targets. Week totals auto-calculate.
            </p>
          </div>
        </div>

        {/* Plan Mission Form + Cards + Execute Button */}
        <PlanMission onAddVisits={handleAddVisits} />

      </div>
    </DashboardLayout>
  );
}
