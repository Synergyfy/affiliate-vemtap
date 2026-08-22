'use client';

import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import QueueRunner from '@/components/admin/communication/QueueRunner';

export default function WhatsAppQueuePage() {
  const params = useParams<{ queueId: string }>();
  const queueId = params?.queueId;

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 max-w-[1200px] mx-auto px-3 sm:px-0">
        <QueueRunner queueId={queueId} />
      </div>
    </AdminLayout>
  );
}