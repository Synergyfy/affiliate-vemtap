'use client';

import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const affiliates = [
  { 
    id: 'AFF-001', 
    name: 'John Doe', 
    email: 'john@example.com', 
    phone: '+234 801 234 5678', 
    joined: 'Oct 24, 2025', 
    referrals: 12, 
    earnings: '₦125,000', 
    status: 'Active' 
  },
  { 
    id: 'AFF-002', 
    name: 'Sarah Smith', 
    email: 'sarah@example.com', 
    phone: '+234 802 345 6789', 
    joined: 'Nov 12, 2025', 
    referrals: 8, 
    earnings: '₦85,000', 
    status: 'Active' 
  },
  { 
    id: 'AFF-003', 
    name: 'Michael Chen', 
    email: 'mike@example.com', 
    phone: '+234 803 456 7890', 
    joined: 'Dec 05, 2025', 
    referrals: 24, 
    earnings: '₦245,000', 
    status: 'Suspended' 
  },
  { 
    id: 'AFF-004', 
    name: 'Alice Brown', 
    email: 'alice@example.com', 
    phone: '+234 804 567 8901', 
    joined: 'Jan 15, 2026', 
    referrals: 5, 
    earnings: '₦45,000', 
    status: 'Active' 
  },
];

export default function AffiliatesManagement() {
  const { showToast } = useToast();

  const handleStatusChange = (name: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    showToast(`${name} has been ${newStatus.toLowerCase()} successfully.`, 'success');
  };

  const handleAddAffiliate = () => {
    showToast("Add Affiliate modal would open here in a real app.", "info");
  };

  const handleViewProfile = (name: string) => {
    showToast(`Viewing profile for ${name}`, "info");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search affiliates by name, ID or email..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => showToast("Filters updated", "info")}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-all"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button 
              onClick={handleAddAffiliate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
            >
              <UserPlus className="w-4 h-4" />
              Add Affiliate
            </button>
          </div>
        </div>

        {/* Affiliates Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-600 text-sm">Affiliate</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Contact</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Joined</th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-center">Referrals</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Earnings</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Status</th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {affiliates.map((affiliate, idx) => (
                  <motion.tr 
                    key={affiliate.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50/50 transition-all group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold">
                          {affiliate.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{affiliate.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{affiliate.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {affiliate.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {affiliate.phone}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{affiliate.joined}</td>
                    <td className="p-4 text-sm text-slate-600 text-center font-bold">{affiliate.referrals}</td>
                    <td className="p-4 text-sm text-slate-900 font-bold">{affiliate.earnings}</td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                        affiliate.status === 'Active' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )}>
                        {affiliate.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleViewProfile(affiliate.name)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all" 
                          title='View Profile'
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        {affiliate.status === 'Active' ? (
                          <button 
                            onClick={() => handleStatusChange(affiliate.name, affiliate.status)}
                            className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all" 
                            title='Suspend'
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleStatusChange(affiliate.name, affiliate.status)}
                            className="p-2 hover:bg-green-50 rounded-lg text-slate-400 hover:text-green-600 transition-all" 
                            title='Reactivate'
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
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
          
          {/* Pagination */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">Showing 1-4 of 1,245 affiliates</p>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-400 cursor-not-allowed">Previous</button>
              <button 
                onClick={() => showToast("Next page", "info")}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
