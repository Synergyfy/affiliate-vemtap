import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// NEXT_PUBLIC_ vars are inlined at build time. In dev (push testing) we keep
// the worker for push events but skip runtime caching, which otherwise
// intercepts navigations and throws network errors during reloads/HMR.
const isDevPush = process.env.NEXT_PUBLIC_ENABLE_DEV_PUSH === "true";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: isDevPush ? [] : defaultCache,
});

serwist.addEventListeners();

// --- Web Push handling ---
// The app tsconfig does not load lib.webworker, so `ServiceWorkerGlobalScope`
// here is a minimal augmentation. Type the worker scope members we use locally.
interface PushMessageDataLike {
  json(): { title?: string; body?: string; data?: any };
}
interface PushEventLike {
  data: PushMessageDataLike | null;
}
interface NotificationClickEventLike {
  notification: Notification;
}
interface SwClientLike {
  url: string;
  focus(): Promise<unknown>;
}
interface SwScopeLike {
  addEventListener(type: string, listener: (event: any) => void): void;
  registration: {
    showNotification(title: string, options?: NotificationOptions): Promise<void>;
  };
  clients: {
    matchAll(options?: { type?: string; includeUncontrolled?: boolean }): Promise<SwClientLike[]>;
    openWindow(url: string): Promise<unknown>;
  };
}

const sw = self as unknown as SwScopeLike;

sw.addEventListener("push", (event: PushEventLike) => {
  let payload: { title?: string; body?: string; data?: any } = {};
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch (err) {
    // Non-JSON payload; fall back to defaults.
  }

  sw.registration.showNotification(payload.title || "Vemtap", {
    body: payload.body || "You have a new update from Vemtap.",
    data: payload.data || {},
    icon: "/assets/logo-icon.png",
    badge: "/assets/logo-icon.png",
  });
});

sw.addEventListener("notificationclick", (event: NotificationClickEventLike) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  sw.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
    for (const client of clientList) {
      if (client.url.includes(url) && "focus" in client) {
        return client.focus();
      }
    }
    return sw.clients.openWindow(url);
  });
});
