'use client';

import { 
  Users, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  ArrowRight,
  Clock,
  Calendar,
  MessageSquare,
  BarChart3,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useLeadStats, useLeads } from '@/services/useLeadsHooks';
import { useOperationsStats, useTasks, useOnboarding } from '@/services/useOperationsHooks';

export default function OverviewTab() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isManager = !!user?.isManagerMode;
  
  const { data: leadStats, isLoading: isLoadingLeadStats } = useLeadStats();
  const { data: opStats, isLoading: isLoadingOpStats } = useOperationsStats();
  const { data: leadsResponse, isLoading: isLoadingLeads } = useLeads({ limit: 3 });
  const recentLeads = leadsResponse?.data || [];

  const { data: tasksData } = useTasks();
  const tasks = Array.isArray(tasksData) ? tasksData : [];
  const { data: onboardingData } = useOnboarding();
  const onboarding = Array.isArray(onboardingData) ? onboardingData : [];

  const handleAction = (action: string) => {
    showToast(`${action} action triggered`, 'info');
  };

  const pendingOnboardingCount = onboarding.filter(o => o.status !== 'COMPLETED').length;

  return (
    <div className="space-y-8">
      {isManager && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 p-6 rounded-[32px] text-white shadow-xl shadow-slate-200">
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Team Revenue</p>
            <h4 className="text-2xl font-black mb-2">₦{isLoadingOpStats ? '...' : (opStats?.teamRevenue || 0).toLocaleString()}</h4>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-400">Total Revenue Generated</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Active Onboarding</p>
            <h4 className="text-2xl font-black text-slate-900 mb-2">{isLoadingOpStats ? '...' : opStats?.activeOnboarding ?? 0}</h4>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: `${Math.min((opStats?.activeOnboarding ?? 0) * 10, 100)}%` }} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Lead Conversion</p>
            <h4 className="text-2xl font-black text-slate-900 mb-2">{isLoadingOpStats ? '...' : `${opStats?.leadConversion ?? 0}%`}</h4>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-600">Total Pipeline Yield</span>
            </div>
          </div>

        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Operations Summary */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Interested Leads</h4>
                  <p className="text-2xl font-black text-slate-900">
                    {isLoadingLeadStats ? '...' : leadStats?.interested ?? 0} Warm
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                You have {leadStats?.interested ?? 0} leads in the &quot;Interested&quot; stage. Follow up to convert them into active businesses.
              </p>
              <Button 
                onClick={() => handleAction('View Pipeline')}
                variant="outline" 
                className="w-full border-slate-200 text-xs font-bold h-10 rounded-xl"
              >
                View Pipeline
              </Button>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Potential Pipeline</h4>
                  <p className="text-2xl font-black text-slate-900">
                    {isLoadingLeadStats ? '...' : leadStats?.potential ?? 0} New
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Your initial discovery pipeline has {leadStats?.potential ?? 0} businesses. Initiate first contact to move them forward.
              </p>
              <Button 
                onClick={() => handleAction('Performance Insights')}
                variant="outline" 
                className="w-full border-slate-200 text-xs font-bold h-10 rounded-xl"
              >
                Performance Insights
              </Button>
            </div>
          </div>

          {/* Recent Activities Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-900">Recent Lead Activity</h3>
              <Button 
                onClick={() => handleAction('View All Activity')}
                variant="ghost" 
                className="text-blue-600 text-xs font-bold"
              >
                View All
              </Button>
            </div>
            <div className="space-y-3">
              {isLoadingLeads ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
                ))
              ) : recentLeads.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No recent activity</p>
                </div>
              ) : recentLeads.map((lead, idx) => (
                <div 
                  key={lead.id} 
                  onClick={() => handleAction(`View ${lead.businessName}`)}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-100 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{lead.businessName}</p>
                      <p className="text-xs text-slate-500">{lead.contactName} • {lead.industry}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </p>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all inline-block mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Critical Tasks & Reminders */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl shadow-slate-200 relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4">Immediate Actions</h4>
              <div className="space-y-4">
                {tasks.filter(t => t.status === 'PENDING').slice(0, 1).map(task => (
                  <div key={task.id} className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-relaxed">{task.title}</p>
                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                        {task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date'}
                      </span>
                    </div>
                  </div>
                ))}
                
                {onboarding.some(o => o.status === 'PENDING') && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-relaxed">{onboarding.filter(o => o.status === 'PENDING').length} Onboarding businesses are waiting for QR deployment setup.</p>
                      <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Critical Alert</span>
                    </div>
                  </div>
                )}

                {tasks.length === 0 && !onboarding.some(o => o.status === 'PENDING') && (
                  <p className="text-[10px] font-bold text-slate-500 italic">No immediate actions required.</p>
                )}
              </div>
              <Button 
                onClick={() => handleAction('Go to Tasks')}
                className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest h-12 shadow-lg shadow-blue-500/20"
              >
                Go to Tasks
              </Button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Add Lead', color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Schedule Demo', color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Log Activity', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'New Task', color: 'text-orange-600', bg: 'bg-orange-50' },
              ].map((action, idx) => (
                <button 
                  key={idx} 
                  onClick={() => handleAction(action.label)}
                  className={cn("flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-50 transition-all hover:shadow-md hover:border-slate-100 group", action.bg)}
                >
                  <span className={cn("text-[10px] font-black uppercase tracking-widest text-center", action.color)}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
