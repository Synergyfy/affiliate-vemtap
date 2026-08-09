'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, ShieldAlert, BellRing } from 'lucide-react';
import { useMyNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/services/useNotificationHooks';
import { Notification } from '@/types/api';
import { enablePushNotifications, getPushPermission } from '@/lib/push-notifications';
import { useToast } from '@/hooks/use-toast';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const { data: notificationData, isLoading } = useMyNotifications({ limit: 10 });
  const markAsRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const { showToast } = useToast();
  const [isEnabling, setIsEnabling] = useState(false);

  const pushPermission = typeof window !== 'undefined' ? getPushPermission() : 'denied';

  const handleEnablePush = async () => {
    setIsEnabling(true);
    try {
      const enabled = await enablePushNotifications();
      if (enabled) {
        showToast('Notifications enabled. You will receive push updates.', 'success');
      } else if (pushPermission === 'denied') {
        showToast('Notifications are blocked. Allow them in your browser site settings, then retry.', 'error');
      } else {
        showToast('Permission not granted. Click again to allow notifications.', 'info');
      }
    } finally {
      setIsEnabling(false);
    }
  };

  if (!isOpen) return null;

  const notifications: Notification[] = notificationData?.data || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'COMMISSION':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'REFERRAL':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'SECURITY':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-2xl z-50 origin-top-right overflow-hidden"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Notifications</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {pushPermission !== 'granted' && (
              <button
                onClick={handleEnablePush}
                disabled={isEnabling}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50"
              >
                <BellRing className="w-3.5 h-3.5" />
                {isEnabling ? 'Enabling…' : pushPermission === 'denied' ? 'Notifications blocked' : 'Enable push'}
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-slate-400 font-medium">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-slate-500">All caught up!</p>
              <p className="text-[11px] text-slate-400 mt-0.5">No notifications to display right now.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.isRead) markAsRead.mutate(item.id);
                }}
                className={`p-4 transition-colors cursor-pointer hover:bg-slate-50/80 flex gap-3 ${
                  !item.isRead ? 'bg-blue-50/30' : ''
                }`}
              >
                <div className="mt-0.5 p-2 rounded-xl bg-slate-100 shrink-0 h-fit">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.title}</p>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{item.message}</p>
                </div>
                {!item.isRead && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
