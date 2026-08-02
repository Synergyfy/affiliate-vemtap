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

import { 
  useNotifications, 
  useBroadcastNotification, 
  useSaveNotificationDraft, 
  useDeleteNotification, 
  useNotificationDetail 
} from '@/services/useNotificationHooks';
import { Loader2, X } from 'lucide-react';
import { Notification, NotificationType } from '@/types/api';

export default function NotificationsManagement() {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('SYSTEM');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(['AFFILIATE']);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

  const recipientOptions = [
    { value: 'AFFILIATE', label: 'Affiliates' },
    { value: 'AGENT', label: 'Agents' },
    { value: 'SUPERVISOR', label: 'Line Managers' },
  ];

  const toggleRecipient = (value: string) => {
    setSelectedRecipients(prev => 
      prev.includes(value) ? prev.filter(r => r !== value) : [...prev, value]
    );
  };

  const { data: notificationsResponse, isLoading: isHistoryLoading } = useNotifications({ limit: 20 });
  const { data: notificationDetail } = useNotificationDetail(selectedDetailId || undefined);
  const broadcast = useBroadcastNotification();
  const saveDraft = useSaveNotificationDraft();
  const deleteNotif = useDeleteNotification();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message || selectedRecipients.length === 0) return;

    try {
      await broadcast.mutateAsync({ 
        type,
        title, 
        message,
        targetRoles: selectedRecipients,
      });
      showToast("Notification has been broadcasted successfully.", "success");
      setTitle('');
      setMessage('');
    } catch (error: any) {
      showToast(error.message || "Failed to broadcast notification.", "error");
    }
  };

  const handleSaveDraft = async () => {
    if (!title || !message) {
      showToast("Please provide a title and message for the draft.", "error");
      return;
    }
    try {
      await saveDraft.mutateAsync({
        title,
        message,
        type,
        targetRoles: selectedRecipients,
      });
      showToast("Notification draft saved successfully.", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to save draft.", "error");
    }
  };

  const handleDelete = async (id: string, titleStr: string) => {
    try {
      await deleteNotif.mutateAsync(id);
      showToast(`Notification "${titleStr}" deleted.`, "info");
    } catch (error: any) {
      showToast(error.message || "Failed to delete notification.", "error");
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
                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[48px]">
                  {recipientOptions.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleRecipient(opt.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                        selectedRecipients.includes(opt.value)
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white text-slate-600 border border-slate-200 hover:border-blue-200"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {selectedRecipients.length === recipientOptions.length && (
                    <span className="text-[10px] text-blue-600 font-bold self-center ml-1">(All selected)</span>
                  )}
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
                 disabled={broadcast.isPending || saveDraft.isPending}
                 onClick={handleSaveDraft}
                 className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
               >
                 {saveDraft.isPending ? 'Saving...' : 'Save Draft'}
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
                      onClick={() => handleDelete(notif.id, notif.title)}
                      className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setSelectedDetailId(notif.id)}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
                      title="View Details"
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

      {/* Notification Detail Modal */}
      {selectedDetailId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Notification Detail</h3>
              <button onClick={() => setSelectedDetailId(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            {notificationDetail ? (
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-bold text-slate-900">{notificationDetail.title}</h4>
                  <p className="text-xs text-blue-600 font-medium mt-1">{notificationDetail.type} • {new Date(notificationDetail.createdAt).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                  {notificationDetail.message}
                </div>
                {notificationDetail.user && (
                  <div className="text-xs text-slate-500">
                    Recipient: <span className="font-bold text-slate-800">{notificationDetail.user.fullName} ({notificationDetail.user.email})</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600" /></div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

