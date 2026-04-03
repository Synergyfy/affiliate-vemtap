'use client';

import { motion } from 'motion/react';
import { 
  Percent, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Clock,
  Filter,
  MoreHorizontal,
  Edit3,
  Check
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const commissions = [
  { 
    id: 'COM-001', 
    affiliate: 'John Doe', 
    business: 'TechStart Solutions', 
    amount: '₦50,000', 
    type: 'Direct (20%)', 
    status: 'Paid', 
    date: 'Oct 28, 2025' 
  },
  { 
    id: 'COM-002', 
    affiliate: 'Sarah Smith', 
    business: 'Green Valley Groceries', 
    amount: '₦3,000', 
    type: 'Direct (20%)', 
    status: 'Pending', 
    date: 'Nov 15, 2025' 
  },
  { 
    id: 'COM-003', 
    affiliate: 'John Doe', 
    business: 'Apex Logistics', 
    amount: '₦24,000', 
    type: 'Direct (20%)', 
    status: 'Approved', 
    date: 'Nov 20, 2025' 
  },
  { 
    id: 'COM-004', 
    affiliate: 'Sarah Smith', 
    business: 'TechStart Solutions', 
    amount: '₦12,500', 
    type: 'Indirect (5%)', 
    status: 'Paid', 
    date: 'Oct 28, 2025' 
  },
];

export default function CommissionsManagement() {
  const { showToast } = useToast();

  const handleApprove = (id: string) => {
    showToast(`Commission ${id} has been approved successfully.`, 'success');
  };

  const handleAdjust = (id: string) => {
    showToast(`Opening adjustment tool for ${id}`, 'info');
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Commission Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Commissions', value: '₦4.2M', icon: Percent, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%', trendUp: true },
            { label: 'Paid Commissions', value: '₦3.5M', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', trend: '+8%', trendUp: true },
            { label: 'Pending Approval', value: '₦700k', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', trend: '-2%', trendUp: false },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-2xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
                <div className={cn(
                  "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                  stat.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                )}>
                  {stat.trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {stat.trend}
                </div>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Table Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900">Commission History</h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => showToast("Filters updated", "info")}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-all"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button 
                onClick={() => showToast("Exporting commissions to CSV...", "info")}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 font-bold text-slate-600 text-sm">Affiliate</th>
                    <th className="p-4 font-bold text-slate-600 text-sm">Business Source</th>
                    <th className="p-4 font-bold text-slate-600 text-sm">Amount</th>
                    <th className="p-4 font-bold text-slate-600 text-sm">Type</th>
                    <th className="p-4 font-bold text-slate-600 text-sm">Status</th>
                    <th className="p-4 font-bold text-slate-600 text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissions.map((comm, idx) => (
                    <motion.tr 
                      key={comm.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-slate-50/50 transition-all group"
                    >
                      <td className="p-4">
                        <span className="font-bold text-slate-900">{comm.affiliate}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-600">{comm.business}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-900 font-bold">{comm.amount}</td>
                      <td className="p-4">
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                          {comm.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                          comm.status === 'Paid' ? "bg-green-100 text-green-600" : 
                          comm.status === 'Approved' ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                        )}>
                          {comm.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {comm.status === 'Pending' && (
                            <button 
                              onClick={() => handleApprove(comm.id)}
                              className="p-2 hover:bg-green-50 rounded-lg text-slate-400 hover:text-green-600 transition-all title='Approve'"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleAdjust(comm.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all title='Adjust'"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all">
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
