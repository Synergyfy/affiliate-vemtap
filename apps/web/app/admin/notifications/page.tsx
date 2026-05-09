'use client';

import { motion } from 'framer-motion';
import { 
  Bell, 
  Send, 
  Users, 
  User, 
  History,
  CheckCircle2,
  Trash2,
  Clock,
  MoreHorizontal,
  RefreshCcw
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/toast';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

import { useNotifications, useBroadcastNotification } from '@/services/useNotificationHooks';
import { Loader2 } from 'lucide-react';
import { Notification, NotificationType } from '@/types/api';

export default function NotificationsManagement() {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('SYSTEM');

  const { data: notificationsResponse, isLoading: isHistoryLoading } = useNotifications({ limit: 20 });
  const broadcast = useBroadcastNotification();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    try {
      await broadcast.mutateAsync({ 
        type,
        title, 
        message 
      });
      showToast("Notification has been broadcasted successfully.", "success");
      setTitle('');
      setMessage('');
    } catch (error: any) {
      showToast(error.message || "Failed to broadcast notification.", "error");
    }
  };

  const history = (notificationsResponse?.data || []).map(notif => ({
    id: notif.id,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    date: new Date(notif.createdAt).toLocaleString(),
    status: 'Sent',
    recipients: notif.user?.fullName || 'Broadcast'
  }));

  if (isHistoryLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      </AdminLayout>
    );
  }

  const handleDelete = (title: string) => {
    showToast(`Notification "${title}" has been deleted.`, "info");
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Create Notification Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Send Notification</h2>
              <p className="text-sm text-slate-500 font-medium">Create and broadcast messages to your affiliates</p>
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Recipients</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none text-sm font-medium">
                    <option>All Affiliates</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Notification Type</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as NotificationType)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none text-sm font-medium"
                >
                  <option value="SYSTEM">Announcement (In-App)</option>
                  <option value="SECURITY">Security Alert</option>
                  <option value="COMMISSION">Commission Update</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Subject / Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Year Commission Bonus 🚀"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                required
              />
            </div>
 
             <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700">Message Content</label>
               <textarea 
                 rows={5}
                 value={message}
                 onChange={(e) => setMessage(e.target.value)}
                 placeholder="Write your message here..."
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                 required
               ></textarea>
             </div>
 
             <div className="flex justify-end gap-3">
               <button 
                 type="button" 
                 disabled={broadcast.isPending}
                 onClick={() => showToast("Draft saved successfully.", "success")}
                 className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
               >
                 Save Draft
               </button>
               <button 
                 type="submit" 
                 disabled={broadcast.isPending || !title || !message}
                 className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
               >
                 {broadcast.isPending ? (
                   <Loader2 className="w-4 h-4 animate-spin" />
                 ) : (
                   <Send className="w-4 h-4" />
                 )}
                 {broadcast.isPending ? 'Sending...' : 'Send Now'}
               </button>
             </div>
          </form>
        </motion.div>

        {/* History Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            <h3 className="text-lg font-bold text-slate-900">Recently Sent</h3>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {history.map((notif, idx) => (
                <div key={notif.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-2xl",
                      notif.status === 'Sent' ? "bg-green-50" : "bg-blue-50"
                    )}>
                      {notif.status === 'Sent' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-blue-600" />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{notif.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span>{notif.recipients}</span>
                        <span>•</span>
                        <span>{notif.date}</span>
                        <span>•</span>
                        <span className="text-blue-600">{notif.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDelete(notif.title)}
                      className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => showToast(`Viewing details for: ${notif.title}`, "info")}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
