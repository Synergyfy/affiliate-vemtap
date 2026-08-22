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
  MessageSquare,
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
  Info,
  Navigation,
  Compass,
  CalendarDays,
  CheckSquare,
  Globe,
  Share2,
  MessageCircle,
  Activity,
  Flag,
  Store,
  Clock4,
  UserCheck,
  Crosshair,
  Target,
  ShieldCheck,
  Eye,
  HelpCircle,
  FileText,
  CalendarClock,
  Map,
  UserX,
  PhoneCall,
  Flame,
  Award,
  Hash
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

const DAYS_OF_WEEK = [
  { key: 'MON', label: 'Mon', full: 'Monday' },
  { key: 'TUE', label: 'Tue', full: 'Tuesday' },
  { key: 'WED', label: 'Wed', full: 'Wednesday' },
  { key: 'THU', label: 'Thu', full: 'Thursday' },
  { key: 'FRI', label: 'Fri', full: 'Friday' },
  { key: 'SAT', label: 'Sat', full: 'Saturday' },
  { key: 'SUN', label: 'Sun', full: 'Sunday' },
];

const parseOpeningDays = (days: any): string[] => {
  if (!days) return [];
  if (Array.isArray(days)) return days.map(d => String(d).toUpperCase());
  if (typeof days === 'string') {
    try {
      const parsed = JSON.parse(days);
      if (Array.isArray(parsed)) return parsed.map(d => String(d).toUpperCase());
    } catch {
      return days.split(/[,;\s]+/).map(d => d.trim().toUpperCase()).filter(Boolean);
    }
  }
  return [];
};

const getGoogleMapsUrl = (lead: Lead) => {
  if (lead.gpsLat && lead.gpsLng) {
    return `https://www.google.com/maps/search/?api=1&query=${lead.gpsLat},${lead.gpsLng}`;
  }
  const query = lead.businessAddress || lead.location || lead.gpsAddress || lead.businessName;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

const formatWhatsAppUrl = (phone?: string | null) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  const cleanPhone = digits.startsWith('0') ? '234' + digits.slice(1) : digits;
  return `https://wa.me/${cleanPhone}`;
};

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
    gpsAddress: '',
    gpsLat: '',
    gpsLng: '',
    status: 'NOT_YET',
    priority: 'MEDIUM',
    dailyCustomers: '',
    businessSize: '',
    openingHours: '',
    openingDays: [] as string[],
    horizon: 'DAY',
    nextVisitDate: '',
    nextVisitTime: '',
    decisionMakerMet: false,
    interested: '',
    demoDone: false,
    isAnchor: false,
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
      const days = parseOpeningDays(editingLead.openingDays);
      setEditFormData({
        businessName: editingLead.businessName || '',
        industry: editingLead.industry || '',
        contactName: editingLead.contactName || '',
        contactRole: editingLead.contactRole || '',
        phone: editingLead.phone || '',
        email: editingLead.email || '',
        location: editingLead.location || '',
        businessAddress: editingLead.businessAddress || '',
        gpsAddress: editingLead.gpsAddress || '',
        gpsLat: editingLead.gpsLat || '',
        gpsLng: editingLead.gpsLng || '',
        status: editingLead.status || 'NOT_YET',
        priority: editingLead.priority || 'MEDIUM',
        dailyCustomers: editingLead.dailyCustomers || '',
        businessSize: editingLead.businessSize || '',
        openingHours: editingLead.openingHours || '',
        openingDays: days,
        horizon: editingLead.horizon || 'DAY',
        nextVisitDate: editingLead.nextVisitDate || '',
        nextVisitTime: editingLead.nextVisitTime || '',
        decisionMakerMet: Boolean(editingLead.decisionMakerMet),
        interested: editingLead.interested || '',
        demoDone: Boolean(editingLead.demoDone),
        isAnchor: Boolean(editingLead.isAnchor),
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
      <div className="space-y-4 sm:space-y-8 max-w-[1600px] mx-auto">
        {/* Top Header & Harvesting Action Hub */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 bg-blue-600 text-white rounded-xl sm:rounded-2xl shadow-md shadow-blue-500/20">
                <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2 flex-wrap">
                  Business Contacts Harvest
                  <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Admin Directory
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Harvest, detect duplicate leads, and filter records captured across all affiliate tiers.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setIsHarvestModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Harvest Phone Numbers</span>
              <span className="xs:hidden">Harvest</span>
              <span className="bg-white/20 text-white text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-mono font-bold">
                {harvestedPhoneNumbers.length}
              </span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-60"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-blue-600" />
              ) : (
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
              )}
              <span className="hidden xs:inline">Export CSV</span>
              <span className="xs:hidden">Export</span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-1 gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide -mb-px">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all relative border whitespace-nowrap shrink-0",
                activeTab === 'all'
                  ? "bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/10"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">All Harvested Contacts</span>
              <span className="sm:hidden">All Contacts</span>
              <span className={cn(
                "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-mono font-bold",
                activeTab === 'all' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
              )}>
                {stats.totalHarvested.toLocaleString()}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('duplicates')}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all relative border whitespace-nowrap shrink-0",
                activeTab === 'duplicates'
                  ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              )}
            >
              <GitCompare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Duplicate Clusters & Similarity</span>
              <span className="sm:hidden">Duplicates</span>
              {duplicateStats.totalClusters > 0 && (
                <span className={cn(
                  "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-mono font-black",
                  activeTab === 'duplicates' ? "bg-white text-rose-700" : "bg-rose-100 text-rose-700"
                )}>
                  {duplicateStats.totalClusters}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'duplicates' && (
            <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-500 shrink-0">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>Fuzzy AI Similarity Engine</span>
            </div>
          )}
        </div>

        {/* TAB 1: ALL HARVESTED CONTACTS */}
        {activeTab === 'all' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Stats Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Harvested</span>
                  <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                  {stats.totalHarvested.toLocaleString()}
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-medium hidden sm:block">All business leads captured in system</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Reachable Phones</span>
                  <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-emerald-600 tracking-tight font-mono">
                  {stats.totalWithPhone.toLocaleString()}
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-medium hidden sm:block">
                  {stats.totalHarvested > 0 
                    ? `${Math.round((stats.totalWithPhone / stats.totalHarvested) * 100)}% have phone numbers ready for SMS`
                    : 'Ready for bulk SMS broadcast'}
                </p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Converted</span>
                  <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-indigo-600 tracking-tight font-mono">
                  {stats.totalConverted.toLocaleString()}
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-medium hidden sm:block">Active & paid converted subscribers</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">In-Pipeline</span>
                  <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-amber-600 tracking-tight font-mono">
                  {stats.totalPipeline.toLocaleString()}
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-medium hidden sm:block">Visited, interested, or demos scheduled</p>
              </motion.div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
              <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3 items-stretch lg:items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    placeholder="Search business, contact, phone..."
                    className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
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
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={locationTerm}
                    onChange={(e) => { setLocationTerm(e.target.value); setPage(1); }}
                    placeholder="Filter location / state..."
                    className="w-full pl-9 pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                {/* Pipeline Status Filter */}
                <div className="w-full lg:w-56">
                  <select
                    value={selectedStatus}
                    onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                    className="w-full px-3 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                  >
                    {statusFilterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {/* Phone Only Switch */}
                  <label className="flex items-center gap-2 px-3 py-2 sm:py-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer select-none hover:bg-slate-100 transition-colors shrink-0">
                    <input
                      type="checkbox"
                      checked={phoneOnly}
                      onChange={(e) => { setPhoneOnly(e.target.checked); setPage(1); }}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 sm:w-4 sm:h-4"
                    />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-700">Phone Only</span>
                  </label>

                  {/* Sort Toggle */}
                  <button
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center gap-1 px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-[10px] sm:text-xs font-bold text-slate-700 transition-all shrink-0"
                  >
                    <ArrowUpDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
                    <span className="sm:hidden">{sortOrder === 'desc' ? 'New' : 'Old'}</span>
                  </button>
                </div>
              </div>

              {/* Role Filter Pills */}
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 sm:mr-2 shrink-0">
                  Role:
                </span>
                {roleFilterOptions.map((roleOpt) => {
                  const active = selectedRole === roleOpt.value;
                  return (
                    <button
                      key={roleOpt.value}
                      onClick={() => { setSelectedRole(roleOpt.value); setPage(1); }}
                      className={cn(
                        "px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap border",
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
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative min-h-[400px]">
              {isLoadingHarvest && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-600" />
                  <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Loading harvested contacts...</p>
                </div>
              )}

              {/* Desktop table view */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200">
                      <th className="p-4 pl-6 font-bold text-slate-600 text-xs uppercase tracking-wider">Business</th>
                      <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider hidden md:table-cell">Contact Person</th>
                      <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider hidden lg:table-cell">Added By (User)</th>
                      <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                      <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider hidden md:table-cell">WhatsApp</th>
                      <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider hidden lg:table-cell">SMS</th>
                      <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider hidden xl:table-cell">Last Contact</th>
                      <th className="p-4 font-bold text-slate-600 text-xs uppercase tracking-wider hidden lg:table-cell">Date Added</th>
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
                          <td className="p-4 hidden md:table-cell">
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
                          <td className="p-4 hidden lg:table-cell">
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

                          {/* WhatsApp */}
                          <td className="p-4 hidden md:table-cell">
                            {lead.phone && formatWhatsAppUrl(lead.phone) ? (
                              <a
                                href={formatWhatsAppUrl(lead.phone)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                              >
                                <MessageSquare className="w-3 h-3" />
                                Open WA
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">—</span>
                            )}
                          </td>

                          {/* SMS */}
                          <td className="p-4 hidden lg:table-cell">
                            {lead.phone ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                <Smartphone className="w-3 h-3" />
                                {lead.phone}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-medium">—</span>
                            )}
                          </td>

                          {/* Last Contact */}
                          <td className="p-4 text-xs text-slate-500 font-medium whitespace-nowrap hidden xl:table-cell">
                            {(lead as any).lastContactedAt
                              ? new Date((lead as any).lastContactedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                              : <span className="text-slate-400 italic">Never</span>
                            }
                          </td>

                          {/* Date */}
                          <td className="p-4 text-xs text-slate-500 font-medium whitespace-nowrap hidden lg:table-cell">
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

              {/* Mobile card view */}
              <div className="sm:hidden divide-y divide-slate-100">
                {!isLoadingHarvest && leads.length === 0 && (
                  <div className="p-12 text-center">
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
                  </div>
                )}
                {leads.map((lead, idx) => {
                  const statusClass = statusBadgeColor[lead.status] || 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="p-4 space-y-3 cursor-pointer hover:bg-slate-50/80 transition-colors"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-black text-sm shrink-0 uppercase">
                            {lead.businessName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{lead.businessName}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              {lead.location || lead.businessAddress || 'Location not specified'}
                            </p>
                          </div>
                        </div>
                        <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider inline-flex items-center gap-1 shrink-0", statusClass)}>
                          {lead.status === 'CUSTOMER' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : lead.status === 'NOT_INTERESTED' ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {lead.status}
                        </span>
                      </div>

                      {lead.contactName && (
                        <p className="text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">{lead.contactName}</span>
                          {lead.contactRole && <span className="text-slate-400 ml-1">({lead.contactRole})</span>}
                        </p>
                      )}

                      {lead.phone && (
                        <div className="flex items-center gap-2 text-xs">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span className="font-mono font-medium text-slate-700">{lead.phone}</span>
                        </div>
                      )}

                      {lead.phone && formatWhatsAppUrl(lead.phone) && (
                        <a
                          href={formatWhatsAppUrl(lead.phone)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Open WA
                        </a>
                      )}

                      <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setEditingLead(lead)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 rounded-xl text-xs font-bold text-blue-600 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingLead(lead)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                          View
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Duplicate Clusters</span>
                  <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-rose-50 text-rose-600">
                    <GitCompare className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-rose-600 tracking-tight font-mono">
                  {duplicateStats.totalClusters.toLocaleString()}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium hidden sm:block">Distinct groups of overlapping leads</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Duplicated Leads</span>
                  <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-600">
                    <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-amber-600 tracking-tight font-mono">
                  {duplicateStats.totalDuplicateLeads.toLocaleString()}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium hidden sm:block">Individual lead entries across all clusters</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">High Confidence (≥90%)</span>
                  <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-red-50 text-red-600">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-red-600 tracking-tight font-mono">
                  {duplicateStats.highConfidenceClusters.toLocaleString()}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium hidden sm:block">Identical phones, emails, or exact names</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Active Sensitivity</span>
                  <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600">
                    <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                  ≥ {duplicateThreshold}%
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium hidden sm:block">Fuzzy matching similarity threshold</p>
              </motion.div>
            </div>

            {/* Duplicates Filter & Sensitivity Controls */}
            <div className="bg-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
                {/* Search in duplicates */}
                <div className="relative flex-1 min-w-0">
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
                          "px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all border",
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
                    <div className="p-3 sm:p-6 divide-y divide-slate-100 bg-slate-50/50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
                        {cluster.leads.map((item) => {
                          const role = item.user?.role || 'AFFILIATE';
                          const roleClass = roleBadgeColor[role] || 'bg-slate-100 text-slate-700 border-slate-200';
                          const statusClass = statusBadgeColor[item.status] || 'bg-slate-100 text-slate-700 border-slate-200';

                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "rounded-3xl p-3 sm:p-5 border transition-all relative flex flex-col justify-between space-y-3 sm:space-y-4",
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

      {/* Slide-over Detailed Drawer for Contact - Full Business Intelligence Inspector */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLead(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={typeof window !== 'undefined' && window.innerWidth < 640 ? { y: '100%' } : { x: '100%' }}
              animate={typeof window !== 'undefined' && window.innerWidth < 640 ? { y: 0 } : { x: 0 }}
              exit={typeof window !== 'undefined' && window.innerWidth < 640 ? { y: '100%' } : { x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-0 sm:right-0 h-[92dvh] sm:h-full w-full sm:max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto border-t sm:border-t-0 sm:border-l border-slate-200 rounded-t-[28px] sm:rounded-none pb-[env(safe-area-inset-bottom)]"
            >
              {/* Drawer Header Banner */}
              <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 p-4 sm:p-6">
                <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1.5 bg-slate-200 rounded-full" /></div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-500/20 uppercase">
                        {selectedLead.businessName.charAt(0)}
                      </div>
                      {selectedLead.isAnchor && (
                        <span 
                          className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-white rounded-full shadow-md border-2 border-white"
                          title="Anchor Account / Milestone Business"
                        >
                          <Award className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-black text-slate-900 truncate">
                          {selectedLead.businessName}
                        </h3>
                        <button
                          onClick={() => copyToClipboard(selectedLead.businessName, 'Business Name')}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                          title="Copy business name"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500">
                        {selectedLead.industry && (
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                            {selectedLead.industry}
                          </span>
                        )}
                        {selectedLead.source && (
                          <span className="font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                            Source: {selectedLead.source}
                          </span>
                        )}
                        <span className="font-mono text-slate-400 text-[11px] flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {selectedLead.id}
                          <button
                            onClick={() => copyToClipboard(selectedLead.id, 'Lead UUID')}
                            className="hover:text-slate-700 p-0.5"
                            title="Copy Lead UUID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        const target = selectedLead;
                        setSelectedLead(null);
                        setEditingLead(target);
                      }}
                      className="p-2.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all shadow-sm"
                      title="Edit Business Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedLead(null)}
                      className="p-2.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-2xl border border-slate-200 transition-colors shadow-sm"
                      title="Close Inspector"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
                {/* Status, Priority & Quick Tags */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={cn("text-xs font-black px-3.5 py-1.5 rounded-full border uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm", statusBadgeColor[selectedLead.status] || 'bg-slate-100 text-slate-700 border-slate-200')}>
                    {selectedLead.status === 'CUSTOMER' || selectedLead.status === 'CONVERTED' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : selectedLead.status === 'NOT_INTERESTED' || selectedLead.status === 'LOST' ? (
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    {selectedLead.status}
                  </span>

                  {selectedLead.priority && (
                    <span className={cn(
                      "text-xs font-bold px-3 py-1.5 rounded-xl border uppercase tracking-wider flex items-center gap-1.5",
                      selectedLead.priority === 'HIGH' ? "bg-rose-50 text-rose-700 border-rose-200" :
                      selectedLead.priority === 'LOW' ? "bg-slate-100 text-slate-600 border-slate-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      <Flag className="w-3.5 h-3.5" />
                      {selectedLead.priority} Priority
                    </span>
                  )}

                  {selectedLead.visitedAt ? (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Visited ({new Date(selectedLead.visitedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1.5">
                      <Clock4 className="w-3.5 h-3.5 text-slate-400" />
                      Not Yet Visited
                    </span>
                  )}

                  {selectedLead.isAnchor && (
                    <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      Anchor Account
                    </span>
                  )}

                  {selectedLead.horizon && (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-purple-600" />
                      {selectedLead.horizon} Plan
                    </span>
                  )}
                </div>

                {/* Quick Action Ribbon */}
                <div className="grid grid-cols-4 gap-2">
                  {selectedLead.phone ? (
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="flex items-center justify-center gap-2 p-2 sm:p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl border border-emerald-200 text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                      <PhoneCall className="w-4 h-4 text-emerald-600" />
                      <span className="hidden sm:inline">Call Direct</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex items-center justify-center gap-2 p-2 sm:p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-200 text-xs font-bold opacity-60 cursor-not-allowed"
                    >
                      <Phone className="w-4 h-4" />
                      <span className="hidden sm:inline">No Phone</span>
                    </button>
                  )}

                  {selectedLead.phone ? (
                    <a
                      href={formatWhatsAppUrl(selectedLead.phone) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 p-2 sm:p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-2xl border border-green-200 text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex items-center justify-center gap-2 p-2 sm:p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-200 text-xs font-bold opacity-60 cursor-not-allowed"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>
                  )}

                  {selectedLead.email ? (
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="flex items-center justify-center gap-2 p-2 sm:p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl border border-blue-200 text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="hidden sm:inline">Send Email</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex items-center justify-center gap-2 p-2 sm:p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-200 text-xs font-bold opacity-60 cursor-not-allowed"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="hidden sm:inline">No Email</span>
                    </button>
                  )}

                  <a
                    href={getGoogleMapsUrl(selectedLead)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-2 sm:p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl border border-indigo-200 text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <Navigation className="w-4 h-4 text-indigo-600" />
                    <span className="hidden sm:inline">View Map</span>
                  </a>
                </div>

                {/* Key Vitals Summary Cards */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="bg-slate-50 p-2.5 sm:p-3.5 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Decision Maker</span>
                    <div className="flex items-center gap-1.5">
                      {selectedLead.decisionMakerMet ? (
                        <>
                          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-xs font-black text-emerald-700">Met In Person</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-xs font-bold text-slate-600">Not Yet Reached</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 sm:p-3.5 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Demo Status</span>
                    <div className="flex items-center gap-1.5">
                      {selectedLead.demoDone ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0" />
                          <span className="text-xs font-black text-cyan-700">Demo Done</span>
                        </>
                      ) : (
                        <>
                          <Clock4 className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-xs font-bold text-slate-600">No Demo Yet</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 sm:p-3.5 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Daily Traffic</span>
                    <div className="flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-black text-slate-900 truncate">
                        {selectedLead.dailyCustomers || 'Not Specified'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 sm:p-3.5 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Business Scale</span>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-600 shrink-0" />
                      <span className="text-xs font-black text-slate-900 truncate">
                        {selectedLead.businessSize || 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1. PRIMARY CONTACT PERSON & STAKEHOLDER */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-blue-600" />
                      Contact Person & Key Stakeholder
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Rep</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Name</span>
                      <span className="text-sm font-black text-slate-900">
                        {selectedLead.contactName || 'No contact name recorded'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Designation / Role</span>
                      <span className="text-sm font-bold text-slate-800">
                        {selectedLead.contactRole || 'Not specified (e.g. Owner / Manager)'}
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Direct Phone Number</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-mono font-bold text-emerald-700">
                          {selectedLead.phone || 'No phone recorded'}
                        </span>
                        {selectedLead.phone && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => copyToClipboard(selectedLead.phone!, 'Phone')}
                              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors"
                              title="Copy Phone"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`tel:${selectedLead.phone}`}
                              className="p-1 hover:bg-emerald-100 rounded text-emerald-600 transition-colors"
                              title="Call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Email Address</span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-800 truncate" title={selectedLead.email || ''}>
                          {selectedLead.email || 'No email recorded'}
                        </span>
                        {selectedLead.email && (
                          <button
                            onClick={() => copyToClipboard(selectedLead.email!, 'Email')}
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                            title="Copy Email"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. PHYSICAL LOCATION & GEOLOCATION */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-600" />
                      Physical Location & Geolocation Verification
                    </h4>
                    <a
                      href={getGoogleMapsUrl(selectedLead)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <span>Open in Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Full Street Address</span>
                      <p className="font-bold text-slate-900 leading-relaxed">
                        {selectedLead.businessAddress || selectedLead.location || 'No physical street address recorded'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Area / City / Region</span>
                        <p className="font-bold text-slate-800">
                          {selectedLead.location || 'Not specified'}
                        </p>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">GPS Landmark / Address</span>
                        <p className="font-bold text-slate-800 truncate" title={selectedLead.gpsAddress || ''}>
                          {selectedLead.gpsAddress || 'No landmark specified'}
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                          GPS Coordinates (Lat / Lng)
                        </span>
                        <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                          {selectedLead.gpsLat && selectedLead.gpsLng ? (
                            `${selectedLead.gpsLat}, ${selectedLead.gpsLng}`
                          ) : (
                            <span className="text-slate-400 italic">Coordinates not pinned</span>
                          )}
                        </p>
                      </div>

                      {selectedLead.gpsLat && selectedLead.gpsLng && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => copyToClipboard(`${selectedLead.gpsLat}, ${selectedLead.gpsLng}`, 'Coordinates')}
                            className="px-2.5 py-1.5 bg-white text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. OPERATING SCHEDULE & BUSINESS PROFILE */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Store className="w-4 h-4 text-amber-600" />
                      Operating Profile & Working Schedule
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Field Params</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Operating Hours</span>
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        {selectedLead.openingHours || 'Not specified (e.g. 08:00 - 18:00)'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Estimated Daily Customers</span>
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        {selectedLead.dailyCustomers || 'Not specified'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Business Scale / Size</span>
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-600" />
                        {selectedLead.businessSize || 'Not specified'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Account Category</span>
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        {selectedLead.isAnchor ? (
                          <>
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-amber-700 font-black">Anchor Business Account</span>
                          </>
                        ) : (
                          <>
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Standard Lead / Prospect</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Working Days Pill Strip */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Operating Days of the Week
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {DAYS_OF_WEEK.map((day) => {
                        const openDays = parseOpeningDays(selectedLead.openingDays);
                        const isOpen = openDays.some(d => d.includes(day.key) || d.includes(day.full.toUpperCase()));
                        return (
                          <span
                            key={day.key}
                            className={cn(
                              "px-3 py-1 rounded-xl text-xs font-bold transition-all border",
                              isOpen
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm"
                                : "bg-white text-slate-400 border-slate-200 opacity-60"
                            )}
                          >
                            {day.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 4. PIPELINE SCHEDULING & FIELD PROGRESSION */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-indigo-600" />
                      Pipeline Progression & Scheduling
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Timeline</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Lead Origin / Source</span>
                      <p className="font-bold text-slate-900">{selectedLead.source || 'Market Mapping'}</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Planning Horizon</span>
                      <p className="font-bold text-slate-900">{selectedLead.horizon || 'Day'}</p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">First Visited On</span>
                      <p className="font-bold text-slate-900">
                        {selectedLead.visitedAt ? (
                          new Date(selectedLead.visitedAt).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          'Not visited yet'
                        )}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Follow-up Due Date</span>
                      <p className="font-bold text-slate-900">
                        {selectedLead.followUpDate ? (
                          new Date(selectedLead.followUpDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        ) : (
                          'No follow-up date set'
                        )}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Next Visit Schedule</span>
                      <p className="font-bold text-slate-900">
                        {selectedLead.nextVisitDate ? (
                          `${selectedLead.nextVisitDate} ${selectedLead.nextVisitTime ? `@ ${selectedLead.nextVisitTime}` : ''}`
                        ) : (
                          'No upcoming visit scheduled'
                        )}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Interest Level Assessment</span>
                      <p className="font-bold text-slate-900">{selectedLead.interested || 'Not assessed'}</p>
                    </div>
                  </div>
                </div>

                {/* 5. CAPTURED PERSONNEL & REPORTING HIERARCHY */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      Captured Personnel & Team Hierarchy
                    </span>
                    <span className={cn("text-[10px] font-extrabold px-3 py-1 rounded-full border uppercase tracking-wider shadow-sm", roleBadgeColor[selectedLead.user?.role || 'AFFILIATE'])}>
                      {formatRoleLabel(selectedLead.user?.role || 'AFFILIATE')}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xl text-white shadow-inner uppercase">
                      {selectedLead.user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white">{selectedLead.user?.fullName || 'Unknown User'}</h4>
                      <p className="text-xs text-slate-300 font-mono mt-0.5">{selectedLead.user?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">User Phone</span>
                      <span className="text-slate-100 font-mono font-bold">{selectedLead.user?.phone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Referral Code</span>
                      <span className="text-blue-300 font-mono font-bold">{selectedLead.user?.referralCode || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Status</span>
                      <span className="text-emerald-400 font-bold uppercase">{selectedLead.user?.status || 'ACTIVE'}</span>
                    </div>
                  </div>

                  {/* Supervisor / Line Manager */}
                  {(selectedLead.user?.supervisor || selectedLead.user?.manager) && (
                    <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {selectedLead.user?.supervisor && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                          <span className="text-[10px] font-bold text-purple-300 uppercase block mb-1">Line Manager / Supervisor</span>
                          <p className="font-bold text-white">{selectedLead.user.supervisor.fullName}</p>
                          <p className="text-[11px] text-slate-300 font-mono mt-0.5">{selectedLead.user.supervisor.phone || selectedLead.user.supervisor.email}</p>
                        </div>
                      )}

                      {selectedLead.user?.manager && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                          <span className="text-[10px] font-bold text-indigo-300 uppercase block mb-1">Branch / Area Manager</span>
                          <p className="font-bold text-white">{selectedLead.user.manager.fullName}</p>
                          <p className="text-[11px] text-slate-300 font-mono mt-0.5">{selectedLead.user.manager.phone || selectedLead.user.manager.email}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 6. MARKET MAPPING PLAN (IF ATTACHED) */}
                {selectedLead.plan && (
                  <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-sm space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      Associated Market Mapping Plan
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Cluster</span>
                        <span className="font-bold text-slate-800">{selectedLead.plan.locationCluster || 'N/A'}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Visits</span>
                        <span className="font-bold text-slate-800">{selectedLead.plan.targetVisits ?? 'N/A'}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Target Leads</span>
                        <span className="font-bold text-slate-800">{selectedLead.plan.targetLeads ?? 'N/A'}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Plan Status</span>
                        <span className="font-bold text-emerald-700 uppercase">{selectedLead.plan.status || 'ACTIVE'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. FIELD NOTES & COMMENTS */}
                {selectedLead.comments && (
                  <div className="p-5 bg-amber-50/60 rounded-3xl border border-amber-200/80 space-y-2">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                      <MessageSquareQuote className="w-4 h-4 text-amber-600" />
                      Field Notes & Observations
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedLead.comments}
                    </p>
                  </div>
                )}

                {/* 8. AUDIT TRAIL & SYSTEM METADATA */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    System Audit Metadata
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-medium">Record Created: </span>
                      <span className="font-bold text-slate-700">
                        {new Date(selectedLead.createdAt).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Last Modified: </span>
                      <span className="font-bold text-slate-700">
                        {new Date(selectedLead.updatedAt).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* EDIT LEAD MODAL */}
      <AnimatePresence>
        {editingLead && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
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
              className="relative w-full max-w-3xl bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 max-h-[92dvh] sm:max-h-[92vh] flex flex-col pb-[env(safe-area-inset-bottom)]"
            >
              {/* Header */}
              <div className="p-4 sm:p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1.5 bg-slate-200 rounded-full" /></div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Edit Business & Contact Details</h3>
                    <p className="text-xs text-slate-500 font-medium">Update all parameters, scheduling, and field attributes</p>
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
              <form onSubmit={handleSaveEdit} className="p-4 sm:p-8 space-y-6 overflow-y-auto">
                {/* 1. Business Identity */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Business Identity</h4>
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
                </div>

                {/* 2. Contact Person */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact Person & Direct Line</h4>
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
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contact Role / Position</label>
                      <input
                        type="text"
                        value={editFormData.contactRole}
                        onChange={(e) => setEditFormData({ ...editFormData, contactRole: e.target.value })}
                        placeholder="e.g. Owner, Store Manager, Cashier"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

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
                </div>

                {/* 3. Location & GPS */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location & Geolocation</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Business Street Address</label>
                      <input
                        type="text"
                        value={editFormData.businessAddress}
                        onChange={(e) => setEditFormData({ ...editFormData, businessAddress: e.target.value, location: editFormData.location || e.target.value })}
                        placeholder="e.g. 15 Allen Avenue, Ikeja, Lagos"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Area / City / Region</label>
                      <input
                        type="text"
                        value={editFormData.location}
                        onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                        placeholder="e.g. Ikeja, Lagos"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">GPS Landmark / Address</label>
                      <input
                        type="text"
                        value={editFormData.gpsAddress}
                        onChange={(e) => setEditFormData({ ...editFormData, gpsAddress: e.target.value })}
                        placeholder="e.g. Near Allen Junction"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">GPS Latitude</label>
                        <input
                          type="text"
                          value={editFormData.gpsLat}
                          onChange={(e) => setEditFormData({ ...editFormData, gpsLat: e.target.value })}
                          placeholder="e.g. 6.5244"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">GPS Longitude</label>
                        <input
                          type="text"
                          value={editFormData.gpsLng}
                          onChange={(e) => setEditFormData({ ...editFormData, gpsLng: e.target.value })}
                          placeholder="e.g. 3.3792"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Operations, Schedule & Scale */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operations & Scale</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Planning Horizon</label>
                      <select
                        value={editFormData.horizon}
                        onChange={(e) => setEditFormData({ ...editFormData, horizon: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                      >
                        <option value="DAY">Day</option>
                        <option value="WEEK">Week</option>
                        <option value="MONTH">Month</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Daily Customers</label>
                      <input
                        type="text"
                        value={editFormData.dailyCustomers}
                        onChange={(e) => setEditFormData({ ...editFormData, dailyCustomers: e.target.value })}
                        placeholder="e.g. 50-100/day"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Business Scale</label>
                      <input
                        type="text"
                        value={editFormData.businessSize}
                        onChange={(e) => setEditFormData({ ...editFormData, businessSize: e.target.value })}
                        placeholder="e.g. Medium, Micro"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Opening Hours</label>
                      <input
                        type="text"
                        value={editFormData.openingHours}
                        onChange={(e) => setEditFormData({ ...editFormData, openingHours: e.target.value })}
                        placeholder="e.g. 08:00 - 18:00"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Working Days Checkbox Pills */}
                  <div className="space-y-1.5 pt-2">
                    <label className="block text-xs font-bold text-slate-700">Opening Days</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = editFormData.openingDays.includes(day.key);
                        return (
                          <button
                            key={day.key}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setEditFormData({
                                  ...editFormData,
                                  openingDays: editFormData.openingDays.filter(d => d !== day.key),
                                });
                              } else {
                                setEditFormData({
                                  ...editFormData,
                                  openingDays: [...editFormData.openingDays, day.key],
                                });
                              }
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border select-none",
                              isSelected
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                            )}
                          >
                            {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Checkbox Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer select-none hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={editFormData.decisionMakerMet}
                        onChange={(e) => setEditFormData({ ...editFormData, decisionMakerMet: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Decision Maker Met</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer select-none hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={editFormData.demoDone}
                        onChange={(e) => setEditFormData({ ...editFormData, demoDone: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Demo Completed</span>
                    </label>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer select-none hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={editFormData.isAnchor}
                        onChange={(e) => setEditFormData({ ...editFormData, isAnchor: e.target.checked })}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span className="text-xs font-bold text-slate-700">Anchor Location</span>
                    </label>
                  </div>
                </div>

                {/* 5. Field Notes & Comments */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Field Notes & Observations</label>
                  <textarea
                    rows={4}
                    value={editFormData.comments}
                    onChange={(e) => setEditFormData({ ...editFormData, comments: e.target.value })}
                    placeholder="Add observations, feedback, or instructions..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all resize-none"
                  />
                </div>

                {/* Modal Footer Actions */}
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
                    <span>Save Business Details</span>
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
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
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
              className="relative w-full max-w-md bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-4 sm:p-6 space-y-5 pb-[env(safe-area-inset-bottom)]"
            >
              <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1.5 bg-slate-200 rounded-full" /></div>
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
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
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
              className="relative w-full max-w-2xl bg-white rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 pb-[env(safe-area-inset-bottom)]"
            >
              <div className="sm:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1.5 bg-slate-200 rounded-full" /></div>
              <div className="p-4 sm:p-8 space-y-6">
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
