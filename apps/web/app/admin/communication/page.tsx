'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import CommunicationNav from '@/components/communication/CommunicationNav';
import OverviewTab from '@/components/admin/communication/OverviewTab';

export default function CommunicationOverviewPage() {
  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
        <CommunicationNav />
        <OverviewTab />
      </div>
    </AdminLayout>
  );
}