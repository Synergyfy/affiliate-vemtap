'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import WorkMetricReports from '@/components/reports/WorkMetricReports';

export default function AdminMarketMappingReportsPage() {
  return (
    <AdminLayout>
      <WorkMetricReports backHref="/admin/market-mapping" />
    </AdminLayout>
  );
}