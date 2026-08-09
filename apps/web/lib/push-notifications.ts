import { api } from '@/lib/api-client';

let inFlight: Promise<boolean> | null = null;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function toBase64Url(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function getPushPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Registers the service worker, requests notification permission (when
 * needed) and saves the push subscription to the backend. Safe to call from a
 * click handler — the user gesture guarantees the browser shows the prompt.
 * Returns true when the subscription is registered and saved.
 */
export function enablePushNotifications(): Promise<boolean> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      if (typeof window === 'undefined') return false;
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('[Push] Not supported in this browser.');
        return false;
      }

      if (Notification.permission === 'denied') {
        console.warn('[Push] Notification permission is blocked in browser settings.');
        return false;
      }

      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        if (result !== 'granted') return false;
      }

      const registration = await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const res = await fetch('/api/notifications/push-vapid-public-key');
        if (!res.ok) throw new Error('Failed to load VAPID public key');
        const { publicKey } = await res.json();
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource,
        });
      }

      await api.post('/notifications/push-subscription', {
        endpoint: subscription.endpoint,
        p256dh: toBase64Url(subscription.getKey('p256dh')),
        auth: toBase64Url(subscription.getKey('auth')),
        userAgent: navigator.userAgent,
      });

      return true;
    } catch (err) {
      console.error('Push subscription failed:', err);
      return false;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
