'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import CommunicationNav from '@/components/communication/CommunicationNav';
import TemplatesTab from '@/components/admin/communication/TemplatesTab';

export default function CommunicationTemplatesPage() {
  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
        <CommunicationNav />
        <TemplatesTab />
      </div>
    </AdminLayout>
  );
}