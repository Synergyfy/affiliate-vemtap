'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';
import { 
  ShieldAlert, 
  AlertTriangle, 
  UserX, 
  Activity,
  Search,
  MoreHorizontal,
  ArrowUpRight,
  ShieldCheck,
  Eye
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import FilterBar from '@/components/admin/FilterBar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/toast';
import { useDebounce } from '@/hooks/use-debounce';

import { useFraudAlerts, useUpdateFraudStatus, useFraudStats, useFraudGuardStatus, useUpdateFraudGuardStatus } from '@/services/useFraudHooks';
import { useAdminStats } from '@/services/useAdminHooks';
import { Loader2, X } from 'lucide-react';
import { FraudAlert, FraudStatus } from '@/types/api';

export default function FraudMonitor() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [isGuardModalOpen, setIsGuardModalOpen] = useState(false);
  const [guardThreshold, setGuardThreshold] = useState<number>(75);
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  const { data: fraudResponse, isLoading: isFraudLoading, isError: isFraudError, refetch: refetchFraud } = useFraudAlerts({
    limit: 50,
    search: debouncedSearch || undefined,
    status: statusFilter === 'All' ? undefined : statusFilter as any
  });
  const { data: stats } = useAdminStats();
  const { data: realFraudStats } = useFraudStats();
  const { data: guardStatus } = useFraudGuardStatus();
  const updateGuard = useUpdateFraudGuardStatus();
  const updateStatus = useUpdateFraudStatus();

  useEffect(() => {
    if (guardStatus?.thresholdScore) {
      setGuardThreshold(guardStatus.thresholdScore);
    }
  }, [guardStatus]);

  const handleStatusChange = async (alertId: string, name: string, isResolving: boolean) => {
    try {
      const status: FraudStatus = isResolving ? 'RESOLVED' : 'CONFIRMED';
      const resolution = isResolving ? 'Marked as safe by admin' : 'Confirmed fraudulent activity';
      
      await updateStatus.mutateAsync({ 
        id: alertId,
        status,
        resolution
      });
      
      showToast(
        isResolving ? `${name}'s alert resolved.` : `${name} has been flagged for review.`, 
        isResolving ? 'success' : 'error'
      );
    } catch (error: any) {
      showToast(error.message || 'Failed to update alert status.', 'error');
    }
  };

  const handleSaveGuardThreshold = async () => {
    try {
      await updateGuard.mutateAsync({ thresholdScore: guardThreshold });
      showToast(`Global Fraud Guard sensitivity set to ${guardThreshold}%`, 'success');
      setIsGuardModalOpen(false);
    } catch (error: any) {
      showToast(error.message || 'Failed to update guard threshold', 'error');
    }
  };

  const alertsList = fraudResponse?.data || [];

  const fraudStats = [
    { label: 'High Risk Alerts', value: realFraudStats?.highRiskCount?.toString() ?? '—', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Pending Review', value: stats?.fraudAlerts?.toString() ?? '—', icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Global Guard', value: guardStatus ? `Active (${guardStatus.thresholdScore}%)` : '—', icon: ShieldCheck, color: 'text-slate-600', bg: 'bg-slate-50', onClick: () => setIsGuardModalOpen(true) },
  ];

  if (isFraudLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      </AdminLayout>
    );
  }

  if (isFraudError) {
    return <AdminLayout><div className="flex flex-col items-center justify-center h-64 gap-3"><AlertTriangle className="w-8 h-8 text-red-500" /><p className="text-sm text-slate-600">Unable to load fraud alerts.</p><button onClick={() => refetchFraud()} className="text-sm font-bold text-blue-600 hover:underline">Retry</button></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Fraud Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {fraudStats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={stat.onClick}
              className={cn(
                "bg-white p-6 rounded-3xl border border-slate-200 shadow-sm",
                stat.onClick && "cursor-pointer hover:border-slate-300 transition-all"
              )}
            >
              <div className={cn("p-3 rounded-2xl w-fit mb-4", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </motion.div>
          ))}
        </div>


        <FilterBar 
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search alerts by user or reason..."
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          filterLabel="Status"
          filterOptions={[
            { label: 'All Alerts', value: 'All' },
            { label: 'Open', value: 'OPEN' },
            { label: 'Confirmed', value: 'CONFIRMED' },
            { label: 'Resolved', value: 'RESOLVED' }
          ]}
        />

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto relative min-h-[400px]">
            {isFraudLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            )}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-600 text-sm">Affiliate</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Alert Reason</th>
                  <th className="p-4 font-bold text-slate-600 text-sm">Risk Level</th>
                  <th className="p-4 font-bold text-slate-600 text-sm hidden md:table-cell">Detected</th>
                  <th className="p-4 font-bold text-slate-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {alertsList.length > 0 ? alertsList.map((alert, idx) => (
                    <motion.tr 
                      key={alert.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="hover:bg-slate-50/50 group transition-all"
                    >
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{alert.user?.fullName || 'Unknown User'}</p>
                        <p className="text-xs text-slate-400 font-mono">{alert.user?.email || alert.userId}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={cn(
                            "w-4 h-4",
                            alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? "text-red-500" : "text-amber-500"
                          )} />
                          <div>
                            <p className="text-sm font-bold text-slate-700">{alert.type?.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-slate-500 max-w-xs truncate">{alert.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider",
                          alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? "bg-red-100 text-red-600" : 
                          alert.severity === 'MEDIUM' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                        )}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-500 hidden md:table-cell">{new Date(alert.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                          <button 
                            onClick={() => setSelectedAlert(alert)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {alert.status !== 'RESOLVED' && (
                            <>
                              <button 
                                onClick={() => handleStatusChange(alert.id, alert.user?.fullName || 'User', true)}
                                className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                                title="Resolve / Whitelist"
                              >
                                {updateStatus.isPending && updateStatus.variables?.id === alert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => handleStatusChange(alert.id, alert.user?.fullName || 'User', false)}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-all"
                                title="Confirm Fraud"
                              >
                                {updateStatus.isPending && updateStatus.variables?.id === alert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">No active fraud alerts matching search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
          </div>
        </div>
      </div>

      {/* Investigation Details Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Fraud Alert Investigation</h3>
              <button onClick={() => setSelectedAlert(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Target User:</span>
                <span className="font-bold text-slate-900">{selectedAlert.user?.fullName || selectedAlert.userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Alert Type:</span>
                <span className="font-bold text-slate-900">{selectedAlert.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Severity:</span>
                <span className="font-bold text-red-600 uppercase">{selectedAlert.severity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-slate-900">{selectedAlert.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Detected At:</span>
                <span className="font-medium text-slate-700">{new Date(selectedAlert.createdAt).toLocaleString()}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-mono whitespace-pre-wrap text-slate-700">
                {selectedAlert.description || JSON.stringify(selectedAlert, null, 2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Guard Threshold Modal */}
      {isGuardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Global Guard Sensitivity</h3>
              <button onClick={() => setIsGuardModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-slate-500">Set the threshold score for triggering automated high-risk fraud alerts (0-100).</p>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Fraud Score Threshold: {guardThreshold}%</label>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={guardThreshold}
                  onChange={(e) => setGuardThreshold(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <button
                onClick={handleSaveGuardThreshold}
                disabled={updateGuard.isPending}
                className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
              >
                {updateGuard.isPending ? 'Saving...' : 'Save Threshold'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

