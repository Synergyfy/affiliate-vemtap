'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import CommunicationNav from '@/components/communication/CommunicationNav';
import WhatsAppTab from '@/components/admin/communication/WhatsAppTab';

export default function WhatsAppCommunicationPage() {
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        <CommunicationNav />
        <WhatsAppTab />
      </div>
    </AdminLayout>
  );
}