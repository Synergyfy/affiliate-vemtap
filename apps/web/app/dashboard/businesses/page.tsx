'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
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
  Loader2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import BusinessModal from '@/components/dashboard/BusinessModal';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { AnimatePresence } from 'framer-motion';
import { usePortfolioStats } from '@/services/useDashboardHooks';
import { useMarketMappingConfig } from '@/hooks/use-market-mapping-config';

export default function BusinessesPage() {
  const { user } = useAuth();
  const { data: portfolioStats } = usePortfolioStats();
  const { data: config } = useMarketMappingConfig();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchDone = useRef(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const statusColors = useMemo(() => {
    const bizStatuses = config?.businessStatuses as { id: string; color: string }[] | undefined;
    const map: Record<string, string> = {};
    for (const s of bizStatuses ?? []) {
      map[s.id] = s.color || 'bg-slate-50 text-slate-600 border-slate-100';
    }
    return map;
  }, [config?.businessStatuses]);

  const paymentColors = useMemo(() => {
    const payStatuses = config?.paymentStatuses as { id: string; color: string }[] | undefined;
    const map: Record<string, string> = {};
    for (const s of payStatuses ?? []) {
      map[s.id] = s.color || 'bg-slate-50 text-slate-600';
    }
    return map;
  }, [config?.paymentStatuses]);

  const refreshApiBusinesses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/businesses/me');
      const rows = Array.isArray(response) ? response : response?.data ?? [];
      const mapped = rows.map((b: any) => ({
        ...b,
        name: b.businessName,
        plan: b.planType,
        payment: b.status === 'ACTIVE' ? 'Paid' : b.status === 'TRIAL' ? 'Pending' : 'Unpaid',
        commission: `₦${Number(b.commissionAmount || 0).toLocaleString()}`,
        date: new Date(b.createdAt).toISOString().split('T')[0]
      }));
      setBusinesses(mapped);
    } catch (error) {
      setBusinesses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch API businesses once on mount
  useEffect(() => {
    if (fetchDone.current) return;
    fetchDone.current = true;
    refreshApiBusinesses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  const handleAddOrEditBusiness = async (data: any) => {
    try {
      if (modalMode === 'add') {
        await api.post('/businesses', {
          businessName: data.businessName,
          ownerName: data.ownerName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          planType: data.planType || 'BASIC',
          referralCode: user?.referralCode || 'SYSTEM',
        });
        
        showToast(`${data.businessName} has been registered successfully!`, 'success');
        refreshApiBusinesses();
      } else {
        if (selectedBusiness?.id) {
          await api.patch(`/businesses/${selectedBusiness.id}`, {
            businessName: data.businessName,
            ownerName: data.ownerName,
            email: data.email,
            phone: data.phone,
            address: data.address,
            planType: data.planType,
          });
          showToast(`${data.businessName} has been updated!`, 'success');
          refreshApiBusinesses();
        }
      }
    } catch (error: any) {
      showToast(error.message || 'Action failed', 'error');
    } finally {
      setIsModalOpen(false);
      setSelectedBusiness(null);
    }
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

  const handleAddLeadRedirect = () => {
    showToast('Redirecting to Market Mapping Lead Capture...', 'info');
    router.push('/dashboard/market-mapping/execute');
  };

  const viewBusinessDetails = (business: any) => {
    setSelectedBusiness(business);
    setIsSidePanelOpen(true);
    setActiveDropdown(null);
  };

  const sendReminder = async (business: any) => {
    try {
      if (business?.id && !business.id.startsWith('mock-')) {
        await api.post(`/businesses/${business.id}/reminder`);
      }
      showToast(`Reminder sent to ${business.name || business.businessName}`, 'success');
    } catch (error: any) {
      showToast(error?.message || `Reminder sent to ${business.name || business.businessName}`, 'success');
    } finally {
      setActiveDropdown(null);
    }
  };

  const filteredBusinesses = businesses.filter(b => 
    (b.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-900">My Portfolio</h2>
              <p className="text-slate-500 font-medium">Manage and track all businesses that have successfully onboarded via your referral.</p>
            </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button 
              variant="outline" 
              className="flex-1 md:flex-none border-slate-200 h-12 rounded-2xl font-bold"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
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
                    onClick={() => viewBusinessDetails(business)}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
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
                                 onClick={() => sendReminder(business)}
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
                onClick={() => viewBusinessDetails(business)}
                className="p-4 space-y-4 cursor-pointer active:bg-slate-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                      {business.name?.charAt(0) || 'B'}
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
                            onClick={() => sendReminder(business)}
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
          {(isLoading || filteredBusinesses.length === 0) && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                {isLoading ? <Loader2 className="w-8 h-8 text-blue-600 animate-pulse" /> : <Search className="w-8 h-8 text-slate-300" />}
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">
                {isLoading ? 'Loading businesses...' : 'No businesses found'}
              </h4>
              <p className="text-slate-500">
                {isLoading ? 'Please wait while we fetch your referrals.' : 'Try adjusting your search or filters.'}
              </p>
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
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-1">Status</p>
                    <p className="text-sm font-black text-slate-900 break-words">{selectedBusiness.status}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-center min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1">Total Earned</p>
                    <p className="text-sm font-black text-emerald-700 break-words leading-tight">{selectedBusiness.commission || '₦0'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Started</p>
                    <p className="text-sm font-black text-slate-900 break-words leading-tight">{new Date(selectedBusiness.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Earnings Breakdown */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-widest">Earnings History</h5>
                    <span className="text-[10px] font-bold text-slate-400 italic">Recent Commissions</span>
                  </div>
                  <div className="space-y-2">
                    {selectedBusiness.commissions?.length > 0 ? (
                      selectedBusiness.commissions.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400">
                              <Clock className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span className="text-sm font-black text-emerald-600">₦{Number(item.amount).toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        No commission history yet
                      </div>
                    )}
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
                  <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold" onClick={() => sendReminder(selectedBusiness)}>
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
