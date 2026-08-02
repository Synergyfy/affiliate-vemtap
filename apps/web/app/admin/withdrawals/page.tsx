'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api-client';
import { 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Zap,
  Loader2,
  MoreHorizontal,
  Check,
  X,
  Banknote,
  CreditCard,
  AlertTriangle,
  ShieldAlert,
  Pencil,
  FileText,
  Send,
  History,
  User as UserIcon,
  Building,
  Hash,
  Calendar,
  MessageSquare,
  BadgeCheck,
  TrendingUp
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import FilterBar from '@/components/admin/FilterBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/toast';
import { useDebounce } from '@/hooks/use-debounce';

import { useAdminStats, useWithdrawals, useUpdateWithdrawalStatus, useUpdateWithdrawalAmount } from '@/services/useAdminHooks';
import { useWithdrawalStats } from '@/services/useWithdrawalHooks';
import { useCommissions } from '@/services/useCommissionsHooks';
import { WithdrawalStatus, Withdrawal } from '@/types/api';

type ModalType = 'approve' | 'reject' | 'edit' | 'details';

type ModalState =
  | { type: 'approve'; withdrawal: Withdrawal }
  | { type: 'reject'; withdrawal: Withdrawal }
  | { type: 'edit'; withdrawal: Withdrawal }
  | { type: 'details'; withdrawal: Withdrawal }
  | null;

export default function WithdrawalsManagement() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: withdrawalsResponse, isLoading: isWithdrawalsLoading } = useWithdrawals({ 
    limit: 50,
    search: debouncedSearch || undefined,
    status: statusFilter === 'All' ? undefined : statusFilter as any
  });
  const { data: stats } = useAdminStats();
  const { data: realWithdrawalStats } = useWithdrawalStats();
  const updateStatus = useUpdateWithdrawalStatus();
  const updateAmount = useUpdateWithdrawalAmount();

  const [modal, setModal] = useState<ModalState>(null);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const [editAmount, setEditAmount] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  const withdrawalsList = withdrawalsResponse?.data || [];

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    setOpenMenuId(openMenuId === id ? null : id);
  };

  const closeModal = () => setModal(null);

  const handleAction = async () => {
    if (!modal) return;
    const { type, withdrawal } = modal;

    try {
      if (type === 'approve') {
        await updateStatus.mutateAsync({ id: withdrawal.id, status: 'PAID' });
        showToast(`Withdrawal for ${withdrawal.user?.fullName} approved and marked as paid.`, 'success');
      } else if (type === 'reject') {
        await updateStatus.mutateAsync({ id: withdrawal.id, status: 'REJECTED' });
        showToast(`Withdrawal for ${withdrawal.user?.fullName} rejected.`, 'info');
      } else if (type === 'edit') {
        const amount = Number(editAmount);
        if (isNaN(amount) || amount <= 0) {
          showToast('Please enter a valid amount', 'error');
          return;
        }
        await updateAmount.mutateAsync({ id: withdrawal.id, amount });
        showToast(`Withdrawal amount updated to ₦${amount.toLocaleString()}`, 'success');
      }
      closeModal();
    } catch (error: any) {
      showToast(error.message || 'Action failed', 'error');
    }
  };

  const handleBulkTrigger = async () => {
    setIsBulkProcessing(true);
    try {
      const { data } = await api.post('/withdrawals/bulk-trigger');
      showToast(data.message || 'Bulk payouts triggered successfully!', 'success');
      setIsBulkConfirmOpen(false);
    } catch (error: any) {
      showToast(error.message || 'Failed to trigger bulk payouts', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const openModal = (w: Withdrawal, type: ModalType) => {
    setOpenMenuId(null);
    if (type === 'edit') setEditAmount(String(w.amount));
    if (type === 'reject') setRejectReason('');
    setModal({ type, withdrawal: w });
  };

  const withdrawalStats = [
    { label: 'Total Payouts', value: `₦${Number(realWithdrawalStats?.totalPayouts ?? stats?.completedPayouts ?? 0).toLocaleString()}`, icon: Banknote, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Request', value: `₦${Number(realWithdrawalStats?.pendingRequests ?? stats?.pendingPayouts ?? 0).toLocaleString()}`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Approved', value: `₦${Number(realWithdrawalStats?.approvedAmount ?? stats?.approvedPayouts ?? 0).toLocaleString()}`, icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed', value: `₦${Number(realWithdrawalStats?.completedAmount ?? stats?.completedPayouts ?? 0).toLocaleString()}`, icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const handleProcess = async (id: string, name: string, status: WithdrawalStatus, reason?: string) => {
    try {
      await updateStatus.mutateAsync({ id, status, reason });
      showToast(`Withdrawal for ${name} has been ${status.toLowerCase()}.`, 'success');
      setModal(null);
      setRejectReason('');
      setOpenMenuId(null);
    } catch (error) {
      showToast(`Failed to ${status.toLowerCase()} withdrawal.`, 'error');
    }
  };

  const handleEditAmount = async () => {
    if (!modal || modal.type !== 'edit') return;
    const amount = Number(editAmount);
    if (!amount || amount <= 0) {
      showToast('Enter a valid amount greater than zero.', 'error');
      return;
    }
    try {
      await updateAmount.mutateAsync({ id: modal.withdrawal.id, amount });
      showToast('Withdrawal amount updated successfully.', 'success');
      setModal(null);
      setOpenMenuId(null);
    } catch (error) {
      showToast('Failed to update withdrawal amount.', 'error');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Withdrawal Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {withdrawalStats.map((stat, idx) => (
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
        <FilterBar 
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search by name, bank or account..."
          activeFilter={statusFilter}
          onFilterChange={(v) => setStatusFilter(v as any)}
          filterLabel="Status"
          filterOptions={[
            { label: 'All Requests', value: 'ALL' },
            { label: 'Pending', value: 'PENDING' },
            { label: 'Approved', value: 'APPROVED' },
            { label: 'Paid', value: 'PAID' },
            { label: 'Rejected', value: 'REJECTED' }
          ]}
          extraActions={
            <button 
              onClick={() => setIsBulkConfirmOpen(true)}
              disabled={isBulkProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
            >
              {isBulkProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Trigger Bulk Payouts
            </button>
          }
        />

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto relative min-h-[400px]">
            {isWithdrawalsLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
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
                {withdrawalsResponse?.data.map((wth, idx) => (
                  <motion.tr 
                    key={wth.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50/50 transition-all group"
                  >
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{wth.user?.fullName || 'User'}</p>
                      <p className="text-xs text-slate-400 font-mono">{wth.id}</p>
                    </td>
                    <td className="p-4 text-sm text-slate-900 font-bold">₦{Number(wth.amount).toLocaleString()}</td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-700">{wth.bankName || 'Bank'}</p>
                      <p className="text-xs text-slate-500">{wth.accountName || ''} · {wth.accountNumber || 'Acc Number'}</p>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                        wth.status === 'PAID' ? "bg-green-100 text-green-600" : 
                        wth.status === 'APPROVED' ? "bg-blue-100 text-blue-600" : 
                        wth.status === 'REJECTED' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                      )}>
                        {wth.status}
                      </span>
                      {wth.status === 'REJECTED' && wth.adminNotes && (
                        <p className="text-[10px] text-red-500 italic mt-1 max-w-[200px] truncate" title={wth.adminNotes}>
                          {wth.adminNotes}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-600">{new Date(wth.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity relative">
                        {wth.status === 'APPROVED' && (
                          <button 
                            onClick={() => handleProcess(wth.id, wth.user?.fullName || 'User', 'PAID')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all"
                          >
                            Mark as Paid
                          </button>
                        )}
                        <div className="relative">
                          <button 
                            onClick={() => setOpenMenuId(openMenuId === wth.id ? null : wth.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
                            title="Actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openMenuId === wth.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 origin-top-right">
                                {wth.status === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => openModal(wth, 'approve')}
                                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                                    >
                                      <Check className="w-3.5 h-3.5" /> Approve Withdrawal
                                    </button>
                                    <button
                                      onClick={() => openModal(wth, 'reject')}
                                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" /> Reject Withdrawal
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => openModal(wth, 'edit')}
                                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit Amount
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button
                                  onClick={() => openModal(wth, 'details')}
                                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                  <FileText className="w-3.5 h-3.5" /> View Details
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bulk Payout Confirmation Modal */}
      <AnimatePresence>
        {isBulkConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsBulkConfirmOpen(false); setBulkConfirmText(''); }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-amber-50 rounded-2xl">
                    <ShieldAlert className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Trigger Bulk Payout</h3>
                    <p className="text-sm text-slate-500">Confirm before processing all eligible payouts</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">Important Warning</p>
                      <p className="text-xs text-amber-700 mt-1">This action will process all eligible pending and approved payouts for verified affiliates. This cannot be undone once initiated.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-white rounded-xl p-4 border border-amber-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payouts</p>
                      <p className="text-2xl font-black text-slate-900">{withdrawalsList.length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-amber-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Amount</p>
                      <p className="text-2xl font-black text-emerald-600">₦{(realWithdrawalStats?.pendingRequests ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <label className="text-sm font-bold text-slate-700">Type <span className="text-amber-600 font-black">"Bulk Payout"</span> to confirm</label>
                  <input
                    type="text"
                    value={bulkConfirmText}
                    onChange={(e) => setBulkConfirmText(e.target.value)}
                    placeholder="Type 'Bulk Payout' here..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-bold"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setIsBulkConfirmOpen(false); setBulkConfirmText(''); }}
                    className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkTrigger}
                    disabled={bulkConfirmText !== 'Bulk Payout' || isBulkProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg disabled:opacity-50"
                  >
                    {isBulkProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    {isBulkProcessing ? 'Processing...' : 'Confirm Bulk Payout'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Approve Confirmation Modal */}
      <AnimatePresence>
        {modal?.type === 'approve' && (
          <ModalShell onClose={() => setModal(null)}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-emerald-50 rounded-2xl">
                <BadgeCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Approve Withdrawal</h3>
                <p className="text-sm text-slate-500">Confirm this payout request</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Recipient</span>
                <span className="text-sm font-black text-slate-900">{modal.withdrawal.user?.fullName || 'User'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Amount</span>
                <span className="text-xl font-black text-emerald-600">₦{Number(modal.withdrawal.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500">Bank</span>
                <span className="text-sm font-bold text-slate-900">{modal.withdrawal.bankName} · {modal.withdrawal.accountNumber}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={() => handleProcess(modal.withdrawal.id, modal.withdrawal.user?.fullName || 'User', 'APPROVED')} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg">
                <Check className="w-4 h-4" /> Approve Payout
              </button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {modal?.type === 'reject' && (
          <ModalShell onClose={() => setModal(null)}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-50 rounded-2xl">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Reject Withdrawal</h3>
                <p className="text-sm text-slate-500">Let the user know why this was rejected</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-6">
              <p className="text-xs font-bold text-slate-500 mb-1">Amount</p>
              <p className="text-xl font-black text-red-600">₦{Number(modal.withdrawal.amount).toLocaleString()}</p>
              <p className="text-[10px] text-slate-400 mt-2">The user will see this reason on their withdrawal history.</p>
            </div>
            <div className="space-y-2 mb-6">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-red-500" /> Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Bank account number could not be verified. Please confirm your account details and try again."
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm font-medium"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">Cancel</button>
              <button
                onClick={() => { if (!rejectReason.trim()) { showToast('Please provide a reason for rejection.', 'error'); return; } handleProcess(modal.withdrawal.id, modal.withdrawal.user?.fullName || 'User', 'REJECTED', rejectReason.trim()); }}
                disabled={updateStatus.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg disabled:opacity-50"
              >
                {updateStatus.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Reject Request
              </button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* Edit Amount Modal */}
      <AnimatePresence>
        {modal?.type === 'edit' && (
          <ModalShell onClose={() => setModal(null)}>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-amber-50 rounded-2xl">
                <Pencil className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Edit Withdrawal Amount</h3>
                <p className="text-sm text-slate-500">Manually adjust the payout amount for {modal.withdrawal.user?.fullName || 'this user'}</p>
              </div>
            </div>
            <div className="space-y-2 mb-6">
              <label className="text-sm font-bold text-slate-700">New Amount (₦)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₦</span>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="0"
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-bold"
                />
              </div>
              <p className="text-[10px] text-slate-400">Originally requested: ₦{Number(modal.withdrawal.amount).toLocaleString()}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleEditAmount} disabled={updateAmount.isPending} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg disabled:opacity-50">
                {updateAmount.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                Save Amount
              </button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {modal?.type === 'details' && (
          <WithdrawalDetailsModal withdrawal={modal.withdrawal} onClose={() => setModal(null)} />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8">{children}</div>
      </motion.div>
    </div>
  );
}

function WithdrawalDetailsModal({ withdrawal, onClose }: { withdrawal: Withdrawal; onClose: () => void }) {
  const { data: commissionsData, isLoading: isLoadingComms } = useCommissions({ limit: 20, userId: withdrawal.userId });
  const commissions = commissionsData?.data || [];
  const totalEarned = commissions.reduce((sum, c) => sum + Number(c.amount), 0);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-6 sm:p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Withdrawal Details</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requested {new Date(withdrawal.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Amount & Status */}
          <div className="bg-slate-900 rounded-2xl p-5 text-white mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Requested Amount</p>
              <p className="text-3xl font-black mt-1">₦{Number(withdrawal.amount).toLocaleString()}</p>
            </div>
            <span className={cn(
              "text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider",
              withdrawal.status === 'PAID' ? "bg-green-500/20 text-green-300" :
              withdrawal.status === 'APPROVED' ? "bg-blue-500/20 text-blue-300" :
              withdrawal.status === 'REJECTED' ? "bg-red-500/20 text-red-300" : "bg-orange-500/20 text-orange-300"
            )}>
              {withdrawal.status}
            </span>
          </div>

          {/* User & Bank */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <UserIcon className="w-4 h-4 text-blue-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">User</p>
                <p className="text-sm font-bold text-slate-900 truncate">{withdrawal.user?.fullName || 'User'}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <Hash className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">User ID</p>
                <p className="text-sm font-bold text-slate-900 truncate">{withdrawal.userId}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <Building className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bank</p>
                <p className="text-sm font-bold text-slate-900">{withdrawal.bankName || '—'}</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account</p>
                <p className="text-sm font-bold text-slate-900">{withdrawal.accountNumber || '—'} · {withdrawal.accountName || ''}</p>
              </div>
            </div>
          </div>

          {/* Rejection reason if any */}
          {withdrawal.status === 'REJECTED' && withdrawal.adminNotes && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl mb-6 flex items-start gap-3">
              <MessageSquare className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Rejection Reason</p>
                <p className="text-sm font-medium text-red-700 mt-1">{withdrawal.adminNotes}</p>
              </div>
            </div>
          )}

          {/* Earnings history */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Earnings History ({commissions.length} commission{commissions.length === 1 ? '' : 's'})
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Total Commission Earned</p>
                <p className="text-xl font-black text-emerald-700 mt-0.5">₦{totalEarned.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Withdrawal Amount</p>
                <p className="text-xl font-black text-blue-700 mt-0.5">₦{Number(withdrawal.amount).toLocaleString()}</p>
              </div>
            </div>
            {isLoadingComms ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
            ) : commissions.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <History className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No commission records found for this user.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Source</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {commissions.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-xs font-bold text-slate-800">{c.business?.businessName || 'Business'}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase", c.type === 'DIRECT' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600")}>
                            {c.type === 'DIRECT' ? 'Direct' : 'Network'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-black text-emerald-600">₦{Number(c.amount).toLocaleString()}</td>
                        <td className="px-4 py-3 text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Status timeline */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> Request Timeline
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <p className="text-xs font-bold text-slate-700">Requested</p>
                <span className="text-[10px] text-slate-400 ml-auto">{new Date(withdrawal.createdAt).toLocaleString()}</span>
              </div>
              {withdrawal.processedAt && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", withdrawal.status === 'REJECTED' ? 'bg-red-500' : 'bg-blue-500')} />
                  <p className="text-xs font-bold text-slate-700">{withdrawal.status === 'REJECTED' ? 'Rejected' : 'Processed'}</p>
                  <span className="text-[10px] text-slate-400 ml-auto">{new Date(withdrawal.processedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-slate-100 shrink-0 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
