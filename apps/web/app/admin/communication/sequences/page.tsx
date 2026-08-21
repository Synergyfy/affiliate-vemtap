'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import CommunicationNav from '@/components/communication/CommunicationNav';
import SequencesTab from '@/components/admin/communication/SequencesTab';

export default function CommunicationSequencesPage() {
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        <CommunicationNav />
        <SequencesTab />
      </div>
    </AdminLayout>
  );
}
