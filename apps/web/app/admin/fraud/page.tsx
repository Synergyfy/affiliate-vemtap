'use client';

import { motion } from 'motion/react';
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

const fraudAlerts = [
  { 
    id: 'FRD-001', 
    affiliate: 'David Smith', 
    reason: 'Self-referral detected', 
    risk: 'High', 
    details: 'Referred business with same IP and credit card info.',
    date: '1 hour ago' 
  },
  { 
    id: 'FRD-002', 
    affiliate: 'Alice Brown', 
    reason: 'Multiple accounts', 
    risk: 'Medium', 
    details: '3 accounts created from the same device ID.',
    date: '3 hours ago' 
  },
  { 
    id: 'FRD-003', 
    affiliate: 'Bob Wilson', 
    reason: 'Suspicious pattern', 
    risk: 'Low', 
    details: 'Unusually high conversion rate (95%) on new referrals.',
    date: 'Yesterday' 
  },
];

export default function FraudMonitor() {
  const { showToast } = useToast();

  const handleSuspend = (name: string) => {
    showToast(`${name} has been suspended for fraud investigation.`, 'error');
  };

  const handleWhitelist = (name: string) => {
    showToast(`${name} has been whitelisted.`, 'success');
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Fraud Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'High Risk Alerts', value: '14', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Pending Review', value: '28', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Accounts Suspended', value: '156', icon: UserX, color: 'text-slate-600', bg: 'bg-slate-50' },
          ].map((stat, idx) => (
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
                  {fraudAlerts.map((alert, idx) => (
                    <motion.tr 
                      key={alert.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="hover:bg-slate-50/50 group transition-all"
                    >
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{alert.affiliate}</p>
                        <p className="text-xs text-slate-400 font-mono">{alert.id}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={cn(
                            "w-4 h-4",
                            alert.risk === 'High' ? "text-red-500" : 
                            alert.risk === 'Medium' ? "text-orange-500" : "text-blue-500"
                          )} />
                          <div>
                            <p className="text-sm font-bold text-slate-700">{alert.reason}</p>
                            <p className="text-xs text-slate-500 max-w-xs truncate">{alert.details}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                          alert.risk === 'High' ? "bg-red-100 text-red-600" : 
                          alert.risk === 'Medium' ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                        )}>
                          {alert.risk}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-500">{alert.date}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button 
                            onClick={() => showToast(`Viewing detailed logs for ${alert.affiliate}`, 'info')}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all title='View Details'"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleWhitelist(alert.affiliate)}
                            className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all title='Whiteslist'"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleSuspend(alert.affiliate)}
                            className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all title='Suspend Account'"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => showToast("More options", "info")}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
