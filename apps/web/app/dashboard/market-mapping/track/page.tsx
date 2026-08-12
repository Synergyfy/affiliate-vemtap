'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useMarketMapping } from '@/components/dashboard/market-mapping/MarketMappingContext';
import DailyMissionTracker from '@/components/dashboard/market-mapping/DailyMissionTracker';
import PerformanceMetrics from '@/components/dashboard/market-mapping/PerformanceMetrics';
import NotesWidget from '@/components/dashboard/market-mapping/NotesWidget';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TrackPage() {
  const router = useRouter();
  const { stats, performance, notes } = useMarketMapping();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/dashboard/market-mapping');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back Navigation */}
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={handleBack} 
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Track Performance
            </h1>
            <p className="text-xs text-slate-500 font-medium">{stats.clusterName} · Your daily progress and targets</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-indigo-800 leading-relaxed">
            <strong>Stay on target.</strong> This page shows your daily mission progress, personal performance stats, 
            and outstanding follow-ups. Complete all boxes to hit your daily goal.
          </p>
        </div>

        {/* Daily Mission Progress */}
        <DailyMissionTracker stats={stats} performance={performance} />

        {/* Performance Snapshot */}
        <PerformanceMetrics performance={performance} />

        {/* Notes & Follow-ups */}
        <NotesWidget notes={notes} />

      </div>
    </DashboardLayout>
  );
}
