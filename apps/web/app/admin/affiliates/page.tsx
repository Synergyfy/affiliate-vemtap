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
import FilterBar from '@/components/admin/FilterBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/toast';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';
import { useDebounce } from '@/hooks/use-debounce';
import { useUsers, useUpdateUserStatus } from '@/services/useAdminHooks';
import { Role, User as UserType } from '@/types/api';
import { Loader2 } from 'lucide-react';

export default function AffiliatesManagement() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'All' | 'Managers'>('All');
  const [selectedAffiliate, setSelectedAffiliate] = useState<UserType | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'ACTIVE' | 'SUSPENDED'>('All');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data: usersResponse, isLoading } = useUsers({
    role: activeTab === 'Managers' ? 'ADMIN' : undefined,
    status: statusFilter === 'All' ? undefined : statusFilter,
    search: debouncedSearch || undefined,
    limit: 50
  });

  const updateStatus = useUpdateUserStatus();

  const dropdownRef = useRef<HTMLDivElement>(null);
  
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
        await updateStatus.mutateAsync({ id, status: newStatus });
        showToast(`Status updated to ${newStatus} for user`, 'success');
      }
    } catch (error) {
      showToast('Failed to update user', 'error');
    }
    
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleViewProfile = async (user: UserType) => {
    try {
      const data = await api.get(`/users/${user.id}`);
      setSelectedAffiliate({
        ...user,
        ...data
      });
      setIsSidePanelOpen(true);
    } catch (error) {
      showToast('Failed to load user profile', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <FilterBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by name, email or code..."
          activeFilter={statusFilter}
          onFilterChange={(v) => setStatusFilter(v as any)}
          filterLabel="Status"
          filterOptions={[
            { label: 'All Status', value: 'All' },
            { label: 'Active', value: 'ACTIVE' },
            { label: 'Suspended', value: 'SUSPENDED' }
          ]}
          extraActions={
            <button className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all">
              Export CSV
            </button>
          }
        />

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
          <div className="overflow-x-auto relative min-h-[400px]">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
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
                {usersResponse?.data.map((user: UserType, idx: number) => (
                  <motion.tr 
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "hover:bg-slate-50/50 transition-all group"
                    )}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                          {user.fullName?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.fullName}</p>
                          <p className="text-xs text-slate-400 font-medium">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                        user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? "bg-purple-100 text-purple-600 border border-purple-200" : "bg-slate-100 text-slate-500"
                      )}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {user.phone}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 text-center font-bold">{user.referralCount || 0}</td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                        user.status === 'ACTIVE' ? "bg-green-100 text-green-600" : 
                        user.status === 'SUSPENDED' ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Action */}
                        <button 
                          onClick={() => handleViewProfile(user)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all" 
                          title='View Profile'
                        >
                          <Eye className="w-4 h-4" />
                        </button>
 
                        {/* Upgrade/Downgrade Action */}
                        {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? (
                          <button 
                            onClick={() => handleRoleToggle(user.id, user.fullName, user.role)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all" 
                            title='Downgrade to Affiliate'
                          >
                            <ArrowDownCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleRoleToggle(user.id, user.fullName, user.role)}
                            className="p-2 hover:bg-purple-50 rounded-lg text-slate-400 hover:text-purple-600 transition-all" 
                            title='Upgrade to Manager'
                          >
                            <ArrowUpCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* More Actions Dropdown */}
                        <div className="relative" ref={activeDropdown === user.id ? dropdownRef : null}>
                          <button 
                            onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
 
                          <AnimatePresence>
                            {activeDropdown === user.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden"
                              >
                                {user.status === 'ACTIVE' ? (
                                  <button 
                                    onClick={() => {
                                      handleStatusChange(user.id, user.fullName, user.status);
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
                                      handleStatusChange(user.id, user.fullName, user.status);
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
            <p className="text-xs text-slate-500 font-medium">Showing {usersResponse?.data.length || 0} of {usersResponse?.meta.total || 0} affiliates</p>
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
                    {selectedAffiliate.fullName?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">{selectedAffiliate.fullName}</h4>
                    <p className="text-sm font-mono text-slate-400">{selectedAffiliate.id}</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className={cn(
                        "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                        selectedAffiliate.role === 'ADMIN' || selectedAffiliate.role === 'SUPER_ADMIN' ? "bg-purple-100 text-purple-600 border border-purple-200" : "bg-slate-100 text-slate-500"
                      )}>
                        {selectedAffiliate.role}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                        selectedAffiliate.status === 'ACTIVE' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
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
                    <p className="text-xl font-black text-slate-900">{selectedAffiliate.referralCount || 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-emerald-600 mb-1">
                      <Wallet className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Earnings</span>
                    </div>
                    <p className="text-xl font-black text-slate-900">₦{Number(selectedAffiliate.totalEarnings || 0).toLocaleString()}</p>
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
                          <p className="text-sm font-bold text-slate-900">{new Date(selectedAffiliate.createdAt).toLocaleDateString()}</p>
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
                  <Button variant="outline" className="flex-1 rounded-2xl h-12 font-bold text-red-600 border-red-100 hover:bg-red-50" onClick={() => handleStatusChange(selectedAffiliate.id, selectedAffiliate.fullName, selectedAffiliate.status)}>
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
