'use client';

import { useNotificationSocket } from '@/services/useNotificationSocket';
import { usePushSubscription } from '@/hooks/usePushSubscription';

export default function NotificationSocketBridge() {
  useNotificationSocket();
  usePushSubscription();
  return null;
}
