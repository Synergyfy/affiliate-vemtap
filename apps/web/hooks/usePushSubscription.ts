'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { enablePushNotifications } from '@/lib/push-notifications';

export function usePushSubscription() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    // Best-effort auto-subscribe once authenticated. The permission prompt is
    // guaranteed to surface via the explicit "Enable notifications" button
    // (a user gesture) in the notifications dropdown.
    enablePushNotifications();

    return undefined;
  }, [isAuthenticated]);
}
