'use client';

import { Suspense } from 'react';
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
  ShieldAlert,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  MapPin,
  History,
  ArrowUpDown,
  Copy
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import ConfirmationModal from '@/components/admin/ConfirmationModal';
import EditAffiliateModal from '@/components/admin/EditAffiliateModal';
import AddAgentModal from '@/components/admin/AddAgentModal';
import FilterBar from '@/components/admin/FilterBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/toast';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api-client';
import { useDebounce } from '@/hooks/use-debounce';
import { useUsers, useUpdateUserStatus, useSendUserEmail, useAssignUserHierarchy } from '@/services/useAdminHooks';
import { useAdminAssignments } from '@/services/useMarketMappingHooks';
import { useUserAgreementHistory } from '@/services/useAgreementHooks';
import { Role, User as UserType } from '@/types/api';

const VEMTAP_BASE_URL = process.env.NEXT_PUBLIC_VEMTAP_URL || 'https://vemtap.com';

function AffiliatesManagement() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const affiliateIdParam = searchParams.get('affiliateId');
  const locationIdParam = searchParams.get('locationId');
  const [activeTab, setActiveTab] = useState<'All' | 'Line Managers' | 'Agents' | 'Managers'>('All');
  const [isAddAgentOpen, setIsAddAgentOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<UserType | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'ACTIVE' | 'SUSPENDED'>('All');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchQuery, 500);

  const { data: usersResponse, isLoading } = useUsers({
    role: activeTab === 'All' ? 'AFFILIATE' as any : activeTab === 'Agents' ? 'AGENT' as any : activeTab === 'Managers' ? 'MANAGER' as any : undefined,
    isManager: activeTab === 'Line Managers' ? true : undefined,
    status: statusFilter === 'All' ? undefined : statusFilter,
    search: debouncedSearch || undefined,
    limit: 50,
    page,
  });

  const { data: adminAssignments } = useAdminAssignments();
  const locationsByUser = useMemo(() => {
    const map: Record<string, { id: string; name: string }[]> = {};
    (adminAssignments || []).forEach(a => {
      if (!a.cluster) return;
      (map[a.userId] = map[a.userId] || []).push({ id: a.cluster.id, name: a.cluster.name });
    });
    return map;
  }, [adminAssignments]);

  const { data: agentsResponse } = useUsers({
    role: 'AGENT' as any,
    limit: 1,
  });

  const updateStatus = useUpdateUserStatus();
  const { data: userAgreements, isLoading: isLoadingUserAgs } = useUserAgreementHistory(selectedAffiliate?.id || '');

  // Reset to first page when tab, search or filter changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch, statusFilter]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
    currentStatus: string;
    type: 'upgrade' | 'downgrade' | 'suspend' | 'reactivate';
  }>({
    isOpen: false,
    id: '',
    name: '',
    currentStatus: '',
    type: 'upgrade'
  });

  // Email Modal State
  const [emailTarget, setEmailTarget] = useState<UserType | null>(null);

  // Hierarchy Assignment Modal State
  const [assignModal, setAssignModal] = useState<{ user: UserType; type: 'supervisor' | 'manager' } | null>(null);

  const sendEmail = useSendUserEmail();
  const assignHierarchy = useAssignUserHierarchy();

  const handleSendEmail = async (subject: string, message: string) => {
    if (!emailTarget) return;
    try {
      await sendEmail.mutateAsync({ userId: emailTarget.id, subject, message });
      showToast(`Email sent to ${emailTarget.fullName}`, 'success');
      setEmailTarget(null);
    } catch (error) {
      showToast('Failed to send email', 'error');
    }
  };

  const handleAssign = async (targetId: string, targetName?: string) => {
    if (!assignModal) return;
    try {
      await assignHierarchy.mutateAsync({
        userId: assignModal.user.id,
        ...(assignModal.type === 'supervisor' ? { supervisorId: targetId } : { managerId: targetId }),
      });
      showToast(`${assignModal.type === 'supervisor' ? 'Line Manager' : 'Manager'} assigned successfully`, 'success');
      setSelectedAffiliate(prev => {
        if (!prev) return prev;
        const key = assignModal.type === 'supervisor' ? 'supervisor' : 'manager';
        return {
          ...prev,
          [key]: targetName ? { id: targetId, fullName: targetName, email: '' } : undefined,
        } as UserType;
      });
      setAssignModal(null);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'], exact: false });
    } catch (error) {
      showToast(`Failed to assign ${assignModal.type === 'supervisor' ? 'Line Manager' : 'Manager'}`, 'error');
    }
  };

  const handleStatusChange = (id: string, name: string, currentStatus: string) => {
    const type = currentStatus === 'ACTIVE' ? 'suspend' : 'reactivate';
    setConfirmModal({
      isOpen: true,
      id,
      name,
      currentStatus,
      type
    });
  };

  const handleRoleToggle = (id: string, name: string, isManagerMode: boolean) => {
    const type = isManagerMode ? 'downgrade' : 'upgrade';
    setConfirmModal({
      isOpen: true,
      id,
      name,
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

  // Redirect to detail page from query param
  useEffect(() => {
    if (affiliateIdParam) {
      router.push(`/admin/affiliates/${affiliateIdParam}`);
    }
  }, [affiliateIdParam, router]);

  const executeAction = async () => {
    const { id, currentStatus, type } = confirmModal;
    
    try {
      if (type === 'upgrade' || type === 'downgrade') {
        const targetManagerMode = type === 'upgrade';
        await api.patch(`/users/${id}/manager-mode`, { isManagerMode: targetManagerMode });
        showToast(`Line Manager status updated successfully`, 'success');
        // Invalidate every users cache entry (all tabs: All, Supervisors, Agents, count badges)
        await queryClient.invalidateQueries({ queryKey: ['admin', 'users'], exact: false });
        await queryClient.invalidateQueries({ queryKey: ['admin', 'stats'], exact: false });
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


  const handleViewProfile = (user: UserType) => {
    router.push(`/admin/affiliates/${user.id}`);
  };

  const handleCopyReferralLink = async (user: UserType) => {
    const url = `${VEMTAP_BASE_URL}/get-started?ref=${user.referralCode}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Vemtap referral link copied!', 'success');
    } catch {
      showToast('Failed to copy link', 'error');
    }
    setActiveDropdown(null);
  };

  const handleAffiliateUpdate = (updated: UserType) => {
    setSelectedAffiliate(updated);
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['admin', 'stats'], exact: false });
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
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

        {/* Tabs + Add Agent */}
        <div className="flex items-center justify-between border-b border-slate-200">
          <div className="flex overflow-x-auto">
            <button 
              onClick={() => setActiveTab('All')}
              className={cn(
                "px-3 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap",
                activeTab === 'All' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              All Affiliates
            </button>
            <button 
              onClick={() => setActiveTab('Line Managers')}
              className={cn(
                "px-3 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap",
                 activeTab === 'Line Managers' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <Users className="w-4 h-4" />
              Line Managers List
            </button>
            <button
              onClick={() => setActiveTab('Agents')}
              className={cn(
                "px-3 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap",
                 activeTab === 'Agents' ? "border-violet-600 text-violet-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <UserCog className="w-4 h-4" />
              Agents
              {(agentsResponse?.meta?.total ?? 0) > 0 && (
                <span className="px-2 py-0.5 bg-violet-100 text-violet-600 text-[10px] font-black rounded-full">
                  {agentsResponse?.meta?.total}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('Managers')}
              className={cn(
                "px-3 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap",
                 activeTab === 'Managers' ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              Managers
            </button>
          </div>
          {activeTab === 'Agents' && (
            <button
              onClick={() => setIsAddAgentOpen(true)}
              className="mr-4 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Agent</span>
            </button>
          )}
        </div>

        {/* Header Actions */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto relative min-h-[400px]">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}

            {activeTab === 'Agents' ? (
              /* AGENTS TABLE */
              <>
              <div className="hidden sm:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-violet-50 border-b border-violet-100">
                    <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm">Agent</th>
                    <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm hidden sm:table-cell">Contact</th>
                    <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm text-center hidden sm:table-cell">Daily Lead Target</th>
                    <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm text-center hidden sm:table-cell">Monthly Conversion Target</th>
                    <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm text-center">Leads</th>
                    <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm">Status</th>
                    <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersResponse?.data.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-violet-50 rounded-3xl flex items-center justify-center">
                            <UserCog className="w-8 h-8 text-violet-400" />
                          </div>
                          <p className="font-bold text-slate-600">No agents yet</p>
                           <p className="text-sm text-slate-400">Click &quot;Add Agent&quot; to create a marketer account</p>
                          <button
                            onClick={() => setIsAddAgentOpen(true)}
                            className="mt-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-all"
                          >
                            Create First Agent
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {usersResponse?.data.map((user: UserType, idx: number) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="hover:bg-violet-50/30 transition-all"
                    >
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
                            {user.fullName?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{user.fullName}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-violet-100 text-violet-600 uppercase tracking-widest">Agent</span>
                              {(user.supervisor || user.manager) && (
                                <span className="text-[9px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Sup: {user.supervisor?.fullName || user.manager?.fullName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 hidden sm:table-cell">
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
                      <td className="p-3 sm:p-4 text-center hidden sm:table-cell">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-lg font-black text-slate-900">{user.dailyLeadTarget ?? 0}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">leads/day</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-center hidden sm:table-cell">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-lg font-black text-slate-900">{user.monthlyConversionTarget ?? 0}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">converts/mo</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-center">
                        <span className="text-sm font-bold text-slate-700">{user._count?.leads ?? 0}</span>
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                          user.status === 'ACTIVE' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        )}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 text-right">
                        <div className="relative" ref={activeDropdown === user.id ? dropdownRef : null}>
                          <button 
                            onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                            className="p-2 hover:bg-violet-100 rounded-lg text-slate-400 hover:text-violet-700 transition-all"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <AnimatePresence>
                            {activeDropdown === user.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden"
                              >
                                <button onClick={() => { handleViewProfile(user); setActiveDropdown(null); }}
                                  className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors">
                                  <Eye className="w-4 h-4" /> View Profile
                                </button>
                                <button onClick={() => handleCopyReferralLink(user)}
                                  className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-600 flex items-center gap-3 transition-colors">
                                  <Copy className="w-4 h-4" /> Copy Vemtap Referral Link
                                </button>
                                <button onClick={() => { setSelectedAffiliate(user); setIsEditModalOpen(true); setActiveDropdown(null); }}
                                  className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-3 transition-colors">
                                  <UserCog className="w-4 h-4" /> Edit Role & Supervisor
                                </button>
                                <Link href={`/admin/affiliates/${user.id}/history`}
                                  className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-600 flex items-center gap-3 transition-colors">
                                  <History className="w-4 h-4" /> Activity History
                                </Link>
                                <button onClick={() => { setSelectedAffiliate(user); setIsEditModalOpen(true); setActiveDropdown(null); }}
                                  className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-3 transition-colors">
                                  <UserCog className="w-4 h-4" /> Edit Targets
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                                <button onClick={() => { handleStatusChange(user.id, user.fullName, user.status); setActiveDropdown(null); }}
                                  className={`w-full px-4 py-2.5 text-left text-sm font-bold flex items-center gap-3 transition-colors ${user.status === 'ACTIVE' ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                                  {user.status === 'ACTIVE' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                  {user.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
                                </button>
                                <button onClick={() => { setEmailTarget(user); setActiveDropdown(null); }}
                                  className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                                  <Mail className="w-4 h-4" /> Send Email
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
              {/* Mobile card layout for Agents */}
              <div className="sm:hidden divide-y divide-violet-50">
                {usersResponse?.data.map((user: UserType, idx: number) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => handleViewProfile(user)}
                    className="p-4 bg-white hover:bg-violet-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
                        {user.fullName?.charAt(0) || 'A'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 truncate">{user.fullName}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shrink-0",
                        user.status === 'ACTIVE' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )}>
                        {user.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1">
                        <span className="font-black text-slate-900">{user.dailyLeadTarget ?? 0}</span> leads/day
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-black text-slate-900">{user.monthlyConversionTarget ?? 0}</span> converts/mo
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-black text-slate-900">{user._count?.leads ?? 0}</span> total
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleViewProfile(user); }}
                        className="flex-1 px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-xs font-bold hover:bg-violet-100 transition-all text-center"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAffiliate(user); setIsEditModalOpen(true); }}
                        className="flex-1 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all text-center"
                      >
                        Edit
                      </button>
                      <div className="relative" ref={activeDropdown === `agent-${user.id}` ? dropdownRef : null}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === `agent-${user.id}` ? null : `agent-${user.id}`); }}
                          className="p-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                          {activeDropdown === `agent-${user.id}` && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute right-0 bottom-full mb-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden"
                            >
                              <button onClick={(e) => { e.stopPropagation(); handleCopyReferralLink(user); setActiveDropdown(null); }}
                                className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-600 flex items-center gap-3 transition-colors">
                                <Copy className="w-4 h-4" /> Copy Referral Link
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setEmailTarget(user); setActiveDropdown(null); }}
                                className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                                <Mail className="w-4 h-4" /> Send Email
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              </>
            ) : (
              /* AFFILIATES / SUPERVISORS TABLE */
              <>
              <div className="hidden sm:block">
              <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm">Affiliate</th>
                  <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm hidden md:table-cell">Role</th>
                  <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm hidden md:table-cell">Contact</th>
                  <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm text-center hidden lg:table-cell">Locations</th>
                  <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm text-center">Referrals</th>
                  <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm text-center">Leads</th>
                  <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm">Status</th>
                  <th className="p-3 sm:p-4 font-bold text-slate-600 text-xs sm:text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersResponse?.data.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center">
                          <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="font-bold text-slate-600">
                          {activeTab === 'Line Managers' ? 'No Line Managers found' : activeTab === 'Managers' ? 'No Managers found' : 'No affiliates found'}
                        </p>
                        <p className="text-sm text-slate-400">
                          {activeTab === 'Managers' ? 'Promote a team member to Manager or assign them in Edit Profile' : 'Try adjusting your search or filter criteria'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
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
                    <td className="p-3 sm:p-4">
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
                    <td className="p-3 sm:p-4 hidden md:table-cell">
                      <span className={cn(
                        "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                        user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? "bg-purple-100 text-purple-600 border border-purple-200" :
                        user.role === 'MANAGER' ? "bg-emerald-100 text-emerald-600 border border-emerald-200" :
                        user.role === 'SUPERVISOR' ? "bg-blue-100 text-blue-600 border border-blue-200" : "bg-slate-100 text-slate-500"
                      )}>
                        {user.role === 'MANAGER' ? 'MANAGER' : user.role === 'SUPERVISOR' ? 'LINE MANAGER' : user.role}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 hidden md:table-cell">
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
                      <td className="p-3 sm:p-4 text-center hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1 justify-center max-w-[160px]">
                          {(locationsByUser[user.id] || []).slice(0, 2).map(loc => (
                            <Link
                              key={loc.id}
                              href={`/admin/market-mapping/assign/${loc.id}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[9px] font-bold hover:bg-blue-100 transition-colors"
                            >
                              <MapPin className="w-2.5 h-2.5" /> {loc.name}
                            </Link>
                          ))}
                          {(locationsByUser[user.id] || []).length > 2 && (
                            <span className="text-[9px] text-slate-400 font-bold px-1">+{locationsByUser[user.id].length - 2} more</span>
                          )}
                          {(locationsByUser[user.id] || []).length === 0 && (
                            <span className="text-[9px] text-slate-300">—</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-sm text-slate-600 text-center font-bold">{(user._count?.referrals ?? 0) + (user._count?.businesses ?? 0)}</td>
                    <td className="p-3 sm:p-4 text-sm text-slate-600 text-center font-bold">{user._count?.leads ?? 0}</td>
                    <td className="p-3 sm:p-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                        user.status === 'ACTIVE' ? "bg-green-100 text-green-600" : 
                        user.status === 'SUSPENDED' ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"
                      )}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-right">
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
                              className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden"
                            >
                              <button onClick={() => { handleViewProfile(user); setActiveDropdown(null); }}
                                className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors">
                                <Eye className="w-4 h-4" /> View Profile
                              </button>
                              <button onClick={() => handleCopyReferralLink(user)}
                                className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-600 flex items-center gap-3 transition-colors">
                                <Copy className="w-4 h-4" /> Copy Vemtap Referral Link
                              </button>
                              <button onClick={() => { setSelectedAffiliate(user); setIsEditModalOpen(true); setActiveDropdown(null); }}
                                className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-3 transition-colors">
                                <UserCog className="w-4 h-4" /> Edit Role & Supervisor
                              </button>
                              <Link href={`/admin/affiliates/${user.id}/history`}
                                className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-600 flex items-center gap-3 transition-colors">
                                <History className="w-4 h-4" /> Activity History
                              </Link>

                              {/* Upgrade/Downgrade */}
                              {user.role === 'SUPERVISOR' ? (
                                <button onClick={() => { handleRoleToggle(user.id, user.fullName, true); setActiveDropdown(null); }}
                                  className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-3 transition-colors">
                                  <ArrowDownCircle className="w-4 h-4" /> Demote to Affiliate
                                </button>
                              ) : user.role !== 'MANAGER' ? (
                                <button onClick={() => { handleRoleToggle(user.id, user.fullName, false); setActiveDropdown(null); }}
                                  className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-purple-50 hover:text-purple-600 flex items-center gap-3 transition-colors">
                                  <ArrowUpCircle className="w-4 h-4" /> Promote to Line Manager
                                </button>
                              ) : null}

                              <div className="border-t border-slate-100 my-1" />

                              <button onClick={() => { handleStatusChange(user.id, user.fullName, user.status); setActiveDropdown(null); }}
                                className={`w-full px-4 py-2.5 text-left text-sm font-bold flex items-center gap-3 transition-colors ${user.status === 'ACTIVE' ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                                {user.status === 'ACTIVE' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                {user.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
                              </button>
                              <button onClick={() => { setEmailTarget(user); setActiveDropdown(null); }}
                                className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                                <Mail className="w-4 h-4" /> Send Email
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
            {/* Mobile card layout for Affiliates/Supervisors */}
            <div className="sm:hidden divide-y divide-slate-100">
              {usersResponse?.data.map((user: UserType, idx: number) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleViewProfile(user)}
                  className="p-4 bg-white hover:bg-slate-50/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0">
                      {user.fullName?.charAt(0) || 'A'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">{user.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <span className={cn(
                      "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                      user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? "bg-purple-100 text-purple-600 border border-purple-200" :
                      user.role === 'MANAGER' ? "bg-emerald-100 text-emerald-600 border border-emerald-200" :
                      user.role === 'SUPERVISOR' ? "bg-blue-100 text-blue-600 border border-blue-200" : "bg-slate-100 text-slate-500"
                    )}>
                      {user.role === 'MANAGER' ? 'MANAGER' : user.role === 'SUPERVISOR' ? 'LINE MANAGER' : user.role}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                      user.status === 'ACTIVE' ? "bg-green-100 text-green-600" :
                      user.status === 'SUSPENDED' ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"
                    )}>
                      {user.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1">
                      <span className="font-black text-slate-900">{(user._count?.referrals ?? 0) + (user._count?.businesses ?? 0)}</span> referrals
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-black text-slate-900">{user._count?.leads ?? 0}</span> leads
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleViewProfile(user); }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all text-center"
                    >
                      View
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedAffiliate(user); setIsEditModalOpen(true); }}
                      className="flex-1 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-100 transition-all text-center"
                    >
                      Edit
                    </button>
                    <div className="relative" ref={activeDropdown === `aff-${user.id}` ? dropdownRef : null}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === `aff-${user.id}` ? null : `aff-${user.id}`); }}
                        className="p-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 transition-all"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {activeDropdown === `aff-${user.id}` && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 bottom-full mb-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 overflow-hidden"
                          >
                            <button onClick={(e) => { e.stopPropagation(); handleCopyReferralLink(user); setActiveDropdown(null); }}
                              className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-600 flex items-center gap-3 transition-colors">
                              <Copy className="w-4 h-4" /> Copy Referral Link
                            </button>
                            <Link href={`/admin/affiliates/${user.id}/history`}
                              className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-600 flex items-center gap-3 transition-colors">
                              <History className="w-4 h-4" /> Activity History
                            </Link>
                            <div className="border-t border-slate-100 my-1" />
                            <button onClick={(e) => { e.stopPropagation(); handleStatusChange(user.id, user.fullName, user.status); setActiveDropdown(null); }}
                              className={`w-full px-4 py-2.5 text-left text-sm font-bold flex items-center gap-3 transition-colors ${user.status === 'ACTIVE' ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                              {user.status === 'ACTIVE' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                              {user.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setEmailTarget(user); setActiveDropdown(null); }}
                              className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                              <Mail className="w-4 h-4" /> Send Email
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            </>
            )}
          </div>
          
          {/* Pagination */}
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium truncate max-w-[140px] sm:max-w-none">
              Showing {usersResponse?.data?.length ?? 0} of {usersResponse?.meta?.total ?? 0} {activeTab.toLowerCase()}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-500">Page {page} of {usersResponse?.meta?.totalPages ?? 1}</span>
              <button
                disabled={(usersResponse?.meta?.totalPages ?? 1) <= page}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
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
          confirmModal.type === 'upgrade' ? 'Promote to Line Manager?' : 
          confirmModal.type === 'downgrade' ? 'Demote to Affiliate?' :
          confirmModal.type === 'suspend' ? 'Suspend Affiliate?' : 'Reactivate Affiliate?'
        }
        message={
          confirmModal.type === 'upgrade' ? `Are you sure you want to upgrade ${confirmModal.name} to Line Manager? They will gain access to Line Manager tools.` :
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

      <AddAgentModal
        isOpen={isAddAgentOpen}
        onClose={() => setIsAddAgentOpen(false)}
      />

      <EditAffiliateModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        affiliate={selectedAffiliate}
        onUpdate={handleAffiliateUpdate}
      />

      {/* Send Email Modal */}
      <AnimatePresence>
        {emailTarget && (
          <EmailUserModal
            user={emailTarget}
            isSending={sendEmail.isPending}
            onClose={() => setEmailTarget(null)}
            onSubmit={handleSendEmail}
          />
        )}
      </AnimatePresence>

      {/* Assign Line Manager / Manager Modal */}
      <AnimatePresence>
        {assignModal && (
          <AssignHierarchyModal
            user={assignModal.user}
            type={assignModal.type}
            isSaving={assignHierarchy.isPending}
            onClose={() => setAssignModal(null)}
            onAssign={handleAssign}
          />
        )}
      </AnimatePresence>

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
              className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-0 sm:right-0 h-[92dvh] sm:h-full w-full sm:max-w-lg bg-white shadow-2xl z-[260] overflow-y-auto rounded-t-[28px] sm:rounded-none pb-[env(safe-area-inset-bottom)]"
            >
              <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1.5 bg-slate-200 rounded-full" /></div>
              <div className="p-4 sm:p-8 space-y-4 sm:space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-900">Affiliate Profile</h3>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/affiliates/${selectedAffiliate.id}/history`}
                      className="p-2 hover:bg-amber-50 rounded-xl text-slate-400 hover:text-amber-600 transition-colors"
                      title="View Activity History"
                    >
                      <History className="w-5 h-5" />
                    </Link>
                    <button 
                      onClick={() => setIsSidePanelOpen(false)}
                      className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <X className="w-6 h-6 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Profile Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-[32px] bg-slate-100 flex items-center justify-center text-slate-700 text-2xl sm:text-3xl font-black">
                    {selectedAffiliate.fullName?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">{selectedAffiliate.fullName}</h4>
                    <p className="text-sm font-mono text-slate-400">{selectedAffiliate.id}</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className={cn(
                        "text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                        selectedAffiliate.role === 'ADMIN' || selectedAffiliate.role === 'SUPER_ADMIN' ? "bg-purple-100 text-purple-600 border border-purple-200" :
                        selectedAffiliate.role === 'MANAGER' ? "bg-emerald-100 text-emerald-600 border border-emerald-200" :
                        selectedAffiliate.role === 'SUPERVISOR' ? "bg-blue-100 text-blue-600 border border-blue-200" : "bg-slate-100 text-slate-500"
                      )}>
                        {selectedAffiliate.role === 'MANAGER' ? 'MANAGER' : selectedAffiliate.role === 'SUPERVISOR' ? 'LINE MANAGER' : selectedAffiliate.role}
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
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-purple-600 mb-1">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Business</span>
                    </div>
                    <p className="text-xl font-black text-slate-900">{selectedAffiliate._count?.businesses ?? 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Affiliates</span>
                    </div>
                    <p className="text-xl font-black text-slate-900">{selectedAffiliate._count?.referrals ?? 0}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                      <UserPlus className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Leads</span>
                    </div>
                    <p className="text-xl font-black text-slate-900">{selectedAffiliate._count?.leads ?? 0}</p>
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
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <Mail className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                          <p className="text-sm font-bold text-slate-900">{selectedAffiliate.email}</p>
                        </div>
                      </div>
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
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
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registration Date</p>
                          <p className="text-sm font-bold text-slate-900">{new Date(selectedAffiliate.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                        <div className="flex items-center gap-3 p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <Activity className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Active</p>
                          <p className="text-sm font-bold text-slate-900">2 hours ago</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Covered Locations */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-500" /> Covered Locations
                    </h5>
                    <div className="space-y-2">
                      {(locationsByUser[selectedAffiliate.id] || []).length > 0 ? (
                        locationsByUser[selectedAffiliate.id].map(loc => (
                          <Link
                            key={loc.id}
                            href={`/admin/affiliates/${selectedAffiliate.id}/history?locationId=${loc.id}`}
                            className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all group"
                          >
                            <MapPin className="w-5 h-5 text-blue-500" />
                            <div className="flex-1">
                              <p className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{loc.name}</p>
                              <p className="text-[10px] text-slate-500">Click to view history in this location</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-all" />
                          </Link>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic py-2">No locations assigned to this affiliate.</p>
                      )}
                    </div>
                  </div>

                  {/* Role & Assignment */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-500" /> Role & Assignment
                    </h5>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Role</p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedAffiliate.role}</p>
                        </div>
                        <button onClick={() => setIsEditModalOpen(true)} className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-xl hover:bg-blue-700 transition-all">Change</button>
                      </div>
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Line Manager</p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedAffiliate.supervisor?.fullName || 'Not assigned'}</p>
                        </div>
                        <button onClick={() => setAssignModal({ user: selectedAffiliate, type: 'supervisor' })} className="px-3 py-1.5 bg-violet-600 text-white text-[10px] font-bold rounded-xl hover:bg-violet-700 transition-all">Assign</button>
                      </div>
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Manager</p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedAffiliate.manager?.fullName || 'Not assigned'}</p>
                        </div>
                        <button onClick={() => setAssignModal({ user: selectedAffiliate, type: 'manager' })} className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-xl hover:bg-emerald-700 transition-all">Assign</button>
                      </div>
                    </div>
                  </div>

                  {/* Agreements History Section */}
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-500" /> Targeted Policies & Agreements
                    </h5>
                    
                    {isLoadingUserAgs ? (
                      <div className="flex items-center gap-2 text-slate-400 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs font-semibold">Loading agreement history...</span>
                      </div>
                    ) : userAgreements?.agreements && userAgreements.agreements.length > 0 ? (
                      <div className="space-y-3">
                        {userAgreements.agreements.map((ag: any) => (
                          <div key={ag.agreementId} className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100/80 flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-grow">
                              <p className="text-xs font-bold text-slate-800 leading-tight truncate">{ag.title}</p>
                              <p className="text-[9px] text-slate-400 font-semibold mt-1">
                                {ag.signed 
                                  ? `Signed v${ag.signedVersion} on ${new Date(ag.signedAt).toLocaleDateString()}` 
                                  : `Pending Signature (Latest: v${ag.latestVersion})`}
                              </p>
                            </div>
                            
                            {ag.isUpToDate ? (
                              <span className="shrink-0 inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[9px] font-black uppercase border border-emerald-100/50">
                                <CheckCircle className="w-3 h-3" /> Up to date
                              </span>
                            ) : ag.signed ? (
                              <span className="shrink-0 inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[9px] font-black uppercase border border-amber-100/50">
                                Outdated v{ag.signedVersion}
                              </span>
                            ) : (
                              <span className="shrink-0 inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-[9px] font-black uppercase border border-red-100/50">
                                Unsigned
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">No targeted agreements deployed for this user role.</p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 sm:pt-8 flex gap-3">
                  <Button className="flex-1 rounded-2xl h-10 sm:h-12 font-bold" onClick={() => setIsEditModalOpen(true)}>
                    Edit Profile
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-2xl h-10 sm:h-12 font-bold text-red-600 border-red-100 hover:bg-red-50" onClick={() => handleStatusChange(selectedAffiliate.id, selectedAffiliate.fullName, selectedAffiliate.status)}>
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

export default function AffiliatesPage() {
  return (
    <Suspense>
      <AffiliatesManagement />
    </Suspense>
  );
}

/* ---------- Send Email Modal ---------- */
function EmailUserModal({ user, isSending, onClose, onSubmit }: {
  user: UserType;
  isSending: boolean;
  onClose: () => void;
  onSubmit: (subject: string, message: string) => Promise<void>;
}) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl z-[310] p-4 sm:p-8 space-y-4 sm:space-y-5 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1.5 bg-slate-200 rounded-full" /></div>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900">Send Email</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700">
            {user.fullName?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{user.fullName}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</label>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="e.g. Welcome to Vemtap"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={5}
            placeholder="Write your message..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 resize-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 h-11 rounded-xl font-bold"
            isLoading={isSending}
            disabled={isSending || !subject.trim() || !message.trim()}
            onClick={() => onSubmit(subject, message)}
          >
            Send Email
          </Button>
        </div>
      </motion.div>
    </>
  );
}

/* ---------- Assign Line Manager / Manager Modal ---------- */
function AssignHierarchyModal({ user, type, isSaving, onClose, onAssign }: {
  user: UserType;
  type: 'supervisor' | 'manager';
  isSaving: boolean;
  onClose: () => void;
  onAssign: (targetId: string, targetName?: string) => Promise<void>;
}) {
  const [targetId, setTargetId] = useState('');
  const { data: candidatesResponse, isLoading } = useUsers({
    role: (type === 'supervisor' ? 'SUPERVISOR' : 'MANAGER') as any,
    limit: 100,
  });
  const candidates = (candidatesResponse?.data || []).filter(c => c.id !== user.id);
  const selectedCandidate = candidates.find(c => c.id === targetId);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl z-[310] p-4 sm:p-8 space-y-4 sm:space-y-5 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1.5 bg-slate-200 rounded-full" /></div>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900">
            Assign {type === 'supervisor' ? 'Line Manager' : 'Manager'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <p className="text-sm text-slate-500 font-medium">
          Assigning for <span className="font-bold text-slate-900">{user.fullName}</span>
        </p>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Select {type === 'supervisor' ? 'Line Manager' : 'Manager'} *
          </label>
          <select
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">-- Select --</option>
            {isLoading ? (
              <option disabled>Loading...</option>
            ) : candidates.map(c => (
              <option key={c.id} value={c.id}>{c.fullName} ({c.email})</option>
            ))}
          </select>
          {!isLoading && candidates.length === 0 && (
            <p className="text-xs text-slate-400 italic px-1">No {type === 'supervisor' ? 'line managers' : 'managers'} available yet.</p>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 h-11 rounded-xl font-bold" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1 h-11 rounded-xl font-bold"
            isLoading={isSaving}
            disabled={isSaving || !targetId}
            onClick={() => onAssign(targetId, selectedCandidate?.fullName)}
          >
            Assign
          </Button>
        </div>
      </motion.div>
    </>
  );
}
