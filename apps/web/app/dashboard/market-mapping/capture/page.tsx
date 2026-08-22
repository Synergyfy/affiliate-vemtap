'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useMarketMapping } from '@/components/dashboard/market-mapping/MarketMappingContext';
import BusinessCaptureForm from '@/components/dashboard/market-mapping/BusinessCaptureForm';
import { useActiveMission } from '@/services/useFieldActivity';
import { PlannedVisit } from '@/types/affiliate-market-mapping';

function CapturePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { visits, missionPlans } = useMarketMapping();
  const { data: mission } = useActiveMission();

  const visitId = searchParams.get('id');
  const fromParam = searchParams.get('from');
  const isNew = searchParams.get('new') === '1';
  const horizonParam = (searchParams.get('horizon') || 'DAY') as 'DAY' | 'WEEK';

  const returnUrl = useMemo(() => {
    if (fromParam === 'execute') return '/dashboard/market-mapping/execute';
    if (fromParam === 'pipeline') return '/dashboard/market-mapping/pipeline';
    if (fromParam === 'plan') return '/dashboard/market-mapping/plan';
    return '/dashboard/market-mapping/pipeline';
  }, [fromParam]);

  const activePlan = missionPlans[missionPlans.length - 1];

  const targetVisit = useMemo<PlannedVisit | null>(() => {
    if (visitId) {
      const match = visits.find(v => v.id === visitId);
      if (match) return match;

      const missionMatch = mission?.businesses?.find(b => b.id === visitId);
      if (missionMatch) {
        return {
          id: missionMatch.id,
          name: missionMatch.name,
          category: missionMatch.category || '',
          status: 'NOT_YET',
          isPlaceholder: missionMatch.isPlaceholder ?? false,
          address: missionMatch.address || activePlan?.location || '',
          phone: missionMatch.phone,
          ownerName: missionMatch.ownerName,
          dailyCustomers: missionMatch.dailyCustomers,
          businessSize: missionMatch.businessSize,
          visitNotes: missionMatch.visitNotes,
          isAnchor: missionMatch.isAnchor,
          horizon: horizonParam,
        };
      }

      // Editing an existing lead whose details haven't loaded into state yet.
      return {
        id: visitId,
        name: 'Business',
        category: '',
        status: 'NOT_YET',
        isPlaceholder: true,
        address: activePlan?.location || '',
        horizon: horizonParam,
      };
    }
    if (isNew || !visitId) {
      const targetIndex = visits.length + 1;
      return {
        id: `biz-${Date.now()}`,
        name: `Business ${targetIndex}`,
        category: '',
        status: 'NOT_YET',
        isPlaceholder: true,
        address: activePlan?.location || '',
        horizon: horizonParam,
      };
    }
    return null;
  }, [visitId, isNew, visits, mission, activePlan, horizonParam]);

  return (
    <DashboardLayout>
      <BusinessCaptureForm
        initialVisit={targetVisit}
        returnUrl={returnUrl}
      />
    </DashboardLayout>
  );
}

export default function BusinessCapturePage() {
  return (
    <Suspense fallback={null}>
      <CapturePageContent />
    </Suspense>
  );
}
