'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  XCircle,
  TrendingUp,
  Download
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const businesses = [
  { id: 1, name: 'Tech Solutions Ltd', plan: 'Premium', status: 'Active', payment: 'Paid', commission: '₦15,000', date: '2024-03-15' },
  { id: 2, name: 'Global Corp', plan: 'Enterprise', status: 'Active', payment: 'Paid', commission: '₦25,000', date: '2024-03-10' },
  { id: 3, name: 'Small Biz Inc', plan: 'Basic', status: 'Trial', payment: 'Pending', commission: '₦0', date: '2024-03-20' },
  { id: 4, name: 'Creative Agency', plan: 'Premium', status: 'Expired', payment: 'Unpaid', commission: '₦0', date: '2024-02-28' },
  { id: 5, name: 'Future Tech', plan: 'Enterprise', status: 'Active', payment: 'Paid', commission: '₦25,000', date: '2024-03-05' },
];

const statusColors = {
  Active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  Trial: 'bg-blue-50 text-blue-600 border-blue-100',
  Expired: 'bg-red-50 text-red-600 border-red-100',
};

const paymentColors = {
  Paid: 'bg-emerald-50 text-emerald-600',
  Pending: 'bg-orange-50 text-orange-600',
  Unpaid: 'bg-red-50 text-red-600',
};

export default function BusinessesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Referred Businesses</h2>
            <p className="text-slate-500">Manage and track all businesses you have referred to Vemtap.</p>
          </div>
          <Button variant="outline" className="w-full md:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search businesses..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600">
              Sort
            </button>
          </div>
        </div>

        {/* Table / Card View */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Business Name</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Commission</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBusinesses.map((business, idx) => (
                  <motion.tr 
                    key={business.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                          {business.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{business.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600">{business.plan}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border",
                        statusColors[business.status as keyof typeof statusColors]
                      )}>
                        {business.status === 'Active' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {business.status === 'Trial' && <Clock className="w-3 h-3 mr-1" />}
                        {business.status === 'Expired' && <XCircle className="w-3 h-3 mr-1" />}
                        {business.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-sm font-bold",
                        paymentColors[business.payment as keyof typeof paymentColors]
                      )}>
                        {business.payment}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-emerald-600 font-bold">
                        <TrendingUp className="w-4 h-4" />
                        {business.commission}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">{business.date}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredBusinesses.map((business, idx) => (
              <motion.div
                key={business.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                      {business.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{business.name}</h4>
                      <p className="text-xs text-slate-500">{business.plan} Plan • {business.date}</p>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div className="flex gap-2">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border",
                      statusColors[business.status as keyof typeof statusColors]
                    )}>
                      {business.status}
                    </span>
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold",
                      paymentColors[business.payment as keyof typeof paymentColors]
                    )}>
                      {business.payment}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                    <TrendingUp className="w-4 h-4" />
                    {business.commission}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {filteredBusinesses.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">No businesses found</h4>
              <p className="text-slate-500">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
