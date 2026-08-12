'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import WorkMetricReports from '@/components/reports/WorkMetricReports';

export default function MyReportsPage() {
  return (
    <DashboardLayout>
      <WorkMetricReports backHref="/dashboard/market-mapping" />
    </DashboardLayout>
  );
}
