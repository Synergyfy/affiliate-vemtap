'use client';

import { motion } from 'motion/react';
import { 
  Bell, 
  Send, 
  Users, 
  User, 
  History,
  CheckCircle2,
  Trash2,
  MoreHorizontal,
  Clock
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const sentNotifications = [
  { 
    id: 'NOT-001', 
    title: 'New Commission Structure', 
    recipients: 'All Affiliates', 
    type: 'Announcement', 
    status: 'Sent', 
    date: 'Oct 28, 2025' 
  },
  { 
    id: 'NOT-002', 
    title: 'Payment Threshold Update', 
    recipients: 'Top 100 Affiliates', 
    type: 'Targeted', 
    status: 'Scheduled', 
    date: 'Dec 12, 2025' 
  },
  { 
    id: 'NOT-003', 
    title: 'Profile Verification Required', 
    recipients: 'Pending Affiliates', 
    type: 'Targeted', 
    status: 'Sent', 
    date: 'Dec 10, 2025' 
  },
];

export default function NotificationsManagement() {
  const { showToast } = useToast();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Notification has been broadcasted successfully.", "success");
  };

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
                    <option>Active Affiliates</option>
                    <option>Suspended Affiliates</option>
                    <option>Top Earners</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Notification Type</label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none text-sm font-medium">
                  <option>Announcement (In-App)</option>
                  <option>Email Broadcast</option>
                  <option>Push Notification</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Subject / Title</label>
              <input 
                type="text" 
                placeholder="e.g. New Year Commission Bonus 🚀"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Message Content</label>
              <textarea 
                rows={5}
                placeholder="Write your message here..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium"
                required
              ></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => showToast("Draft saved successfully.", "success")}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
              >
                Save Draft
              </button>
              <button type="submit" className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                <Send className="w-4 h-4" />
                Send Now
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
              {sentNotifications.map((notif, idx) => (
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
