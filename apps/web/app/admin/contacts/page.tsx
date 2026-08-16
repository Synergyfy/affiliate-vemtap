'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Phone, 
  Mail, 
  Building2, 
  User as UserIcon, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ChevronRight, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  MapPin, 
  Briefcase, 
  Loader2, 
  Sparkles,
  ArrowUpDown,
  Smartphone,
  Calendar,
  Layers,
  FileSpreadsheet,
  Users,
  ShieldAlert,
  Send,
  MessageSquareQuote,
  Edit3,
  Trash2,
  GitCompare,
  AlertTriangle,
  Percent,
  SlidersHorizontal,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  useHarvestLeads, 
  downloadHarvestExport, 
  useDuplicateLeads, 
  useUpdateLeadAdmin, 
  useDeleteLeadAdmin 
} from '@/services/useAdminHooks';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@/hooks/toast';
import { cn } from '@/lib/utils';
import { Lead, DuplicateCluster, DuplicateLeadItem } from '@/types/api';

const formatRoleLabel = (role?: string) => {
  if (!role) return 'AFFILIATE';
  if (role === 'SUPERVISOR') return 'LINE MANAGER';
  if (role === 'MANAGER') return 'MANAGER';
  if (role === 'SALES_EXECUTIVE') return 'SALES EXEC';
  if (role === 'SUPER_ADMIN') return 'SUPER ADMIN';
  return role.replace(/_/g, ' ');
};

const roleBadgeColor: Record<string, string> = {
  AGENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  AFFILIATE: 'bg-blue-50 text-blue-700 border-blue-200',
  SUPERVISOR: 'bg-purple-50 text-purple-700 border-purple-200',
  MANAGER: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  SALES_EXECUTIVE: 'bg-amber-50 text-amber-700 border-amber-200',
  ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
  SUPER_ADMIN: 'bg-red-50 text-red-700 border-red-200',
};

const statusBadgeColor: Record<string, string> = {
  CONVERTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CUSTOMER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INTERESTED: 'bg-blue-50 text-blue-700 border-blue-200',
  DEMO_SCHEDULED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  DEMO_DONE: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  VISITED: 'bg-amber-50 text-amber-700 border-amber-200',
  CONTACTED: 'bg-purple-50 text-purple-700 border-purple-200',
  NOT_YET: 'bg-slate-100 text-slate-700 border-slate-200',
  LOST: 'bg-rose-50 text-rose-700 border-rose-200',
  NOT_INTERESTED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const roleFilterOptions = [
  { label: 'All Roles', value: '' },
  { label: 'Agents', value: 'AGENT' },
  { label: 'Affiliates', value: 'AFFILIATE' },
  { label: 'Line Managers', value: 'SUPERVISOR' },
  { label: 'Managers', value: 'MANAGER' },
  { label: 'Sales Execs', value: 'SALES_EXECUTIVE' },
];

const statusFilterOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Customer / Converted', value: 'CUSTOMER' },
  { label: 'Interested', value: 'INTERESTED' },
  { label: 'Visited', value: 'VISITED' },
  { label: 'Contacted', value: 'CONTACTED' },
  { label: 'New Lead (Not Yet)', value: 'NOT_YET' },
  { label: 'Not Interested', value: 'NOT_INTERESTED' },
];

export default function HarvestContactsPage() {
  const { showToast } = useToast();

  // Tab View Mode
  const [activeTab, setActiveTab] = useState<'all' | 'duplicates'>('all');

  // Standard Harvest State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [locationTerm, setLocationTerm] = useState('');
  const [phoneOnly, setPhoneOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Duplicates Hub State
  const [duplicateThreshold, setDuplicateThreshold] = useState(70);
  const [duplicateSearch, setDuplicateSearch] = useState('');

  // Modals & Drawer State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit Lead Modal State
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editFormData, setEditFormData] = useState({
    businessName: '',
    industry: '',
    contactName: '',
    contactRole: '',
    phone: '',
    email: '',
    location: '',
    businessAddress: '',
    status: 'NOT_YET',
    priority: 'MEDIUM',
    comments: '',
  });

  // Delete Confirmation Modal State
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);

  // Debounces
  const debouncedSearch = useDebounce(searchTerm, 400);
  const debouncedLocation = useDebounce(locationTerm, 400);
  const debouncedDuplicateSearch = useDebounce(duplicateSearch, 400);

  // Queries & Mutations
  const filterParams = useMemo(() => ({
    page,
    limit: 25,
    search: debouncedSearch || undefined,
    role: selectedRole || undefined,
    status: selectedStatus || undefined,
    location: debouncedLocation || undefined,
    hasPhone: phoneOnly ? true : undefined,
    sortBy: 'createdAt',
    sortOrder,
  }), [page, debouncedSearch, selectedRole, selectedStatus, debouncedLocation, phoneOnly, sortOrder]);

  const { data: harvestData, isLoading: isLoadingHarvest, refetch: refetchHarvest } = useHarvestLeads(filterParams);
  
  const duplicateParams = useMemo(() => ({
    threshold: duplicateThreshold,
    search: debouncedDuplicateSearch || undefined,
    limit: 100,
  }), [duplicateThreshold, debouncedDuplicateSearch]);

  const { 
    data: duplicatesData, 
    isLoading: isLoadingDuplicates, 
    isFetching: isFetchingDuplicates,
    refetch: refetchDuplicates 
  } = useDuplicateLeads(duplicateParams);

  const updateLeadMutation = useUpdateLeadAdmin();
  const deleteLeadMutation = useDeleteLeadAdmin();

  // Populate Edit Modal when opening
  useEffect(() => {
    if (editingLead) {
      setEditFormData({
        businessName: editingLead.businessName || '',
        industry: editingLead.industry || '',
        contactName: editingLead.contactName || '',
        contactRole: editingLead.contactRole || '',
        phone: editingLead.phone || '',
        email: editingLead.email || '',
        location: editingLead.location || '',
        businessAddress: editingLead.businessAddress || '',
        status: editingLead.status || 'NOT_YET',
        priority: editingLead.priority || 'MEDIUM',
        comments: editingLead.comments || '',
      });
    }
  }, [editingLead]);

  const leads = harvestData?.data || [];
  const meta = harvestData?.meta || { total: 0, page: 1, limit: 25, totalPages: 1 };
  const stats = harvestData?.stats || {
    totalHarvested: 0,
    totalWithPhone: 0,
    totalConverted: 0,
    totalPipeline: 0,
    statusBreakdown: {},
  };

  const duplicateClusters = duplicatesData?.clusters || [];
  const duplicateStats = duplicatesData?.stats || {
    totalClusters: 0,
    totalDuplicateLeads: 0,
    highConfidenceClusters: 0,
    threshold: duplicateThreshold,
  };

  const copyToClipboard = async (text: string, label: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
      showToast(`${label} copied to clipboard`, 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      await downloadHarvestExport({
        search: debouncedSearch || undefined,
        role: selectedRole || undefined,
        status: selectedStatus || undefined,
        location: debouncedLocation || undefined,
        hasPhone: phoneOnly ? true : undefined,
        sortOrder,
      });
      showToast('Export generated and downloaded successfully', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to export CSV', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    try {
      await updateLeadMutation.mutateAsync({
        leadId: editingLead.id,
        data: editFormData as any,
      });
      showToast('Lead details updated successfully', 'success');
      setEditingLead(null);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to update lead', 'error');
    }
  };

  const handleDeleteLead = async () => {
    if (!deletingLead) return;

    try {
      await deleteLeadMutation.mutateAsync(deletingLead.id);
      showToast('Lead deleted successfully', 'success');
      setDeletingLead(null);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to delete lead', 'error');
    }
  };

  // Harvested clean phone numbers list
  const harvestedPhoneNumbers = useMemo(() => {
    const numbers = leads
      .map(l => l.phone?.trim())
      .filter((p): p is string => Boolean(p && p.length >= 7));
    return Array.from(new Set(numbers));
  }, [leads]);

  const getSimilarityBadge = (percentage: number, isPrimary: boolean) => {
    if (isPrimary) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          100% Primary Record
        </span>
      );
    }

    if (percentage >= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          {percentage}% High Similarity
        </span>
      );
    }

    if (percentage >= 80) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
          <Percent className="w-3.5 h-3.5 text-amber-600" />
          {percentage}% Match
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <Percent className="w-3.5 h-3.5 text-blue-600" />
        {percentage}% Match
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto">
        {/* Top Header & Harvesting Action Hub */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
                  Business Contacts Harvest
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Admin Directory
                  </span>
                </h1>
                <p className="text-sm text-slate-500 font-medium mt-0.5">
                  Harvest, detect duplicate leads, and filter records captured across all affiliate tiers.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setIsHarvestModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              <Smartphone className="w-4 h-4" />
              <span>Harvest Phone Numbers</span>
              <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                {harvestedPhoneNumbers.length}
              </span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-60"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <Download className="w-4 h-4 text-slate-600" />
              )}
              Export CSV
            </button>
          </div>
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all relative border",
                activeTab === 'all'
                  ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Building2 className="w-4 h-4" />
              <span>All Harvested Contacts</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full font-mono font-bold ml-1",
                activeTab === 'all' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              )}>
                {stats.totalHarvested.toLocaleString()}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('duplicates')}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all relative border",
                activeTab === 'duplicates'
                  ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <GitCompare className="w-4 h-4" />
              <span>Duplicate Clusters & Similarity</span>
              {duplicateStats.totalClusters > 0 && (
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-mono font-black ml-1 animate-pulse",
                  activeTab === 'duplicates' ? "bg-white text-rose-700" : "bg-rose-100 text-rose-700"
                )}>
                  {duplicateStats.totalClusters} Groups
                </span>
              )}
            </button>
          </div>

          {activeTab === 'duplicates' && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>Fuzzy AI Similarity Clustering Engine</span>
            </div>
          )}
        </div>

        {/* TAB 1: ALL HARVESTED CONTACTS */}
        {activeTab === 'all' && (
          <div className="space-y-6">
            {/* Stats Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Harvested</span>
                  <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                  {stats.totalHarvested.toLocaleString()}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">All business leads captured in system</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reachable Phones</span>
                  <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
                    <Phone className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-emerald-600 tracking-tight font-mono">
                  {stats.totalWithPhone.toLocaleString()}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {stats.totalHarvested > 0 
                    ? `${Math.round((stats.totalWithPhone / stats.totalHarvested) * 100)}% have phone numbers ready for SMS`
                    : 'Ready for bulk SMS broadcast'}
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Converted Customers</span>
                  <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-indigo-600 tracking-tight font-mono">
                  {stats.totalConverted.toLocaleString()}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Active & paid converted subscribers</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">In-Pipeline Leads</span>
                  <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-amber-600 tracking-tight font-mono">
                  {stats.totalPipeline.toLocaleString()}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Visited, interested, or demos scheduled</p>
              </motion.div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[280px]">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    placeholder="Search business, contact person, phone, email, or user who added..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Location Filter */}
                <div className="relative w-full lg:w-56">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={locationTerm}
                    onChange={(e) => { setLocationTerm(e.target.value); setPage(1); }}
                    placeholder="Filter location / state..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Pipeline Status Filter */}
                <div className="w-full lg:w-56">
                  <select
                    value={selectedStatus}
                    onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                  >
                    {statusFilterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Phone Only Switch */}
                <label className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer select-none hover:bg-slate-100 transition-colors shrink-0">
                  <input
                    type="checkbox"
                    checked={phoneOnly}
                    onChange={(e) => { setPhoneOnly(e.target.checked); setPage(1); }}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-700">Phone Available Only</span>
                </label>

                {/* Sort Toggle */}
                <button
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-2xl text-xs font-bold text-slate-700 transition-all shrink-0"
                  title="Toggle sort order"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
                </button>
              </div>

              {/* Role Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
                  Added By Role:
                </span>
                {roleFilterOptions.map((roleOpt) => {
                  const active = selectedRole === roleOpt.value;
                  return (
                    <button
                      key={roleOpt.value}
                      onClick={() => { setSelectedRole(roleOpt.value); setPage(1); }}
                      className={cn(
                        "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border",
                        active
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {roleOpt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contacts Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative min-h-[480px]">
              {isLoadingHarvest && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading harvested contacts...</p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <th className="p-4 pl-6 font-bold text-slate-600 text-xs uppercase tracking-wider">Business</th>
                      <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Contact Person</th>
                      <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Added By (User)</th>
                      <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                      <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Date Added</th>
                      <th className="p-4 pr-6 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {leads.map((lead, idx) => {
                      const role = lead.user?.role || 'AFFILIATE';
                      const roleClass = roleBadgeColor[role] || 'bg-slate-100 text-slate-700 border-slate-200';
                      const statusClass = statusBadgeColor[lead.status] || 'bg-slate-100 text-slate-700 border-slate-200';

                      return (
                        <motion.tr 
                          key={lead.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          onClick={() => setSelectedLead(lead)}
                        >
                          {/* Business info */}
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-black text-sm shrink-0 uppercase">
                                {lead.businessName.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[200px]">
                                    {lead.businessName}
                                  </p>
                                  {lead.industry && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 truncate max-w-[100px]">
                                      {lead.industry}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-[240px]">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  {lead.location || lead.businessAddress || 'Location not specified'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Contact person */}
                          <td className="p-4">
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                <span>{lead.contactName || 'No contact name'}</span>
                                {lead.contactRole && (
                                  <span className="text-[10px] font-semibold text-slate-400">
                                    ({lead.contactRole})
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                {lead.phone ? (
                                  <div className="flex items-center gap-1 text-slate-700 font-mono font-medium">
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span>{lead.phone}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(lead.phone!, 'Phone', lead.id);
                                      }}
                                      className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors"
                                      title="Copy phone"
                                    >
                                      {copiedId === lead.id ? (
                                        <Check className="w-3 h-3 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">No phone</span>
                                )}

                                {lead.email && (
                                  <span className="text-slate-500 truncate max-w-[140px]" title={lead.email}>
                                    • {lead.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Added by User */}
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 border border-slate-200">
                                {lead.user?.fullName?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-slate-900 text-xs">
                                    {lead.user?.fullName || 'Unknown User'}
                                  </p>
                                  <span className={cn("text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider", roleClass)}>
                                    {formatRoleLabel(role)}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                  {lead.user?.phone || lead.user?.email || `Code: ${lead.user?.referralCode || 'N/A'}`}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Pipeline Status */}
                          <td className="p-4">
                            <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider inline-flex items-center gap-1", statusClass)}>
                              {lead.status === 'CUSTOMER' ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : lead.status === 'NOT_INTERESTED' ? (
                                <XCircle className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              {lead.status}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="p-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                            {new Date(lead.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>

                          {/* Actions */}
                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => setEditingLead(lead)}
                                className="p-2 hover:bg-blue-50 rounded-xl text-slate-400 hover:text-blue-600 transition-colors"
                                title="Edit Lead"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeletingLead(lead)}
                                className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors"
                                title="Delete Lead"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setSelectedLead(lead)}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"
                                title="View Full Profile"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}

                    {!isLoadingHarvest && leads.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-12 text-center">
                          <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
                            <div className="w-14 h-14 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400">
                              <Building2 className="w-7 h-7" />
                            </div>
                            <h4 className="text-base font-bold text-slate-800">No Business Contacts Found</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              No leads match the selected filter criteria. Try clearing search keywords or resetting your role and status filters.
                            </p>
                            <button
                              onClick={() => {
                                setSearchTerm('');
                                setSelectedRole('');
                                setSelectedStatus('');
                                setLocationTerm('');
                                setPhoneOnly(false);
                                setPage(1);
                              }}
                              className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                            >
                              Reset All Filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination bar */}
              {meta.totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-4 text-xs font-medium text-slate-500">
                  <p>
                    Showing Page <span className="font-bold text-slate-900">{meta.page}</span> of <span className="font-bold text-slate-900">{meta.totalPages}</span> ({meta.total} Total Contacts)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                        let pageNum = i + 1;
                        if (meta.totalPages > 5 && page > 3) {
                          pageNum = page - 3 + i + 1;
                          if (pageNum > meta.totalPages) pageNum = meta.totalPages - 4 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={cn(
                              "w-8 h-8 rounded-xl font-bold transition-all",
                              page === pageNum
                                ? "bg-blue-600 text-white shadow-sm"
                                : "hover:bg-slate-100 text-slate-700"
                            )}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                      disabled={page >= meta.totalPages}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-slate-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DUPLICATE CLUSTERS & SIMILARITY MANAGEMENT */}
        {activeTab === 'duplicates' && (
          <div className="space-y-6">
            {/* Duplicates Metric Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Duplicate Clusters</span>
                  <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600">
                    <GitCompare className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-rose-600 tracking-tight font-mono">
                  {duplicateStats.totalClusters.toLocaleString()}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Distinct groups of overlapping leads</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Duplicated Leads</span>
                  <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-amber-600 tracking-tight font-mono">
                  {duplicateStats.totalDuplicateLeads.toLocaleString()}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Individual lead entries across all clusters</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">High Confidence (≥90%)</span>
                  <div className="p-2.5 rounded-2xl bg-red-50 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-red-600 tracking-tight font-mono">
                  {duplicateStats.highConfidenceClusters.toLocaleString()}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Identical phones, emails, or exact names</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Sensitivity</span>
                  <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                  ≥ {duplicateThreshold}%
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Fuzzy matching similarity threshold</p>
              </motion.div>
            </div>

            {/* Duplicates Filter & Sensitivity Controls */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                {/* Search in duplicates */}
                <div className="relative flex-1 min-w-[280px]">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={duplicateSearch}
                    onChange={(e) => setDuplicateSearch(e.target.value)}
                    placeholder="Search within duplicate clusters by business, phone, or creator..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-rose-500 transition-all"
                  />
                  {duplicateSearch && (
                    <button
                      onClick={() => setDuplicateSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Similarity Threshold Presets */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 shrink-0">
                    <Percent className="w-3.5 h-3.5 text-slate-400" />
                    Threshold:
                  </span>
                  {[
                    { label: '60% (Broad)', value: 60 },
                    { label: '70% (Balanced)', value: 70 },
                    { label: '80% (Strict)', value: 80 },
                    { label: '90% (Exact/Phone)', value: 90 },
                  ].map((preset) => {
                    const active = duplicateThreshold === preset.value;
                    return (
                      <button
                        key={preset.value}
                        onClick={() => setDuplicateThreshold(preset.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                          active
                            ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => refetchDuplicates()}
                    className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors ml-1"
                    title="Recalculate duplicate clusters"
                  >
                    <RefreshCw className={cn("w-4 h-4", isFetchingDuplicates && "animate-spin text-rose-600")} />
                  </button>
                </div>
              </div>
            </div>

            {/* Clusters List View */}
            <div className="space-y-6 relative min-h-[400px]">
              {isLoadingDuplicates && (
                <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Analyzing database & clustering duplicate leads...
                  </p>
                </div>
              )}

              {!isLoadingDuplicates && duplicateClusters.length === 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                  <div className="max-w-md mx-auto flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">No Duplicate Leads Detected</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      All harvested leads are unique at the current similarity threshold (≥ {duplicateThreshold}%). If you want to detect looser matches, try lowering the sensitivity threshold to 60%.
                    </p>
                    <button
                      onClick={() => setDuplicateThreshold(60)}
                      className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                      Try 60% Sensitivity
                    </button>
                  </div>
                </div>
              )}

              {!isLoadingDuplicates && duplicateClusters.map((cluster, cIdx) => {
                return (
                  <motion.div
                    key={cluster.clusterId}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: cIdx * 0.04 }}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden"
                  >
                    {/* Cluster Banner Header */}
                    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-mono font-black text-sm text-rose-300">
                          #{cIdx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-black text-white">
                              {cluster.primaryBusinessName}
                            </h3>
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 uppercase tracking-wider">
                              {cluster.leadCount} Similar Leads Grouped
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>Max Similarity: <strong className="text-rose-400 font-mono">{cluster.maxSimilarity}%</strong></span>
                            <span>•</span>
                            <span className="text-slate-300">Matching criteria: {cluster.matchReasons.join(', ') || 'High fuzzy match'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono bg-white/10 px-3 py-1.5 rounded-xl text-slate-300">
                          Cluster Ref: {cluster.primaryLeadId.slice(0, 8)}
                        </span>
                      </div>
                    </div>

                    {/* Grouped Leads Grid / Comparison Row */}
                    <div className="p-6 divide-y divide-slate-100 bg-slate-50/50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                        {cluster.leads.map((item) => {
                          const role = item.user?.role || 'AFFILIATE';
                          const roleClass = roleBadgeColor[role] || 'bg-slate-100 text-slate-700 border-slate-200';
                          const statusClass = statusBadgeColor[item.status] || 'bg-slate-100 text-slate-700 border-slate-200';

                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "rounded-3xl p-5 border transition-all relative flex flex-col justify-between space-y-4",
                                item.isPrimary
                                  ? "bg-white border-emerald-300 shadow-sm ring-1 ring-emerald-500/20"
                                  : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                              )}
                            >
                              {/* Top Similarity & Status Header */}
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                  {getSimilarityBadge(item.similarityPercentage, item.isPrimary)}
                                  <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", statusClass)}>
                                    {item.status}
                                  </span>
                                </div>

                                {/* Matching factors tags */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {item.reasons.map((r, rIdx) => (
                                    <span 
                                      key={rIdx} 
                                      className={cn(
                                        "text-[10px] font-semibold px-2 py-0.5 rounded-lg border",
                                        item.isPrimary
                                          ? "bg-emerald-50/80 text-emerald-800 border-emerald-200"
                                          : "bg-slate-100 text-slate-700 border-slate-200"
                                      )}
                                    >
                                      {r}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Business & Contact Details */}
                              <div className="space-y-2.5 text-xs">
                                <div>
                                  <h4 className="text-sm font-black text-slate-900 truncate">
                                    {item.businessName}
                                  </h4>
                                  <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{item.location || item.businessAddress || 'Location not specified'}</span>
                                  </p>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5">
                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-bold text-[10px] uppercase">Contact</span>
                                    <span className="font-bold text-slate-800">{item.contactName || 'No contact name'}</span>
                                  </div>

                                  <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-bold text-[10px] uppercase">Phone</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-emerald-700">{item.phone || 'No phone'}</span>
                                      {item.phone && (
                                        <button
                                          onClick={() => copyToClipboard(item.phone!, 'Phone', item.id)}
                                          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700"
                                          title="Copy phone"
                                        >
                                          {copiedId === item.id ? (
                                            <Check className="w-3 h-3 text-emerald-600" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {item.email && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400 font-bold text-[10px] uppercase">Email</span>
                                      <span className="font-medium text-slate-700 truncate max-w-[140px]">{item.email}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Creator Card */}
                                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 border border-slate-200">
                                      {item.user?.fullName?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-900 text-[11px] truncate max-w-[120px]">
                                        {item.user?.fullName || 'Unknown User'}
                                      </p>
                                      <p className="text-[10px] text-slate-400 font-mono">
                                        {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </p>
                                    </div>
                                  </div>

                                  <span className={cn("text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider", roleClass)}>
                                    {formatRoleLabel(role)}
                                  </span>
                                </div>

                                {item.comments && (
                                  <p className="text-[11px] text-slate-600 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/50 italic line-clamp-2">
                                    "{item.comments}"
                                  </p>
                                )}
                              </div>

                              {/* Lead Management Action Buttons */}
                              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                <button
                                  onClick={() => setEditingLead(item)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold border border-slate-200 hover:border-blue-200 transition-all"
                                  title="Edit Lead Information"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>

                                <button
                                  onClick={() => setDeletingLead(item)}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold border border-slate-200 hover:border-rose-200 transition-all"
                                  title="Delete Duplicate Lead"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>

                                <button
                                  onClick={() => setSelectedLead(item)}
                                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors"
                                  title="View Full Profile Drawer"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Detailed Drawer for Contact */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-8 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20">
                      {selectedLead.businessName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">{selectedLead.businessName}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {selectedLead.industry || 'General Business'} • Lead ID: {selectedLead.id.split('-')[0]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const target = selectedLead;
                        setSelectedLead(null);
                        setEditingLead(target);
                      }}
                      className="p-2 hover:bg-blue-50 rounded-2xl text-slate-400 hover:text-blue-600 transition-colors"
                      title="Edit Lead"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedLead(null)}
                      className="p-2 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Status & Priority Row */}
                <div className="flex items-center gap-3">
                  <span className={cn("text-xs font-bold px-3 py-1.5 rounded-full border uppercase tracking-wider", statusBadgeColor[selectedLead.status] || '')}>
                    {selectedLead.status}
                  </span>
                  {selectedLead.priority && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                      {selectedLead.priority} Priority
                    </span>
                  )}
                  {selectedLead.visitedAt && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Visited
                    </span>
                  )}
                </div>

                {/* Contact Card */}
                <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    Business Contact Person
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
                      <span className="text-xs font-bold text-slate-400">Contact Name</span>
                      <span className="text-sm font-bold text-slate-900">{selectedLead.contactName || 'Not recorded'}</span>
                    </div>
                    {selectedLead.contactRole && (
                      <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-xs font-bold text-slate-400">Role / Position</span>
                        <span className="text-sm font-bold text-slate-900">{selectedLead.contactRole}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
                      <span className="text-xs font-bold text-slate-400">Phone Number</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-emerald-700">{selectedLead.phone || 'No phone'}</span>
                        {selectedLead.phone && (
                          <button
                            onClick={() => copyToClipboard(selectedLead.phone!, 'Phone')}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                            title="Copy Phone"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {selectedLead.email && (
                      <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-xs font-bold text-slate-400">Email</span>
                        <span className="text-sm font-medium text-slate-900">{selectedLead.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Creator Profile Box */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-400" />
                      Captured By User
                    </span>
                    <span className={cn("text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider", roleBadgeColor[selectedLead.user?.role || 'AFFILIATE'])}>
                      {formatRoleLabel(selectedLead.user?.role || 'AFFILIATE')}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 pt-1">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-lg text-white">
                      {selectedLead.user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{selectedLead.user?.fullName || 'Unknown User'}</h4>
                      <p className="text-xs text-slate-300 font-mono mt-0.5">{selectedLead.user?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">User Phone</span>
                      <span className="text-slate-100 font-mono font-bold">{selectedLead.user?.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Referral Code</span>
                      <span className="text-blue-300 font-mono font-bold">{selectedLead.user?.referralCode || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Business Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location & Business Parameters</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block font-bold text-[10px] uppercase mb-1">Address / Location</span>
                      <span className="font-bold text-slate-800">{selectedLead.location || selectedLead.businessAddress || 'Not specified'}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block font-bold text-[10px] uppercase mb-1">Daily Customers</span>
                      <span className="font-bold text-slate-800">{selectedLead.dailyCustomers || 'N/A'}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block font-bold text-[10px] uppercase mb-1">Business Size</span>
                      <span className="font-bold text-slate-800">{selectedLead.businessSize || 'N/A'}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 block font-bold text-[10px] uppercase mb-1">Decision Maker Met</span>
                      <span className="font-bold text-slate-800">{selectedLead.decisionMakerMet ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                {/* Comments / Field Notes */}
                {selectedLead.comments && (
                  <div className="p-5 bg-amber-50/50 rounded-3xl border border-amber-200/60 space-y-2">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
                      <MessageSquareQuote className="w-4 h-4 text-amber-600" />
                      Field Notes & Comments
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedLead.comments}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* EDIT LEAD MODAL */}
      <AnimatePresence>
        {editingLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingLead(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Edit Lead Information</h3>
                    <p className="text-xs text-slate-500 font-medium">Update business, contact, or pipeline details</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingLead(null)}
                  className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Business Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.businessName}
                      onChange={(e) => setEditFormData({ ...editFormData, businessName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Industry / Category</label>
                    <input
                      type="text"
                      value={editFormData.industry}
                      onChange={(e) => setEditFormData({ ...editFormData, industry: e.target.value })}
                      placeholder="e.g. Retail, Restaurant, Pharmacy"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person Name</label>
                    <input
                      type="text"
                      value={editFormData.contactName}
                      onChange={(e) => setEditFormData({ ...editFormData, contactName: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Role / Title</label>
                    <input
                      type="text"
                      value={editFormData.contactRole}
                      onChange={(e) => setEditFormData({ ...editFormData, contactRole: e.target.value })}
                      placeholder="e.g. Owner, Manager, Cashier"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      placeholder="e.g. 08012345678"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      placeholder="e.g. contact@business.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Pipeline Status</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="NOT_YET">New Lead (Not Yet)</option>
                      <option value="VISITED">Visited</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="INTERESTED">Interested</option>
                      <option value="DEMO_SCHEDULED">Demo Scheduled</option>
                      <option value="DEMO_DONE">Demo Done</option>
                      <option value="CONVERTED">Converted</option>
                      <option value="CUSTOMER">Customer (Active)</option>
                      <option value="NOT_INTERESTED">Not Interested</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
                    <select
                      value={editFormData.priority}
                      onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Location / Address</label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value, businessAddress: e.target.value })}
                    placeholder="e.g. 15 Allen Avenue, Ikeja, Lagos"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Field Notes & Comments</label>
                  <textarea
                    rows={3}
                    value={editFormData.comments}
                    onChange={(e) => setEditFormData({ ...editFormData, comments: e.target.value })}
                    placeholder="Add observations or instructions..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingLead(null)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={updateLeadMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                  >
                    {updateLeadMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingLead(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-6 space-y-5"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1.5">
                <h3 className="text-lg font-black text-slate-900">Delete Duplicate Lead?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to remove <strong className="text-slate-800">{deletingLead.businessName}</strong>? This lead will be soft-deleted and removed from active duplicate clusters and pipelines.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Contact:</span>
                  <span className="font-bold text-slate-800">{deletingLead.contactName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Phone:</span>
                  <span className="font-mono text-slate-800">{deletingLead.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Created By:</span>
                  <span className="text-slate-800">{deletingLead.user?.fullName || 'Unknown User'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingLead(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Keep Lead
                </button>

                <button
                  type="button"
                  onClick={handleDeleteLead}
                  disabled={deleteLeadMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  {deleteLeadMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Delete Lead</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Harvest Phone Numbers Modal */}
      <AnimatePresence>
        {isHarvestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHarvestModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
            >
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">Harvested Phone Numbers</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Deduplicated contact numbers extracted from the current active filters.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsHarvestModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-600">
                      Total Numbers Extracted: <span className="text-blue-600 font-mono font-bold text-sm">{harvestedPhoneNumbers.length}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Ready for SMS Gateways</span>
                  </div>
                  <textarea
                    readOnly
                    rows={6}
                    value={harvestedPhoneNumbers.join(', ')}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:outline-none select-all resize-none"
                    placeholder="No phone numbers available in current view"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => copyToClipboard(harvestedPhoneNumbers.join(','), 'Comma-separated phone numbers')}
                    disabled={harvestedPhoneNumbers.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Comma-Separated (CSV)
                  </button>

                  <button
                    onClick={() => copyToClipboard(harvestedPhoneNumbers.join('\n'), 'Line-by-line phone numbers')}
                    disabled={harvestedPhoneNumbers.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-2xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Line-by-Line
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
