'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useMarketMapping } from '@/components/dashboard/market-mapping/MarketMappingContext';
import { ArrowLeft, Target, CheckCircle, XCircle, MapPin, Clock, Pencil } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function TargetHistoryPage() {
  const { missionHistory, missionPlans, performance } = useMarketMapping();

  const allEntries = [
    ...missionHistory,
    ...missionPlans.map(p => ({
      ...p,
      achieved: p.horizon === 'DAY' ? performance.dailyProgress : p.horizon === 'WEEK' ? performance.weeklyProgress : performance.monthlyProgress,
      status: 'ACTIVE' as const,
      archivedAt: '',
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/market-mapping"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Target History
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {missionHistory.length} past targets · {missionPlans.length} active
            </p>
          </div>
        </div>

        {/* Active Plans — with Edit Mission */}
        {missionPlans.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Active Plans</h2>
            {missionPlans.map((plan, idx) => {
              const progress = plan.horizon === 'DAY' ? performance.dailyProgress : performance.weeklyProgress;
              const pct = plan.targetCount > 0 ? Math.min(100, Math.round((progress / plan.targetCount) * 100)) : 0;
              const achieved = pct >= 100;
              const createdDate = new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

              return (
                <div key={idx} className="bg-white border border-blue-200 ring-1 ring-blue-100 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                          plan.horizon === 'DAY' ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                        )}>
                          {plan.horizon}
                        </span>
                        <span className="text-[10px] font-black text-blue-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Active
                        </span>
                      </div>
                      <p className="text-sm font-black text-slate-900 truncate">{plan.targetCount} businesses</p>
                      <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {plan.location}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-slate-900">{progress}<span className="text-xs font-bold text-slate-400">/{plan.targetCount}</span></p>
                      <p className="text-[10px] font-medium text-slate-400">{createdDate}</p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", achieved ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${pct}%` }} />
                  </div>
                  <Link href="/dashboard/market-mapping/plan" className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 transition-colors">
                    <Pencil className="w-3 h-3" /> Edit Mission
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Past / Archived */}
        {missionHistory.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">Past Targets</h2>
            {missionHistory.map((entry, idx) => {
              const pct = entry.targetCount > 0 ? Math.min(100, Math.round((entry.achieved / entry.targetCount) * 100)) : 0;
              const achieved = pct >= 100;
              const createdDate = new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

              return (
                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                          entry.horizon === 'DAY' ? "bg-amber-50 text-amber-700" : entry.horizon === 'WEEK' ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                        )}>
                          {entry.horizon}
                        </span>
                        {achieved ? (
                          <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Achieved</span>
                        ) : (
                          <span className="text-[10px] font-black text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3" /> Incomplete</span>
                        )}
                      </div>
                      <p className="text-sm font-black text-slate-900 truncate">{entry.targetCount} businesses</p>
                      <p className="text-[10px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {entry.location}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-black text-slate-900">{entry.achieved}<span className="text-xs font-bold text-slate-400">/{entry.targetCount}</span></p>
                      <p className="text-[10px] font-medium text-slate-400">{createdDate}</p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", achieved ? "bg-emerald-500" : "bg-red-300")} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {allEntries.length === 0 && (
          <div className="text-center py-16">
            <Target className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-slate-500">No targets set yet</h3>
            <p className="text-xs text-slate-400 mt-1">Start by planning your first mission.</p>
            <Link href="/dashboard/market-mapping/plan" className="inline-block mt-4 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl">
              Plan a Mission
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
