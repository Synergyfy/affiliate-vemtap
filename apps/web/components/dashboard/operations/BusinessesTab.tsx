'use client';

import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  MoreHorizontal,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Clock,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';

import { useMyBusinesses } from '@/services/useBusinessHooks';
import { useBusinessHealth } from '@/services/useOperationsHooks';

export default function BusinessesTab() {
  const { showToast } = useToast();
  const { data: businessesResponse, isLoading } = useMyBusinesses({ limit: 50 });
  const { data: healthData } = useBusinessHealth();
  const businesses = businessesResponse?.data || [];
  const healthMap = new Map(healthData?.businesses.map(b => [b.businessId, b]) || []);

  const handleAction = (action: string) => {
    showToast(`${action} action triggered`, 'info');
  };

  const handleReviewRisks = () => {
    if (!healthData || healthData.summary.highRisk === 0) {
      showToast('No high-risk businesses found', 'info');
      return;
    }
    const names = healthData.businesses.filter(b => b.churnRisk === 'HIGH').map(b => b.businessName);
    showToast(`High-risk businesses: ${names.join(', ')}`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Filtering Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Total:</span>
            <span className="text-sm font-black text-slate-900">{businessesResponse?.meta.total || 0} Businesses</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Active:</span>
            <span className="text-sm font-black text-emerald-600">{businesses.filter(b => b.status === 'ACTIVE').length}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-grow lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter businesses..." 
              onChange={(e) => showToast(`Searching for ${e.target.value}`, 'info')}
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <Button 
            onClick={() => handleAction('Open Filters')}
            variant="outline" 
            className="p-0 w-11 h-11 border-slate-200 rounded-2xl flex items-center justify-center hover:bg-slate-50 shrink-0"
          >
            <Filter className="w-4 h-4 text-slate-600" />
          </Button>
        </div>
      </div>

      {/* Modern Table Layout */}
      <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Business Information</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Health</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Activity</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-5 h-16 bg-slate-50/50" />
                  </tr>
                ))
              ) : businesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                    No businesses found in your portfolio
                  </td>
                </tr>
              ) : businesses.map((business) => (
                <tr key={business.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {business.businessName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-none mb-1">{business.businessName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{business.ownerName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest",
                      business.status === 'ACTIVE' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      business.status === 'EXPIRED' ? "bg-red-50 text-red-600 border-red-100" :
                      "bg-orange-50 text-orange-600 border-orange-100"
                    )}>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        business.status === 'ACTIVE' ? "bg-emerald-500" :
                        business.status === 'EXPIRED' ? "bg-red-500 animate-pulse" :
                        "bg-orange-500"
                      )} />
                      {business.status}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3 max-w-[120px]">
                      <div className="flex-grow h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            (healthMap.get(business.id)?.healthScore ?? 85) >= 70 ? "bg-emerald-500" :
                            (healthMap.get(business.id)?.healthScore ?? 85) >= 40 ? "bg-orange-500" : "bg-red-500"
                          )}
                          style={{ width: `${healthMap.get(business.id)?.healthScore ?? 85}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-[10px] font-black",
                        (healthMap.get(business.id)?.healthScore ?? 85) >= 70 ? "text-emerald-600" :
                        (healthMap.get(business.id)?.healthScore ?? 85) >= 40 ? "text-orange-600" : "text-red-600"
                      )}>{healthMap.get(business.id)?.healthScore ?? 85}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">
                        {new Date(business.updatedAt).toLocaleDateString()}
                      </span>
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs font-bold text-slate-700">
                    {business.category || 'N/A'}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleAction(`Open ${business.businessName}`)}
                        className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleAction(`Options for ${business.businessName}`)}
                        className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Risk Alert Panel */}
      {healthData && healthData.summary.highRisk > 0 && (
        <div className="bg-red-50 border border-red-100 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-red-600 shadow-sm shadow-red-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-red-900 uppercase tracking-widest mb-1">Customer Churn Alert</h4>
              <p className="text-xs text-red-700 font-medium max-w-md">
                {healthData.summary.highRisk} {healthData.summary.highRisk === 1 ? 'Business has' : 'Businesses have'} low engagement scores. Immediate follow-up recommended to prevent churn.
              </p>
            </div>
          </div>
          <Button 
            onClick={handleReviewRisks}
            className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest h-11 px-8 rounded-xl shadow-lg shadow-red-200 shrink-0"
          >
            Review Risks
          </Button>
        </div>
      )}
    </div>
  );
}
