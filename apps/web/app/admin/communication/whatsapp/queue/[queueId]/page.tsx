'use client';

import { useParams } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import QueueRunner from '@/components/admin/communication/QueueRunner';

export default function WhatsAppQueuePage() {
  const params = useParams<{ queueId: string }>();
  const queueId = params?.queueId;

  return (
    <AdminLayout>
      <div className="max-w-[1200px] mx-auto">
        <QueueRunner queueId={queueId} />
      </div>
    </AdminLayout>
  );
}