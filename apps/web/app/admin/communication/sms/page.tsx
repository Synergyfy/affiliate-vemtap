'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import CommunicationNav from '@/components/communication/CommunicationNav';
import SmsTab from '@/components/admin/communication/SmsTab';

export default function SmsCommunicationPage() {
  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
        <CommunicationNav />
        <SmsTab />
      </div>
    </AdminLayout>
  );
}
