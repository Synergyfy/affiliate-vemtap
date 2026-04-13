'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { api } from '@/lib/api-client';
import { 
  ShieldAlert, 
  AlertTriangle, 
  UserX, 
  Activity,
  Search,
  MoreHorizontal,
  ArrowUpRight,
  ShieldCheck,
  Eye
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function FraudMonitor() {
  const { showToast } = useToast();
  const [fraudAlertsList, setFraudAlertsList] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fraudData, statsData] = await Promise.all([
          api.get('/affiliates/admin/fraud'),
          api.get('/affiliates/admin/stats')
        ]);
        setFraudAlertsList(fraudData || []);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch fraud data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatusChange = async (id: string, name: string, isFlagged: boolean) => {
    try {
      await api.post(`/affiliates/admin/profiles/${id}/flag`, { 
        isFlagged,
        reason: isFlagged ? 'Fraud investigation' : 'Resolved'
      });
      showToast(`${name} has been ${isFlagged ? 'suspended' : 'whitelisted'}.`, isFlagged ? 'error' : 'success');
      if (!isFlagged) {
        setFraudAlertsList(prev => prev.filter(f => f.id !== id));
      }
    } catch (error) {
      showToast('Failed to update status.', 'error');
    }
  };

  const fraudStats = [
    { label: 'High Risk Alerts', value: fraudAlertsList.length.toString(), icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Pending Review', value: stats?.fraudAlerts?.toString() || '0', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Global Guard', value: 'Active', icon: ShieldCheck, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Fraud Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {fraudStats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
            >
              <div className={cn("p-3 rounded-2xl w-fit mb-4", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Alerts Table */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900">Security Alerts</h2>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search alerts..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 font-bold text-slate-600 text-sm">Affiliate</th>
                    <th className="p-4 font-bold text-slate-600 text-sm">Alert Reason</th>
                    <th className="p-4 font-bold text-slate-600 text-sm">Risk Level</th>
                    <th className="p-4 font-bold text-slate-600 text-sm">Detected</th>
                    <th className="p-4 font-bold text-slate-600 text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fraudAlertsList.length > 0 ? fraudAlertsList.map((alert, idx) => (
                    <motion.tr 
                      key={alert.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="hover:bg-slate-50/50 group transition-all"
                    >
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{alert.user?.firstName} {alert.user?.lastName}</p>
                        <p className="text-xs text-slate-400 font-mono">{alert.id}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <div>
                            <p className="text-sm font-bold text-slate-700">{alert.fraudReason || 'Suspicious activity'}</p>
                            <p className="text-xs text-slate-500 max-w-xs truncate">Multiple flagged actions detected.</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider bg-red-100 text-red-600">
                          High
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-500">{new Date(alert.updatedAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button 
                            onClick={() => showToast(`Viewing logs...`, 'info')}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all title='View Details'"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleStatusChange(alert.id, alert.user?.firstName, false)}
                            className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all title='Whiteslist'"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleStatusChange(alert.id, alert.user?.firstName, true)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-all title='Suspend Account'"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">No active fraud alerts.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
