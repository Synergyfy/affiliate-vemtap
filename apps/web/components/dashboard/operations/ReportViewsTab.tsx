'use client';

import { useState, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { mockHierarchy } from '@/lib/market-mapping-mock';
import { GeographicHierarchyNode } from '@/types/market-mapping';
import {
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  MapPin,
  Layers,
  Globe,
  Map,
  Building2,
  UserCheck,
  Network,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Filter,
} from 'lucide-react';

const BASE = {
  teams: { leads: 245, conversions: 78, earnings: 1450000, members: 12 },
  agents: { total: 48, active: 42, leads: 312, conversions: 95, earnings: 980000 },
  affiliates: { total: 36, active: 31, leads: 198, conversions: 62, earnings: 720000 },
  lineManagers: { total: 8, leads: 510, conversions: 157, earnings: 2170000 },
};

const TEAM_ROWS = [
  { name: 'Alpha Squad', leads: 82, conversions: 28, earnings: 520000 },
  { name: 'Bravo Force', leads: 67, conversions: 21, earnings: 410000 },
  { name: 'Charlie Unit', leads: 53, conversions: 16, earnings: 298000 },
  { name: 'Delta Crew', leads: 43, conversions: 13, earnings: 222000 },
];

const AGENT_ROWS = [
  { name: 'Sarah Okafor', leads: 58, conversions: 21, earnings: 245000 },
  { name: 'Amara Nwachukwu', leads: 52, conversions: 18, earnings: 215000 },
  { name: 'Emeka Obi', leads: 47, conversions: 15, earnings: 189000 },
  { name: 'Chioma Eze', leads: 44, conversions: 14, earnings: 175000 },
  { name: 'Tunde Balogun', leads: 39, conversions: 12, earnings: 156000 },
];

const AFFILIATE_ROWS = [
  { name: 'ConvertWave', leads: 54, conversions: 12, earnings: 115000 },
  { name: 'AffiLink Pro', leads: 42, conversions: 16, earnings: 195000 },
  { name: 'GrowthHive', leads: 38, conversions: 13, earnings: 158000 },
  { name: 'MarketBridge', leads: 35, conversions: 11, earnings: 134000 },
  { name: 'LeadStream', leads: 29, conversions: 10, earnings: 118000 },
];

const MANAGER_ROWS = [
  { name: 'Emmanuel Nnamdi', region: 'Lagos Metro', leads: 185, conversions: 62, earnings: 890000 },
  { name: 'Funke Adeyemi', region: 'Abuja Zone', leads: 142, conversions: 48, earnings: 672000 },
  { name: 'Chidi Okonkwo', region: 'Rivers Hub', leads: 98, conversions: 29, earnings: 398000 },
  { name: 'Halima Bello', region: 'Kano Corridor', leads: 85, conversions: 18, earnings: 210000 },
];

const hierarchyNodes: GeographicHierarchyNode[] = mockHierarchy as GeographicHierarchyNode[];

const hierarchyChildren = (parentId: string) => hierarchyNodes.filter(n => n.parentId === parentId);

const LEVEL_LABEL: Record<string, string> = {
  COUNTRY: 'Country',
  STATE: 'State',
  CITY: 'City',
  AREA: 'Area',
  CLUSTER: 'Cluster',
};

type Period = 'daily' | 'weekly' | 'monthly';
type Section = 'teams' | 'agents' | 'affiliates' | 'lineManagers' | 'locations';

const sectionReportType: Record<Section, string> = {
  teams: 'team',
  agents: 'agent',
  affiliates: 'affiliate',
  lineManagers: 'line-manager',
  locations: 'location',
};

const sectionMeta: Record<Section, { label: string; icon: any }> = {
  teams: { label: 'Team Overview', icon: Building2 },
  agents: { label: 'By Agent', icon: UserCheck },
  affiliates: { label: 'By Affiliate', icon: Network },
  lineManagers: { label: 'Line Managers', icon: Users },
  locations: { label: 'Locations', icon: MapPin },
};

const periods: Period[] = ['daily', 'weekly', 'monthly'];
const PERIOD_FACTORS: Record<Period, number> = { daily: 1 / 22, weekly: 1 / 4.33, monthly: 1 };

function scale(n: number, f: number) {
  return Math.max(0, Math.round(n * f));
}

function formatCurrency(val: number) {
  return `₦${val.toLocaleString()}`;
}

function rateOf(leads: number, conversions: number) {
  return leads > 0 ? Math.round((conversions / leads) * 100) : 0;
}

function hashNum(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 997;
  return h;
}

function locationMetrics(name: string, f: number) {
  const h = hashNum(name);
  const leads = scale(25 + (h % 90), f);
  const conversions = Math.max(0, scale(5 + (h % 35), f));
  const earnings = scale(60000 + (h % 400000), f);
  return { leads, conversions, earnings };
}

function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string; icon: any; trend?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        {trend && (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {trend}
          </span>
        )}
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function SummaryPanel({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <p className="text-xs font-black text-blue-700 uppercase tracking-widest">{title}</p>
      </div>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <p key={i} className="text-sm text-slate-700 leading-relaxed">{line}</p>
        ))}
      </div>
    </div>
  );
}

function BreakdownTable({ data, columns, renderDetail }: {
  data: any[];
  columns: { key: string; label: string; format?: (v: any) => string }[];
  renderDetail: (row: any) => React.ReactNode;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const toggle = (idx: number) => setExpanded(expanded === idx ? null : idx);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {columns.map((col) => (
                <th key={col.key} className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {col.label}
                </th>
              ))}
              <th className="px-5 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((row, idx) => (
              <Fragment key={idx}>
                <tr
                  onClick={() => toggle(idx)}
                  className={cn(
                    'cursor-pointer transition-colors',
                    expanded === idx ? 'bg-blue-50/40' : 'hover:bg-slate-50/50'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-4">
                      <span className="text-sm font-bold text-slate-900">
                        {col.format ? col.format(row[col.key]) : row[col.key]}
                      </span>
                    </td>
                  ))}
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggle(idx); }}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider transition-colors"
                    >
                      <span>{expanded === idx ? 'Close' : 'View'}</span>
                      {expanded === idx ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                  </td>
                </tr>
                {expanded === idx && (
                  <tr className="bg-blue-50/30">
                    <td colSpan={columns.length + 1} className="px-5 py-6">
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {renderDetail(row)}
                      </motion.div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReportViewsTab() {
  const { showToast } = useToast();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('monthly');
  const [activeSection, setActiveSection] = useState<Section>('teams');

  const [country, setCountry] = useState('all');
  const [state, setState] = useState('all');
  const [city, setCity] = useState('all');
  const [area, setArea] = useState('all');
  const [cluster, setCluster] = useState('all');

  const f = PERIOD_FACTORS[period];

  const data = useMemo(() => ({
    teams: { leads: scale(BASE.teams.leads, f), conversions: scale(BASE.teams.conversions, f), earnings: scale(BASE.teams.earnings, f), members: BASE.teams.members },
    agents: { total: BASE.agents.total, active: BASE.agents.active, leads: scale(BASE.agents.leads, f), conversions: scale(BASE.agents.conversions, f), earnings: scale(BASE.agents.earnings, f) },
    affiliates: { total: BASE.affiliates.total, active: BASE.affiliates.active, leads: scale(BASE.affiliates.leads, f), conversions: scale(BASE.affiliates.conversions, f), earnings: scale(BASE.affiliates.earnings, f) },
    lineManagers: { total: BASE.lineManagers.total, leads: scale(BASE.lineManagers.leads, f), conversions: scale(BASE.lineManagers.conversions, f), earnings: scale(BASE.lineManagers.earnings, f) },
    teamsRows: TEAM_ROWS.map((r) => ({ ...r, leads: scale(r.leads, f), conversions: scale(r.conversions, f), earnings: scale(r.earnings, f) })),
    agentsRows: AGENT_ROWS.map((r) => ({ ...r, leads: scale(r.leads, f), conversions: scale(r.conversions, f), earnings: scale(r.earnings, f) })),
    affiliatesRows: AFFILIATE_ROWS.map((r) => ({ ...r, leads: scale(r.leads, f), conversions: scale(r.conversions, f), earnings: scale(r.earnings, f) })),
    managersRows: MANAGER_ROWS.map((r) => ({ ...r, leads: scale(r.leads, f), conversions: scale(r.conversions, f), earnings: scale(r.earnings, f) })),
  }), [f]);

  const periodLabel = period === 'daily' ? 'this day' : period === 'weekly' ? 'this week' : 'this month';

  const countryOptions = useMemo(() => hierarchyNodes.filter(n => n.type === 'COUNTRY'), []);
  const stateOptions = useMemo(() => {
    if (country !== 'all') return hierarchyChildren(country);
    return hierarchyNodes.filter(n => n.type === 'STATE');
  }, [country]);
  const cityOptions = useMemo(() => {
    if (state !== 'all') return hierarchyChildren(state);
    if (country !== 'all') return hierarchyChildren(country).flatMap(s => hierarchyChildren(s.id));
    return hierarchyNodes.filter(n => n.type === 'CITY');
  }, [country, state]);
  const areaOptions = useMemo(() => {
    if (city !== 'all') return hierarchyChildren(city);
    if (state !== 'all') return hierarchyChildren(state).flatMap(c => hierarchyChildren(c.id));
    if (country !== 'all') return hierarchyChildren(country).flatMap(s => hierarchyChildren(s.id)).flatMap(c => hierarchyChildren(c.id));
    return hierarchyNodes.filter(n => n.type === 'AREA');
  }, [country, state, city]);
  const clusterOptions = useMemo(() => {
    if (area !== 'all') return hierarchyChildren(area);
    if (city !== 'all') return hierarchyChildren(city).flatMap(a => hierarchyChildren(a.id));
    if (state !== 'all') return hierarchyChildren(state).flatMap(c => hierarchyChildren(c.id)).flatMap(a => hierarchyChildren(a.id));
    if (country !== 'all') return hierarchyChildren(country).flatMap(s => hierarchyChildren(s.id)).flatMap(c => hierarchyChildren(c.id)).flatMap(a => hierarchyChildren(a.id));
    return hierarchyNodes.filter(n => n.type === 'CLUSTER');
  }, [country, state, city, area]);

  const handleCountryChange = (v: string) => {
    setCountry(v);
    setState('all');
    setCity('all');
    setArea('all');
    setCluster('all');
  };
  const handleStateChange = (v: string) => {
    setState(v);
    setCity('all');
    setArea('all');
    setCluster('all');
  };
  const handleCityChange = (v: string) => {
    setCity(v);
    setArea('all');
    setCluster('all');
  };
  const handleAreaChange = (v: string) => {
    setArea(v);
    setCluster('all');
  };

  const locationRows = useMemo(() => {
    const rows: { name: string; level: string; leads: number; conversions: number; earnings: number }[] = [];
    const pushNode = (n: GeographicHierarchyNode) => {
      const m = locationMetrics(n.name, f);
      rows.push({ name: n.name, level: LEVEL_LABEL[n.type] || n.type, ...m });
    };
    if (cluster !== 'all') {
      const n = hierarchyNodes.find(x => x.id === cluster);
      if (n) pushNode(n);
    } else if (area !== 'all') {
      hierarchyChildren(area).forEach(pushNode);
    } else if (city !== 'all') {
      hierarchyChildren(city).forEach(pushNode);
    } else if (state !== 'all') {
      hierarchyChildren(state).forEach(pushNode);
    } else if (country !== 'all') {
      hierarchyChildren(country).forEach(pushNode);
    } else {
      ['Countries', 'States', 'Cities', 'Areas', 'Clusters'].forEach((level) => {
        const m = locationMetrics(level, f);
        rows.push({ name: level, level: 'Level', ...m });
      });
    }
    return rows;
  }, [country, state, city, area, cluster, f]);

  const locationTotal = useMemo(() => locationRows.reduce(
    (acc, r) => ({ leads: acc.leads + r.leads, conversions: acc.conversions + r.conversions, earnings: acc.earnings + r.earnings }),
    { leads: 0, conversions: 0, earnings: 0 }
  ), [locationRows]);

  const renderDetailBlock = (row: any) => {
    const r = rateOf(row.leads, row.conversions);
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-black text-slate-900">{row.name}</h4>
            <p className="text-xs text-slate-500 font-medium">{row.region ? `${row.region} · ` : ''}{row.level || 'Team'}</p>
          </div>
          <button
            onClick={() => router.push(`/admin/operations/reports?name=${encodeURIComponent(row.name)}&type=${sectionReportType[activeSection]}&leads=${row.leads}&conversions=${row.conversions}&earnings=${row.earnings}&period=${period}`)}
            className="px-4 py-2 text-xs font-bold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 rounded-xl transition-all"
          >
            Open Full Report
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Leads</p>
            <p className="text-lg font-black text-slate-900">{row.leads.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Conversions</p>
            <p className="text-lg font-black text-emerald-600">{row.conversions.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Conversion Rate</p>
            <p className="text-lg font-black text-slate-900">{r}%</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Earnings</p>
            <p className="text-lg font-black text-blue-600">{formatCurrency(row.earnings)}</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          {row.name} generated <b>{row.leads.toLocaleString()}</b> leads and converted <b>{row.conversions.toLocaleString()}</b> of them,
          achieving a <b>{r}%</b> conversion rate and contributing <b>{formatCurrency(row.earnings)}</b> in earnings {periodLabel}.
        </p>
      </div>
    );
  };

  const renderTeamContent = () => {
    const d = data.teams;
    const rows = data.teamsRows;
    const top = [...rows].sort((a, b) => b.conversions - a.conversions)[0];
    return (
      <div className="space-y-6">
        <SummaryPanel
          title="English Summary"
          lines={[
            `In ${periodLabel}, your sales team brought in ${d.leads.toLocaleString()} leads and converted ${d.conversions.toLocaleString()} of them, hitting a ${rateOf(d.leads, d.conversions)}% conversion rate and earning ${formatCurrency(d.earnings)} across ${d.members} active members.`,
            `${top.name} was the strongest performer, closing ${top.conversions.toLocaleString()} conversions on ${top.leads.toLocaleString()} leads for ${formatCurrency(top.earnings)}.`,
            `Overall conversion is ${rateOf(d.leads, d.conversions) >= 35 ? 'healthy and on track' : 'below the 35% target — focus on the teams with the lowest rates below'}.`,
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Leads" value={d.leads.toString()} icon={BarChart3} trend="+12%" />
          <StatCard label="Conversions" value={d.conversions.toString()} icon={TrendingUp} trend="+8%" />
          <StatCard label="Conversion Rate" value={`${rateOf(d.leads, d.conversions)}%`} icon={Users} />
          <StatCard label="Total Earnings" value={formatCurrency(d.earnings)} icon={DollarSign} trend="+15%" />
        </div>
        <BreakdownTable
          data={rows.map((r) => ({ ...r, rate: `${rateOf(r.leads, r.conversions)}%` }))}
          columns={[
            { key: 'name', label: 'Team' },
            { key: 'leads', label: 'Leads' },
            { key: 'conversions', label: 'Conv.' },
            { key: 'rate', label: 'Rate' },
            { key: 'earnings', label: 'Earnings', format: (v: number) => formatCurrency(v) },
          ]}
          renderDetail={renderDetailBlock}
        />
      </div>
    );
  };

  const renderAgentContent = () => {
    const d = data.agents;
    const rows = data.agentsRows;
    const top = [...rows].sort((a, b) => b.conversions - a.conversions)[0];
    return (
      <div className="space-y-6">
        <SummaryPanel
          title="English Summary"
          lines={[
            `You have ${d.active} active agents out of ${d.total} total ${periodLabel}. They generated ${d.leads.toLocaleString()} leads, converted ${d.conversions.toLocaleString()}, and earned ${formatCurrency(d.earnings)}.`,
            `${top.name} led the field with ${top.conversions.toLocaleString()} conversions at a ${rateOf(top.leads, top.conversions)}% rate, earning ${formatCurrency(top.earnings)}.`,
            `${d.active} of ${d.total} agents (${Math.round((d.active / d.total) * 100)}%) are actively producing — review the full breakdown below to spot underperformers.`,
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Agents" value={d.total.toString()} icon={Users} />
          <StatCard label="Active Agents" value={d.active.toString()} icon={UserCheck} trend={`${Math.round((d.active / d.total) * 100)}% active`} />
          <StatCard label="Total Leads" value={d.leads.toString()} icon={BarChart3} trend="+5%" />
          <StatCard label="Total Earnings" value={formatCurrency(d.earnings)} icon={DollarSign} trend="+11%" />
        </div>
        <BreakdownTable
          data={rows.map((r) => ({ ...r, rate: `${rateOf(r.leads, r.conversions)}%` }))}
          columns={[
            { key: 'name', label: 'Agent' },
            { key: 'leads', label: 'Leads' },
            { key: 'conversions', label: 'Conv.' },
            { key: 'rate', label: 'Rate' },
            { key: 'earnings', label: 'Earnings', format: (v: number) => formatCurrency(v) },
          ]}
          renderDetail={renderDetailBlock}
        />
      </div>
    );
  };

  const renderAffiliateContent = () => {
    const d = data.affiliates;
    const rows = data.affiliatesRows;
    const top = [...rows].sort((a, b) => b.conversions - a.conversions)[0];
    return (
      <div className="space-y-6">
        <SummaryPanel
          title="English Summary"
          lines={[
            `${d.active} of your ${d.total} affiliates were active ${periodLabel}, bringing in ${d.leads.toLocaleString()} leads and ${d.conversions.toLocaleString()} conversions worth ${formatCurrency(d.earnings)}.`,
            `${top.name} was the top affiliate with ${top.conversions.toLocaleString()} conversions and ${formatCurrency(top.earnings)} in earnings.`,
            `Affiliate conversion averaged ${rateOf(d.leads, d.conversions)}% — expand any row below to see the individual performance story.`,
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Affiliates" value={d.total.toString()} icon={Network} />
          <StatCard label="Active Affiliates" value={d.active.toString()} icon={Users} trend={`${Math.round((d.active / d.total) * 100)}% active`} />
          <StatCard label="Total Leads" value={d.leads.toString()} icon={BarChart3} trend="+7%" />
          <StatCard label="Total Earnings" value={formatCurrency(d.earnings)} icon={DollarSign} trend="+9%" />
        </div>
        <BreakdownTable
          data={rows.map((r) => ({ ...r, rate: `${rateOf(r.leads, r.conversions)}%` }))}
          columns={[
            { key: 'name', label: 'Affiliate' },
            { key: 'leads', label: 'Leads' },
            { key: 'conversions', label: 'Conv.' },
            { key: 'rate', label: 'Rate' },
            { key: 'earnings', label: 'Earnings', format: (v: number) => formatCurrency(v) },
          ]}
          renderDetail={renderDetailBlock}
        />
      </div>
    );
  };

  const renderLineManagerContent = () => {
    const d = data.lineManagers;
    const rows = data.managersRows;
    const top = [...rows].sort((a, b) => b.conversions - a.conversions)[0];
    return (
      <div className="space-y-6">
        <SummaryPanel
          title="English Summary"
          lines={[
            `${d.total} line managers supervised operations ${periodLabel}, producing ${d.leads.toLocaleString()} leads and ${d.conversions.toLocaleString()} conversions, earning ${formatCurrency(d.earnings)} in total.`,
            `${top.name} (${top.region}) was the standout, converting ${top.conversions.toLocaleString()} on ${top.leads.toLocaleString()} leads for ${formatCurrency(top.earnings)}.`,
            `The overall management conversion rate is ${rateOf(d.leads, d.conversions)}% — well aligned with the company target.`,
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Managers" value={d.total.toString()} icon={Users} />
          <StatCard label="Total Leads" value={d.leads.toString()} icon={BarChart3} trend="+18%" />
          <StatCard label="Conversion Rate" value={`${rateOf(d.leads, d.conversions)}%`} icon={TrendingUp} />
          <StatCard label="Total Earnings" value={formatCurrency(d.earnings)} icon={DollarSign} trend="+22%" />
        </div>
        <BreakdownTable
          data={rows.map((r) => ({ ...r, rate: `${rateOf(r.leads, r.conversions)}%` }))}
          columns={[
            { key: 'name', label: 'Manager' },
            { key: 'region', label: 'Region' },
            { key: 'leads', label: 'Leads' },
            { key: 'conversions', label: 'Conv.' },
            { key: 'rate', label: 'Rate' },
            { key: 'earnings', label: 'Earnings', format: (v: number) => formatCurrency(v) },
          ]}
          renderDetail={renderDetailBlock}
        />
      </div>
    );
  };

  const renderLocationContent = () => {
    const hasFilter = country !== 'all' || state !== 'all' || city !== 'all' || area !== 'all' || cluster !== 'all';
    const filterNames = [country, state, city, area, cluster]
      .map((id) => hierarchyNodes.find((n) => n.id === id)?.name)
      .filter(Boolean)
      .join(' → ');
    return (
      <div className="space-y-6">
        <SummaryPanel
          title="English Summary"
          lines={[
            hasFilter
              ? `Showing location performance for ${filterNames} ${periodLabel}. The selected locations produced ${locationTotal.leads.toLocaleString()} leads and ${locationTotal.conversions.toLocaleString()} conversions, earning ${formatCurrency(locationTotal.earnings)}.`
              : `Across all locations ${periodLabel}, your hierarchy generated ${locationTotal.leads.toLocaleString()} leads and ${locationTotal.conversions.toLocaleString()} conversions, earning ${formatCurrency(locationTotal.earnings)} at a ${rateOf(locationTotal.leads, locationTotal.conversions)}% conversion rate.`,
            `Use the cascade below (Country → State → City → Area → Cluster) to drill down — each selection unlocks the next list. Click any row to open its detail.`,
            `${locationRows.length} location record${locationRows.length === 1 ? '' : 's'} match${locationRows.length === 1 ? 'es' : ''} the current selection.`,
          ]}
        />

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Filter className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-black text-slate-900">Cascading Location Filter</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Globe className="w-3 h-3" /> Country</label>
              <select value={country} onChange={(e) => handleCountryChange(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="all">All Countries</option>
                {countryOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Map className="w-3 h-3" /> State</label>
              <select value={state} onChange={(e) => handleStateChange(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="all">All States</option>
                {stateOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Building2 className="w-3 h-3" /> City</label>
              <select value={city} onChange={(e) => handleCityChange(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="all">All Cities</option>
                {cityOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Layers className="w-3 h-3" /> Area</label>
              <select value={area} onChange={(e) => handleAreaChange(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="all">All Areas</option>
                {areaOptions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><MapPin className="w-3 h-3" /> Cluster</label>
              <select value={cluster} onChange={(e) => setCluster(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="all">All Clusters</option>
                {clusterOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Matched Leads" value={locationTotal.leads.toString()} icon={BarChart3} trend="+14%" />
          <StatCard label="Matched Conversions" value={locationTotal.conversions.toString()} icon={TrendingUp} trend="+10%" />
          <StatCard label="Overall Rate" value={`${rateOf(locationTotal.leads, locationTotal.conversions)}%`} icon={Globe} />
          <StatCard label="Matched Earnings" value={formatCurrency(locationTotal.earnings)} icon={DollarSign} trend="+16%" />
        </div>

        <BreakdownTable
          data={locationRows.map((r) => ({ ...r, rate: `${rateOf(r.leads, r.conversions)}%` }))}
          columns={[
            { key: 'name', label: 'Location' },
            { key: 'level', label: 'Level' },
            { key: 'leads', label: 'Leads' },
            { key: 'conversions', label: 'Conv.' },
            { key: 'rate', label: 'Rate' },
            { key: 'earnings', label: 'Earnings', format: (v: number) => formatCurrency(v) },
          ]}
          renderDetail={renderDetailBlock}
        />
      </div>
    );
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'teams': return renderTeamContent();
      case 'agents': return renderAgentContent();
      case 'affiliates': return renderAffiliateContent();
      case 'lineManagers': return renderLineManagerContent();
      case 'locations': return renderLocationContent();
      default: return renderTeamContent();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 pb-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Admin Reports Overview</h2>
              <p className="text-sm text-slate-500 mt-1">Comprehensive performance reports across all operational units</p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all',
                    period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex overflow-x-auto scrollbar-hide -mb-px gap-1">
            {(Object.entries(sectionMeta) as [Section, { label: string; icon: any }][]).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2',
                  activeSection === key
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                )}
              >
                <meta.icon className={cn('w-4 h-4', activeSection === key ? 'text-blue-600' : 'text-slate-400')} />
                {meta.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderSectionContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
