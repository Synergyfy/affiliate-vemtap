'use client';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useMarketMapping } from '@/components/dashboard/market-mapping/MarketMappingContext';
import AIRecommendations from '@/components/dashboard/market-mapping/AIRecommendations';
import ClusterMaturityBars from '@/components/dashboard/market-mapping/ClusterMaturityBars';
import MarketCompletionSummary from '@/components/dashboard/market-mapping/MarketCompletionSummary';
import MissionControl from '@/components/dashboard/market-mapping/MissionControl';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function InsightsPage() {
  const router = useRouter();
  const { stats, maturity, recommendations } = useMarketMapping();

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
              <Sparkles className="w-5 h-5 text-purple-600" />
              Market Insights
            </h1>
            <p className="text-xs text-slate-500 font-medium">{stats.clusterName} · AI recommendations and cluster maturity</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
          <p className="text-xs font-bold text-purple-800 leading-relaxed">
            <strong>Strategic overview.</strong> Use these insights to prioritise your next visits. 
            Focus on high-star opportunities first, and track how close the cluster is to full market domination.
          </p>
        </div>

        {/* AI Recommendations */}
        <AIRecommendations recommendations={recommendations} />

        {/* Cluster Progress Bars */}
        <ClusterMaturityBars maturity={maturity} clusterName={stats.clusterName} />

        {/* Market Completion Goal */}
        <MarketCompletionSummary stats={stats} />

        {/* Mission Control Summary */}
        <MissionControl stats={stats} />

      </div>
    </DashboardLayout>
  );
}
