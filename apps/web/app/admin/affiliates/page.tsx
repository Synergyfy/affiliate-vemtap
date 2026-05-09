'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserPlus, 
  ExternalLink,
  Users,
  UserCheck,
  UserCog,
  ArrowUpCircle,
  ArrowDownCircle,
  Eye,
  X,
  User,
  Calendar,
  Briefcase,
  Wallet,
  Activity,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import ConfirmationModal from '@/components/admin/ConfirmationModal';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/toast';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';

const initialAffiliates = [
  { 
    id: 'AFF-001', 
    name: 'John Doe', 
    email: 'john@example.com', 
    phone: '+234 801 234 5678', 
    joined: 'Oct 24, 2025', 
    referrals: 12, 
    earnings: '₦125,000', 
    status: 'Active',
    role: 'Affiliate' 
  },
  { 
    id: 'AFF-002', 
    name: 'Sarah Smith', 
    email: 'sarah@example.com', 
    phone: '+234 802 345 6789', 
    joined: 'Nov 12, 2025', 
    referrals: 8, 
    earnings: '₦85,000', 
    status: 'Active',
    role: 'Manager' 
  },
  { 
    id: 'AFF-003', 
    name: 'Michael Chen', 
    email: 'mike@example.com', 
    phone: '+234 803 456 7890', 
    joined: 'Dec 05, 2025', 
    referrals: 24, 
    earnings: '₦245,000', 
    status: 'Suspended',
    role: 'Manager' 
  },
  { 
    id: 'AFF-004', 
    name: 'Alice Brown', 
    email: 'alice@example.com', 
    phone: '+234 804 567 8901', 
    joined: 'Jan 15, 2026', 
    referrals: 5, 
    earnings: '₦45,000', 
    status: 'Active',
    role: 'Affiliate' 
  },
];

export default function AffiliatesManagement() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'All' | 'Managers'>('All');
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'ACTIVE' | 'SUSPENDED'>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    currentRole: string;
    currentStatus: string;
    type: 'upgrade' | 'downgrade' | 'suspend' | 'reactivate';
  }>({
    isOpen: false,
    id: '',
    name: '',
    currentRole: '',
    currentStatus: '',
    type: 'upgrade'
  });

  useEffect(() => {
    fetchAffiliates();
  }, [activeTab, statusFilter]);

  const fetchAffiliates = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      // Format backend data to frontend expectations
      const data = (response?.data || []).map((user: any) => ({
        id: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        joined: new Date(user.createdAt).toLocaleDateString(),
        referrals: user.referralCount || 0,
        earnings: `₦${Number(user.totalEarnings || 0).toLocaleString()}`,
        status: user.status, // ACTIVE, SUSPENDED
        role: user.role // AFFILIATE, ADMIN, SUPER_ADMIN
      }));
      setAffiliates(data);
    } catch (error) {
      console.error('Failed to fetch affiliates:', error);
      showToast('Failed to load affiliates list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredAffiliates = affiliates.filter(affiliate => {
    const isManager = affiliate.role === 'ADMIN' || affiliate.role === 'SUPER_ADMIN';
    const matchesTab = activeTab === 'All' || isManager;
    const matchesStatus = statusFilter === 'All' || affiliate.status === statusFilter;
    const matchesSearch = 
      affiliate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      affiliate.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTab && matchesStatus && matchesSearch;
  });

  const handleStatusChange = (id: string, name: string, currentStatus: string) => {
    const type = currentStatus === 'ACTIVE' ? 'suspend' : 'reactivate';
    setConfirmModal({
      isOpen: true,
      id,
      name,
      currentRole: '',
      currentStatus,
      type
    });
  };

  const handleRoleToggle = (id: string, name: string, currentRole: string) => {
    const type = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN' ? 'downgrade' : 'upgrade';
    setConfirmModal({
      isOpen: true,
      id,
      name,
      currentRole,
      currentStatus: '',
      type
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const executeAction = async () => {
    const { id, currentRole, currentStatus, type } = confirmModal;
    
    try {
      if (type === 'upgrade' || type === 'downgrade') {
        const newRole = currentRole === 'ADMIN' ? 'AFFILIATE' : 'ADMIN';
        await api.patch(`/users/${id}/role`, { role: newRole });
        showToast(`Role updated to ${newRole} for user`, 'success');
      } else {
        const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        await api.patch(`/users/${id}/status`, { status: newStatus });
        showToast(`Status updated to ${newStatus} for user`, 'success');
      }
      fetchAffiliates();
    } catch (error) {
      showToast('Failed to update user', 'error');
    }
    
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleViewProfile = async (affiliate: any) => {
    try {
      const data = await api.get(`/users/${affiliate.id}`);
      setSelectedAffiliate({
        ...affiliate,
        ...data,
        name: data.fullName // Sync backend naming
      });
      setIsSidePanelOpen(true);
    } catch (error) {
      showToast('Failed to load user profile', 'error');
    }
  };

  const handleApprove = async (id: string, name: string) => {
    try {
      await api.patch(`/users/${id}/kyc`, { status: 'VERIFIED' });
      showToast(`${name}'s KYC has been verified.`, 'success');
      fetchAffiliates();
    } catch (error) {
      showToast('Failed to verify KYC.', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, email or code..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative" ref={filterRef}>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-slate-600 font-medium transition-all hover:bg-slate-50",
                  statusFilter !== 'All' ? "border-blue-600 text-blue-600 bg-blue-50/50" : "border-slate-200"
                )}
              >
                <Filter className="w-4 h-4" />
                {statusFilter === 'All' ? 'Filter' : statusFilter}
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 overflow-hidden"
                  >
                    <div className="p-2 border-b border-slate-100 mb-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Filter</p>
                    </div>
                    {['All', 'Active', 'Suspended'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status as any);
                          setIsFilterOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
                          statusFilter === status 
                            ? "bg-blue-600 text-white" 
                            : "text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all">
              Export CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('All')}
            className={cn(
              "px-8 py-4 text-sm font-bold transition-all border-b-2",
              activeTab === 'All' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            All Affiliates
          </button>
          <button 
            onClick={() => setActiveTab('Managers')}
            className={cn(
              "px-8 py-4 text-sm font-bold transition-all border-b-2 flex items-center gap-2",
              activeTab === 'Managers' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <Users className="w-4 h-4" />
            Manager List
          </button>
        </div>

        {/* Header Actions */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-600 text-sm">Affiliate</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Role</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Contact</th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-center">Referrals</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Status</th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAffiliates.map((affiliate: any, idx: number) => (
                  <motion.tr 
                    key={affiliate.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "hover:bg-slate-50/50 transition-all group",
                      affiliate.isFlagged && "bg-red-50/30"
                    )}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                          {affiliate.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{affiliate.name}</p>
                          <p className="text-xs text-slate-400 font-medium">{affiliate.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                        affiliate.role === 'Manager' ? "bg-purple-100 text-purple-600 border border-purple-200" : "bg-slate-100 text-slate-500"
                      )}>
                        {affiliate.role}
                      </span>
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
                    <td className="p-4 text-sm text-slate-600 text-center font-bold">{affiliate.referrals}</td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                        affiliate.status === 'ACTIVE' ? "bg-green-100 text-green-600" : 
                        affiliate.status === 'SUSPENDED' ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {affiliate.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Action */}
                        <button 
                          onClick={() => handleViewProfile(affiliate)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all" 
                          title='View Profile'
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Upgrade/Downgrade Action */}
                        {affiliate.role === 'ADMIN' || affiliate.role === 'SUPER_ADMIN' ? (
                          <button 
                            onClick={() => handleRoleToggle(affiliate.id, affiliate.name, affiliate.role)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all" 
                            title='Downgrade to Affiliate'
                          >
                            <ArrowDownCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleRoleToggle(affiliate.id, affiliate.name, affiliate.role)}
                            className="p-2 hover:bg-purple-50 rounded-lg text-slate-400 hover:text-purple-600 transition-all" 
                            title='Upgrade to Manager'
                          >
                            <ArrowUpCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* More Actions Dropdown */}
                        <div className="relative" ref={activeDropdown === affiliate.id ? dropdownRef : null}>
                          <button 
                            onClick={() => setActiveDropdown(activeDropdown === affiliate.id ? null : affiliate.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          <AnimatePresence>
                            {activeDropdown === affiliate.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden"
                              >
                                {affiliate.status === 'ACTIVE' ? (
                                  <button 
                                    onClick={() => {
                                      handleStatusChange(affiliate.id, affiliate.name, affiliate.status);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                  >
                                    <ShieldAlert className="w-4 h-4" />
                                    Suspend Account
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => {
                                      handleStatusChange(affiliate.id, affiliate.name, affiliate.status);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                                  >
                                    <ShieldCheck className="w-4 h-4" />
                                    Reactivate Account
                                  </button>
                                )}
                                <button 
                                  onClick={() => {
                                    showToast("Email sent to affiliate", "success");
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                >
                                  <Mail className="w-4 h-4" />
                                  Send Email
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
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

      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeAction}
        type={confirmModal.type}
        title={
          confirmModal.type === 'upgrade' ? 'Promote to Manager?' : 
          confirmModal.type === 'downgrade' ? 'Demote to Affiliate?' :
          confirmModal.type === 'suspend' ? 'Suspend Affiliate?' : 'Reactivate Affiliate?'
        }
        message={
          confirmModal.type === 'upgrade' ? `Are you sure you want to upgrade ${confirmModal.name} to Manager? They will gain access to Manager-only tools.` :
          confirmModal.type === 'downgrade' ? `Are you sure you want to downgrade ${confirmModal.name} back to a standard Affiliate?` :
          confirmModal.type === 'suspend' ? `Are you sure you want to suspend ${confirmModal.name}? They will lose access to the dashboard immediately.` :
          `Are you sure you want to reactivate ${confirmModal.name}? They will regain full access to their affiliate account.`
        }
        confirmText={
          confirmModal.type === 'upgrade' ? 'Yes, Upgrade' : 
          confirmModal.type === 'downgrade' ? 'Yes, Downgrade' :
          confirmModal.type === 'suspend' ? 'Yes, Suspend Account' : 'Yes, Reactivate Account'
        }
      />

      {/* Profile Side Panel */}
      <AnimatePresence>
        {isSidePanelOpen && selectedAffiliate && (
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
                  <h3 className="text-2xl font-black text-slate-900">Affiliate Profile</h3>
                  <button 
                    onClick={() => setIsSidePanelOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                {/* Profile Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-24 h-24 rounded-[32px] bg-slate-100 flex items-center justify-center text-slate-700 text-3xl font-black">
                    {selectedAffiliate.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">{selectedAffiliate.name}</h4>
                    <p className="text-sm font-mono text-slate-400">{selectedAffiliate.id}</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className={cn(
                        "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                        selectedAffiliate.role === 'Manager' ? "bg-purple-100 text-purple-600 border border-purple-200" : "bg-slate-100 text-slate-500"
                      )}>
                        {selectedAffiliate.role}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                        selectedAffiliate.status === 'Active' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )}>
                        {selectedAffiliate.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Referrals</span>
                    </div>
                    <p className="text-xl font-black text-slate-900">{selectedAffiliate.referrals}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                      <Wallet className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Earnings</span>
                    </div>
                    <p className="text-xl font-black text-slate-900">{selectedAffiliate.earnings}</p>
                  </div>
                </div>

                {/* Detailed Info */}
                <div className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Information</h5>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <Mail className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                          <p className="text-sm font-bold text-slate-900">{selectedAffiliate.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <Phone className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
                          <p className="text-sm font-bold text-slate-900">{selectedAffiliate.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Details</h5>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registration Date</p>
                          <p className="text-sm font-bold text-slate-900">October 24, 2025</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <Activity className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Active</p>
                          <p className="text-sm font-bold text-slate-900">2 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-8 flex gap-3">
                  <Button className="flex-1 rounded-2xl h-12 font-bold" onClick={() => showToast("Edit modal coming soon", "info")}>
                    Edit Profile
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold text-red-600 border-red-100 hover:bg-red-50" onClick={() => handleStatusChange(selectedAffiliate.id, selectedAffiliate.name, selectedAffiliate.status)}>
                    {selectedAffiliate.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
