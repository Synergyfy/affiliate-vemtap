'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import CommunicationNav from '@/components/communication/CommunicationNav';
import ReportsTab from '@/components/admin/communication/ReportsTab';

export default function CommunicationReportsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        <CommunicationNav />
        <ReportsTab />
      </div>
    </AdminLayout>
  );
}
