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
import BusinessModal from '@/components/dashboard/BusinessModal';
import { useToast } from '@/hooks/use-toast';
import { Plus, Eye, Bell, Edit2, X, Building2, MapPin, Phone, Mail, Calendar, TrendingUp as TrendingUpIcon, Activity } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';

const initialBusinesses = [
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
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const handleAddOrEditBusiness = (data: any) => {
    if (modalMode === 'add') {
      const formattedBusiness = {
        ...data,
        name: data.businessName,
        id: Math.random()
      };
      setBusinesses([formattedBusiness, ...businesses]);
      showToast(`${formattedBusiness.name} has been added successfully!`, 'success');
    } else {
      setBusinesses(prev => prev.map(b => b.id === data.id ? { ...b, ...data, name: data.businessName } : b));
      showToast(`${data.businessName} has been updated!`, 'success');
    }
    setIsModalOpen(false);
    setSelectedBusiness(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openAddModal = () => {
    setModalMode('add');
    setSelectedBusiness(null);
    setIsModalOpen(true);
  };

  const openEditModal = (business: any) => {
    setModalMode('edit');
    setSelectedBusiness(business);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const viewBusinessDetails = (business: any) => {
    setSelectedBusiness(business);
    setIsSidePanelOpen(true);
    setActiveDropdown(null);
  };

  const sendReminder = (name: string) => {
    showToast(`Reminder sent to ${name}`, 'success');
    setActiveDropdown(null);
  };

  const filteredBusinesses = businesses.filter(b => 
    (b.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Referred Businesses</h2>
            <p className="text-slate-500">Manage and track all businesses you have referred to Vemtap.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button 
              variant="outline" 
              className="flex-1 md:flex-none border-slate-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={openAddModal}
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Business
            </Button>
          </div>
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
                    <td className="px-6 py-4 text-right relative">
                      <div ref={activeDropdown === business.id ? dropdownRef : null}>
                        <button 
                          onClick={() => setActiveDropdown(activeDropdown === business.id ? null : business.id)}
                          className={cn(
                            "p-2 rounded-lg transition-all text-slate-400 hover:text-slate-900 hover:bg-slate-100",
                            activeDropdown === business.id && "bg-slate-100 text-slate-900"
                          )}
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        <AnimatePresence>
                          {activeDropdown === business.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute right-6 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden"
                            >
                              <button 
                                onClick={() => viewBusinessDetails(business)}
                                className="w-full px-4 py-2 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <button 
                                onClick={() => sendReminder(business.name)}
                                className="w-full px-4 py-2 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                              >
                                <Bell className="w-4 h-4" />
                                Send Reminder
                              </button>
                              <div className="h-[1px] bg-slate-100 my-1" />
                              <button 
                                onClick={() => openEditModal(business)}
                                className="w-full px-4 py-2 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit Business
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
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
                  <div className="relative" ref={activeDropdown === business.id ? dropdownRef : null}>
                    <button 
                      onClick={() => setActiveDropdown(activeDropdown === business.id ? null : business.id)}
                      className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                      {activeDropdown === business.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden"
                        >
                          <button 
                            onClick={() => viewBusinessDetails(business)}
                            className="w-full px-4 py-2 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          <button 
                            onClick={() => sendReminder(business.name)}
                            className="w-full px-4 py-2 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                          >
                            <Bell className="w-4 h-4" />
                            Send Reminder
                          </button>
                          <div className="h-[1px] bg-slate-100 my-1" />
                          <button 
                            onClick={() => openEditModal(business)}
                            className="w-full px-4 py-2 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Business
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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

      <BusinessModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleAddOrEditBusiness}
        initialData={selectedBusiness}
        mode={modalMode}
      />

      {/* Business Details Side Panel */}
      <AnimatePresence>
        {isSidePanelOpen && selectedBusiness && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidePanelOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[250]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-[260] overflow-y-auto"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-900">Business Details</h3>
                  <button 
                    onClick={() => setIsSidePanelOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                {/* Profile Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-[32px] bg-blue-50 flex items-center justify-center text-blue-600 text-3xl font-black">
                    {selectedBusiness.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">{selectedBusiness.name}</h4>
                    <p className="text-sm font-mono text-slate-400">ID: {selectedBusiness.id}</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-blue-200">
                        {selectedBusiness.plan} Plan
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                        selectedBusiness.status === 'Active' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )}>
                        {selectedBusiness.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-2 text-emerald-600 mb-1">
                      <TrendingUpIcon className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Commission</span>
                    </div>
                    <p className="text-xl font-black text-slate-900">{selectedBusiness.commission}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Referred On</span>
                    </div>
                    <p className="text-xl font-black text-slate-900">{selectedBusiness.date}</p>
                  </div>
                </div>

                {/* Detailed Info */}
                <div className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Location & Contact</h5>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <MapPin className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Business Address</p>
                          <p className="text-sm font-bold text-slate-900">{selectedBusiness.address || 'N/A'}</p>
                          {selectedBusiness.state && <p className="text-xs text-slate-500">{selectedBusiness.state}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <Phone className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
                          <p className="text-sm font-bold text-slate-900">{selectedBusiness.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Administrative</h5>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <Activity className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment Status</p>
                          <p className="text-sm font-bold text-slate-900">{selectedBusiness.payment}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-8 flex gap-3">
                  <Button className="flex-1 rounded-2xl h-12 font-bold" onClick={() => openEditModal(selectedBusiness)}>
                    Edit Business
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => sendReminder(selectedBusiness.name)}>
                    Send Reminder
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
