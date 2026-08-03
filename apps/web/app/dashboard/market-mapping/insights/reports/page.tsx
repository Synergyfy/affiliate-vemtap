'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileText, Share2, TrendingUp } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ReportComments from '@/components/dashboard/ReportComments';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useMarketMappingReports, downloadMarketMappingReport, type MarketMappingReport } from '@/services/useMarketMappingHooks';
import { buildReportText, downloadReportAsPdf, shareReport, type ReportExportData } from '@/lib/report-export';

type Period = 'daily' | 'weekly' | 'monthly';

const periods: Period[] = ['daily', 'weekly', 'monthly'];

function reportData(period: Period, report: MarketMappingReport, author: string, role: string): ReportExportData {
  return {
    reportTitle: `${period[0].toUpperCase()}${period.slice(1)} Market Mapping Report`,
    author,
    role,
    dateLabel: new Date().toLocaleDateString(),
    summaryCards: [
      { label: 'Leads', value: String(report.summary.totalLeads) },
      { label: 'Visits', value: String(report.summary.totalVisits) },
      { label: 'Conversions', value: String(report.summary.totalConversions) },
      { label: 'Earnings', value: `₦${report.summary.totalEarnings.toLocaleString()}` },
    ],
    summary: `${report.summary.totalVisits} visits produced ${report.summary.totalLeads} leads and ${report.summary.totalConversions} conversions.`,
    sections: [{ title: 'Captured Visits', lines: report.visits.map((visit) => `${visit.businessName} - ${visit.status}${visit.notes ? `: ${visit.notes}` : ''}`) }],
    businesses: report.visits.map((visit) => ({ name: visit.businessName, type: visit.category, status: visit.status, notes: visit.notes || '', rating: visit.status === 'CUSTOMER' ? 5 : 3 })),
    notes: report.notes.map((note) => ({ author, role, text: note.content, date: note.createdAt })),
    comments: [],
  };
}

export default function MyReportsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [openPeriod, setOpenPeriod] = useState<Period>('daily');
  const reports = {
    daily: useMarketMappingReports('daily'),
    weekly: useMarketMappingReports('weekly'),
    monthly: useMarketMappingReports('monthly'),
  };
  const getReport = (period: Period) => reports[period].data;
  const role = user?.role || 'AGENT';
  const author = user?.fullName || 'Agent';

  const share = async (period: Period) => {
    const report = getReport(period);
    if (!report) return;
    const data = reportData(period, report, author, role);
    try { await shareReport(data); showToast('Report shared', 'success'); }
    catch { await navigator.clipboard.writeText(buildReportText(data)); showToast('Report copied to clipboard', 'success'); }
  };

  const downloadPdf = (period: Period) => {
    const report = getReport(period);
    if (!report) return;
    showToast(downloadReportAsPdf(reportData(period, report, author, role)) ? 'Opening PDF preview' : 'Could not open PDF preview', 'success');
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <header className="flex items-center gap-3">
          <Link href="/dashboard/market-mapping/insights" className="p-2 rounded-xl bg-slate-100 text-slate-600"><ArrowLeft className="w-5 h-5" /></Link>
          <div><h1 className="text-xl font-black text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" />Performance Reports</h1><p className="text-xs text-slate-500">{author} · API-backed market-mapping activity</p></div>
        </header>
        {periods.map((period) => {
          const query = reports[period];
          const report = query.data;
          const summary = report?.summary;
          const isOpen = openPeriod === period;
          return <section key={period} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <button onClick={() => setOpenPeriod(isOpen ? period : period)} className="w-full p-5 flex items-center justify-between text-left">
              <span className="font-bold text-slate-900 capitalize flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-600" />{period} report</span>
              <span className="text-xs text-slate-500">{summary ? `${summary.totalVisits} visits` : query.isLoading ? 'Loading...' : 'No data'}</span>
            </button>
            {isOpen && <div className="p-5 pt-0 border-t border-slate-100 space-y-4">
              {query.isError && <p className="text-sm text-red-600">Unable to load this report.</p>}
              {report && <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                  {Object.entries({ Leads: summary?.totalLeads, Visits: summary?.totalVisits, Conversions: summary?.totalConversions, Earnings: `₦${summary?.totalEarnings.toLocaleString()}` }).map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3 text-center"><p className="text-lg font-black text-slate-900">{value}</p><p className="text-[10px] font-bold uppercase text-slate-500">{label}</p></div>)}
                </div>
                <div className="space-y-2">{report.visits.length ? report.visits.map((visit) => <div key={visit.id} className="rounded-xl bg-slate-50 p-3"><p className="text-sm font-bold text-slate-900">{visit.businessName}</p><p className="text-xs text-slate-500">{visit.category} · {visit.status} · {new Date(visit.date).toLocaleDateString()}</p>{visit.notes && <p className="text-xs text-slate-600 mt-1">{visit.notes}</p>}</div>) : <p className="text-sm text-slate-500">No visits recorded for this period.</p>}</div>
                <div className="flex gap-2 justify-end"><button onClick={() => share(period)} className="px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold"><Share2 className="w-3 h-3 inline mr-1" />Share</button><button onClick={() => downloadPdf(period)} className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold"><Download className="w-3 h-3 inline mr-1" />PDF</button><button onClick={() => downloadMarketMappingReport(period)} className="px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"><FileText className="w-3 h-3 inline mr-1" />CSV</button></div>
                <ReportComments reportKey={`insights:${period}`} currentUser={user ? { name: author, role } : null} />
              </>}
            </div>}
          </section>;
        })}
      </div>
    </DashboardLayout>
  );
}
