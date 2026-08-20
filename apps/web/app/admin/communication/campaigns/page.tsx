'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import CommunicationNav from '@/components/communication/CommunicationNav';
import CampaignsTab from '@/components/admin/communication/CampaignsTab';

export default function CommunicationCampaignsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        <CommunicationNav />
        <CampaignsTab />
      </div>
    </AdminLayout>
  );
}
