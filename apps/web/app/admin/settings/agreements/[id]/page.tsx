'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FileText, 
  ChevronLeft, 
  Loader2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  Users,
  Percent,
  Check,
  Clock
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAgreementStats } from '@/services/useAgreementHooks';
import { useToast } from '@/hooks/use-toast';

export default function AgreementSignatureAudit() {
  const { id } = useParams() as { id: string };
  const { showToast } = useToast();
  const { data: auditData, isLoading, isError } = useAgreementStats(id);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SIGNED' | 'PENDING'>('ALL');

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-[32px] shadow-sm max-w-4xl mx-auto mt-8">
          <Loader2 className="w-8 h-8 animate-spin text-slate-350 mb-3" />
          <p className="text-slate-500 font-bold text-sm">Loading agreement signature statistics...</p>
        </div>
      </AdminLayout>
    );
  }

  if (isError || !auditData) {
    return (
      <AdminLayout>
        <div className="text-center py-16 bg-white border border-slate-200 rounded-[32px] shadow-sm max-w-4xl mx-auto mt-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="font-bold text-lg text-slate-800">Failed to load audit data</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            The agreement ID might be invalid or there was an error communicating with the server.
          </p>
          <Link href="/admin/settings/agreements" className="text-sm font-bold text-blue-600 hover:underline mt-4 inline-block">
            Back to Agreements
          </Link>
        </div>
      </AdminLayout>
    );
  }

  // Filter signatures list
  const filteredSignatures = auditData.signatures.filter((user: any) => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'SIGNED') {
      return matchesSearch && user.isUpToDate;
    }
    if (statusFilter === 'PENDING') {
      return matchesSearch && !user.isUpToDate;
    }
    return matchesSearch;
  });

  // Export CSV Helper
  const handleExportCSV = () => {
    try {
      const header = ['Full Name', 'Email', 'Role', 'Status', 'Signed Version', 'Signed Date'];
      const rows = auditData.signatures.map((user: any) => [
        `"${user.fullName}"`,
        `"${user.email}"`,
        `"${user.role}"`,
        `"${user.isUpToDate ? 'SIGNED' : 'PENDING'}"`,
        `"${user.signedVersion ?? 'N/A'}"`,
        `"${user.signedAt ? new Date(user.signedAt).toISOString() : 'N/A'}"`
      ].join(','));

      const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Agreement_Audit_${auditData.title.replace(/[^a-z0-9]/gi, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Audit log exported successfully', 'success');
    } catch {
      showToast('Failed to export CSV', 'error');
    }
  };

  const stats = auditData.stats;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Back Link & Header */}
        <div className="space-y-4">
          <Link 
            href="/admin/settings/agreements" 
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-wider"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Agreements
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{auditData.title}</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Deployed Version {auditData.version} • Created on {new Date(auditData.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Button
              onClick={handleExportCSV}
              className="bg-white border border-slate-200 text-slate-700 font-bold h-12 rounded-xl flex items-center gap-2 hover:bg-slate-50 shrink-0"
            >
              <Download className="w-4.5 h-4.5" /> Export Audit Log (CSV)
            </Button>
          </div>
        </div>

        {/* Visual Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Targeted</p>
              <h4 className="text-2xl font-black text-slate-900 mt-0.5">{stats.totalTargeted}</h4>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Signed</p>
              <h4 className="text-2xl font-black text-slate-900 mt-0.5">{stats.totalSigned}</h4>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Pending</p>
              <h4 className="text-2xl font-black text-slate-900 mt-0.5">{stats.totalPending}</h4>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-6 h-6" />
            </div>
            <div className="flex-grow">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Signed Percentage</p>
              <h4 className="text-2xl font-black text-slate-900 mt-0.5">{stats.signedPercentage}%</h4>
            </div>
          </div>
        </div>

        {/* Audit Search, Filter, and Table Panel */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-[32px] p-6 sm:p-8 space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            {/* Status tabs */}
            <div className="flex gap-1.5 p-1 bg-slate-50 border border-slate-100 rounded-2xl w-fit">
              {(['ALL', 'SIGNED', 'PENDING'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === filter
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {filter === 'ALL' ? 'All Users' : filter === 'SIGNED' ? 'Signed' : 'Pending'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Search user name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-blue-100"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            </div>
          </div>

          {/* Audit List Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="py-4 px-6">User Full Name</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Target Role</th>
                  <th className="py-4 px-6">Signature Status</th>
                  <th className="py-4 px-6">Signed Version</th>
                  <th className="py-4 px-6">Signed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredSignatures.length > 0 ? (
                  filteredSignatures.map((user: any) => (
                    <tr key={user.userId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">{user.fullName}</td>
                      <td className="py-4 px-6 text-slate-500">{user.email}</td>
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {user.isUpToDate ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100/50 text-[10px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Signed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100/50 text-[10px]">
                            <Clock className="w-3.5 h-3.5" /> Pending Signature
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {user.signedVersion ? `v${user.signedVersion}` : '—'}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {user.signedAt ? new Date(user.signedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }) : '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 font-bold">
                      No matching targeted users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
