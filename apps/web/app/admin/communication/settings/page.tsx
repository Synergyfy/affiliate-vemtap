'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import CommunicationNav from '@/components/communication/CommunicationNav';
import SmsSettingsPanel from '@/components/admin/communication/SmsSettingsPanel';

export default function CommunicationSettingsPage() {
  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
        <CommunicationNav />
        <SmsSettingsPanel />
      </div>
    </AdminLayout>
  );
}
