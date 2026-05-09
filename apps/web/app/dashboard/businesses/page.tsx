'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  XCircle,
  TrendingUp,
  Download,
  Plus, 
  Eye, 
  Bell, 
  Edit2, 
  X, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  TrendingUp as TrendingUpIcon, 
  Activity,
  Loader2
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import BusinessModal from '@/components/dashboard/BusinessModal';
import { useToast } from '@/hooks/toast';
import { useAuth } from '@/hooks/use-auth';

import { useMyBusinesses, useCreateBusiness } from '@/services/useBusinessHooks';
import { Business, BusinessStatus, PlanType } from '@/types/api';

const statusColors = {
  ACTIVE: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  TRIAL: 'bg-blue-50 text-blue-600 border-blue-100',
  EXPIRED: 'bg-red-50 text-red-600 border-red-100',
  CANCELLED: 'bg-slate-50 text-slate-600 border-slate-100',
};

export default function BusinessesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<BusinessStatus | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: businessesResponse, isLoading } = useMyBusinesses();
  const createBusiness = useCreateBusiness();

  const handleAddBusiness = async (data: any) => {
    try {
      await createBusiness.mutateAsync({
        businessName: data.businessName,
        ownerName: data.ownerName,
        email: data.email,
        phone: data.phone,
        planType: data.planType || 'BASIC',
      });
      
      showToast(`${data.businessName} has been registered successfully!`, 'success');
      setIsModalOpen(false);
    } catch (error: any) {
      showToast(error.message || 'Action failed', 'error');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const businesses = businessesResponse?.data || [];
  
  const filteredBusinesses = businesses.filter(b => {
    const matchesSearch = 
      b.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'ALL' || b.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const viewBusinessDetails = (business: Business) => {
    setSelectedBusiness(business);
    setIsSidePanelOpen(true);
    setActiveDropdown(null);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Referred Businesses</h2>
            <p className="text-slate-500">Manage and track all businesses you have referred to Vemtap.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none border-slate-200">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              onClick={() => { setSelectedBusiness(null); setIsModalOpen(true); }}
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
            <select 
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIAL">Trial</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Business Name</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Commission</th>
                  <th className="px-6 py-4 text-sm font-bold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4"></th>
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
                          {business.businessName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{business.businessName}</p>
                          <p className="text-xs text-slate-400">{business.ownerName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600">{business.planType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border",
                        statusColors[business.status]
                      )}>
                        {business.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-emerald-600 font-bold">
                        <TrendingUp className="w-4 h-4" />
                        ₦{Number(business.commissionAmount || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(business.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => viewBusinessDetails(business)}
                        className="p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredBusinesses.length === 0 && (
            <div className="p-12 text-center text-slate-400">
              No businesses found matching your criteria.
            </div>
          )}
        </div>
      </div>

      <BusinessModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={handleAddBusiness}
        initialData={selectedBusiness}
        mode={selectedBusiness ? 'edit' : 'add'}
      />

      <AnimatePresence>
        {isSidePanelOpen && selectedBusiness && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidePanelOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[250]"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-[260] overflow-y-auto p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900">Business Details</h3>
                <button onClick={() => setIsSidePanelOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-[32px] bg-blue-50 flex items-center justify-center text-blue-600 text-3xl font-black">
                    {selectedBusiness.businessName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">{selectedBusiness.businessName}</h4>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-blue-200">
                        {selectedBusiness.planType} Plan
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <TrendingUpIcon className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                    <p className="text-xl font-black text-slate-900">₦{Number(selectedBusiness.commissionAmount).toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Commission</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <Calendar className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-xl font-black text-slate-900">{new Date(selectedBusiness.createdAt).toLocaleDateString()}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Referred On</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Info</h5>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <Mail className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Email Address</p>
                        <p className="text-sm font-bold text-slate-900">{selectedBusiness.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</p>
                        <p className="text-sm font-bold text-slate-900">{selectedBusiness.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
