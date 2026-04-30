'use client';

import { motion } from 'motion/react';
import { 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Banknote,
  MoreHorizontal,
  Check,
  X,
  CreditCard
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const withdrawals = [
  { 
    id: 'WTH-001', 
    affiliate: 'John Doe', 
    amount: '₦25,000', 
    bank: 'GTBank', 
    account: '0123456789', 
    status: 'Pending', 
    date: '2 hours ago' 
  },
  { 
    id: 'WTH-002', 
    affiliate: 'Sarah Smith', 
    amount: '₦15,000', 
    bank: 'Zenith Bank', 
    account: '9876543210', 
    status: 'Approved', 
    date: '5 hours ago' 
  },
  { 
    id: 'WTH-003', 
    affiliate: 'Michael Chen', 
    amount: '₦45,000', 
    bank: 'Access Bank', 
    account: '5566778899', 
    status: 'Paid', 
    date: 'Yesterday' 
  },
  { 
    id: 'WTH-004', 
    affiliate: 'Alice Brown', 
    amount: '₦10,000', 
    bank: 'Kuda Bank', 
    account: '1122334455', 
    status: 'Rejected', 
    date: '2 days ago' 
  },
];

export default function WithdrawalsManagement() {
  const { showToast } = useToast();

  const handleApprove = (name: string) => {
    showToast(`Withdrawal for ${name} has been approved.`, 'success');
  };

  const handleReject = (name: string) => {
    showToast(`Withdrawal for ${name} has been rejected.`, 'error');
  };

  const handleMarkAsPaid = (name: string) => {
    showToast(`Withdrawal for ${name} marked as paid successfully.`, 'success');
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Withdrawal Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Payouts', value: '₦12.5M', icon: Banknote, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pending Request', value: '₦125k', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Approved', value: '₦85k', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Completed', value: '₦12.3M', icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
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

        {/* Withdrawals Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Withdrawal Requests</h3>
            <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1">
              <button 
                onClick={() => showToast("Showing all requests", "info")}
                className="px-3 py-1.5 text-xs font-bold bg-white text-slate-900 rounded-lg shadow-sm"
              >All</button>
              <button 
                onClick={() => showToast("Showing pending requests", "info")}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 rounded-lg"
              >Pending</button>
              <button 
                onClick={() => showToast("Showing approved requests", "info")}
                className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 rounded-lg"
              >Approved</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-600 text-sm">Affiliate</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Amount</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Bank Details</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Status</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Requested</th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((wth, idx) => (
                  <motion.tr 
                    key={wth.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50/50 transition-all group"
                  >
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{wth.affiliate}</p>
                      <p className="text-xs text-slate-400 font-mono">{wth.id}</p>
                    </td>
                    <td className="p-4 text-sm text-slate-900 font-bold">{wth.amount}</td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-700">{wth.bank}</p>
                      <p className="text-xs text-slate-500">{wth.account}</p>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                        wth.status === 'Paid' ? "bg-green-100 text-green-600" : 
                        wth.status === 'Approved' ? "bg-blue-100 text-blue-600" : 
                        wth.status === 'Pending' ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"
                      )}>
                        {wth.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{wth.date}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        {wth.status === 'Pending' && (
                          <>
                            <button 
                              onClick={() => handleApprove(wth.affiliate)}
                              className="p-2 hover:bg-green-50 rounded-lg text-slate-400 hover:text-green-600 transition-all title='Approve'"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleReject(wth.affiliate)}
                              className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all title='Reject'"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {wth.status === 'Approved' && (
                          <button 
                            onClick={() => handleMarkAsPaid(wth.affiliate)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all"
                          >
                            Mark as Paid
                          </button>
                        )}
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
    </AdminLayout>
  );
}
