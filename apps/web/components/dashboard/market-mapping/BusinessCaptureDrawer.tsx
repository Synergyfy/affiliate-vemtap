'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, Check, Navigation, Star, ChevronDown, Search, Info, MapPin, Clock, ArrowRight
} from 'lucide-react';
import { PlannedVisit } from '@/types/affiliate-market-mapping';
import { cn } from '@/lib/utils';
import { useMarketMapping } from './MarketMappingContext';
import { useMarketMappingConfig } from '@/hooks/use-market-mapping-config';

interface BusinessCaptureDrawerProps {
  visit: PlannedVisit | null;
  onClose: () => void;
  onSave: (updatedVisit: PlannedVisit, closeDrawer?: boolean) => void;
}

type TabId = 'general' | 'profile' | 'sales';
const EMPTY_CATEGORIES: string[] = [];

const TAB_INFO: Record<TabId, { label: string; desc: string; icon: React.ReactNode }> = {
  general: { label: 'General', desc: 'Name, category, location & contact', icon: <MapPin className="w-3.5 h-3.5" /> },
  profile: { label: 'Profile', desc: 'Size, customers, hours & interest', icon: <Clock className="w-3.5 h-3.5" /> },
  sales: { label: 'Sales', desc: 'Pipeline, decision maker & next visit', icon: <Star className="w-3.5 h-3.5" /> },
};

const TOOLTIPS: Record<string, string> = {
  name: 'Official business name from signage',
  category: 'Business type from admin list',
  address: 'Area assigned during planning',
  exactAddress: 'Shop number, floor, or landmark',
  ownerName: 'Primary contact full name',
  phone: 'Active number for calls or WhatsApp',
  contactPosition: 'Role of the contact person',
  contactEmail: 'Email for follow-ups',
  businessSize: 'Staff count — Small (1–5), Medium (6–20), Large (21+)',
  dailyCustomers: 'Daily foot traffic — High/Very High = Anchor',
  interested: 'Owner\'s interest in joining VemTap',
  visitNotes: 'Key discussion points and next steps',
  openingHours: 'Daily operating hours',
  openingDays: 'Days the business is open',
  nextVisit: 'Date and time for your next visit',
  pipelineStatus: 'Current engagement stage',
  decisionMakerMet: 'Did you speak with the owner or decision maker?',
  demoDone: 'Check if you demoed the VemTap app',
  gps: 'Capture GPS at the business location',
};

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [show]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button type="button" onClick={(e) => { e.stopPropagation(); setShow(!show); }} className="text-slate-300 hover:text-slate-500">
        <Info className="w-3.5 h-3.5" />
      </button>
      {show && (
        <div className="absolute z-50 left-0 top-full mt-1.5 w-48 px-2.5 py-2 bg-slate-800 text-white text-[10px] font-medium rounded-lg shadow-lg leading-relaxed pointer-events-auto">
          {text}
          <div className="absolute -top-1 left-3 w-2 h-2 bg-slate-800 rotate-45" />
        </div>
      )}
    </div>
  );
}

function FieldLabel({ label, tooltip }: { label: string; tooltip?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-1">
      <label className="block text-[11px] font-semibold text-slate-500">{label}</label>
      {tooltip && <Tooltip text={tooltip} />}
    </div>
  );
}

/**
 * Count total fields filled vs total fields across all tabs.
 * Returns { filled, total } for fine-grained completeness.
 */
function countFilledFields(d: Partial<PlannedVisit>): { filled: number; total: number } {
  let filled = 0;
  const total = 19;

  // General (7)
  if (d.name && !d.name.startsWith('Business ')) filled++;
  if (d.category && d.category !== 'Unknown' && d.category !== '') filled++;
  if (d.exactAddress) filled++;
  if (d.ownerName) filled++;
  if (d.phone) filled++;
  if (d.contactPosition) filled++;
  if (d.contactEmail) filled++;

  // Profile (6)
  if (d.businessSize) filled++;
  if (d.dailyCustomers) filled++;
  if (d.openingHours) filled++;
  if (d.openingDays && d.openingDays.length > 0) filled++;
  if (d.interested) filled++;
  if (d.visitNotes) filled++;

  // Sales (6)
  if (d.status && d.status !== 'NOT_YET') filled++;
  if (d.decisionMakerMet !== undefined) filled++;
  if (d.demoDone) filled++;
  if (d.nextVisitDate) filled++;
  if (d.nextVisitTime) filled++;
  if (d.gpsLat && d.gpsLng) filled++;

  return { filled, total };
}

export default function BusinessCaptureDrawer({ visit, onClose, onSave }: BusinessCaptureDrawerProps) {
  const { missionPlans } = useMarketMapping();
  const { data: config } = useMarketMappingConfig();

  const categories = config?.businessCategories ?? EMPTY_CATEGORIES;
  const customerRanges = config?.customerRanges ?? [];
  const openingDays = config?.openingDays ?? [];
  const contactPositions = config?.contactPositions ?? [];
  const businessSizes = config?.businessSizes ?? [];
  const interestOptions = config?.interestOptions ?? [];
  const pipelineStatusOptions = config?.pipelineStatuses ?? [];

  const activePlan = missionPlans[missionPlans.length - 1];
  const planLocation = activePlan?.location || '';

  const [formData, setFormData] = useState<Partial<PlannedVisit>>({});
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [savedTabs, setSavedTabs] = useState<Set<TabId>>(new Set());
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDaysDropdown, setShowDaysDropdown] = useState(false);
  const [customPosition, setCustomPosition] = useState('');
  const prevVisitId = useRef<string | null>(null);
  const openTimeRef = useRef<HTMLInputElement>(null);
  const closeTimeRef = useRef<HTMLInputElement>(null);
  const visitDateRef = useRef<HTMLInputElement>(null);
  const visitTimeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visit && visit.id !== prevVisitId.current) {
      const data = { ...visit };
      if (!data.address && planLocation) data.address = planLocation;
      setFormData(data);
      setActiveTab('general');
      setSavedTabs(new Set());
      prevVisitId.current = visit.id;
    } else if (visit) {
      setFormData(visit);
    }
  }, [visit, planLocation]);

  const isAnchor = formData.dailyCustomers === 'HIGH' || formData.dailyCustomers === 'VERY_HIGH';

  const handleSave = useCallback((skipToNext = false) => {
    const newStatus = formData.status === 'NOT_YET' ? 'VISITED' : (formData.status || 'VISITED');
    const updated = { ...(formData as PlannedVisit), status: newStatus as any, isPlaceholder: false, isAnchor };
    setSavedTabs(prev => new Set(prev).add(activeTab));
    onSave(updated, !skipToNext);

    if (skipToNext) {
      const tabs: TabId[] = ['general', 'profile', 'sales'];
      const currentIdx = tabs.indexOf(activeTab);
      if (currentIdx < tabs.length - 1) {
        setTimeout(() => setActiveTab(tabs[currentIdx + 1]), 50);
      }
    }
  }, [formData, activeTab, onSave, isAnchor]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch) return categories;
    return categories.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase()));
  }, [categorySearch, categories]);

  const { filled, total } = countFilledFields(formData);
  const starScore = (filled / total) * 5;

  if (!visit) return null;

  const tabs: TabId[] = ['general', 'profile', 'sales'];
  const currentTabIndex = tabs.indexOf(activeTab);
  const isLastTab = currentTabIndex === tabs.length - 1;

  return (
    <AnimatePresence>
      {visit && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] md:hidden" onClick={onClose} />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed top-0 right-0 bottom-20 lg:bottom-0 w-full md:w-[500px] bg-slate-50 shadow-2xl z-[60] flex flex-col border-l border-slate-200">

            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-slate-900 truncate">{formData.name || 'Unnamed Business'}</h2>
                  <p className="text-xs text-slate-500">{formData.category || 'Choose Category'}{isAnchor && <span className="ml-1 text-amber-600 font-bold">· Anchor</span>}</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={cn("w-3.5 h-3.5", i <= Math.round(starScore) ? "text-amber-400 fill-amber-400" : "text-slate-200")} />
                  ))}
                </div>
                <span className="text-[10px] font-semibold text-slate-500">{filled}/{total} fields</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-slate-200 shrink-0">
              <div className="flex">
                {tabs.map(tabId => {
                  const t = TAB_INFO[tabId];
                  const isSaved = savedTabs.has(tabId);
                  return (
                    <button key={tabId} onClick={() => setActiveTab(tabId)} className={cn("flex-1 px-2 py-2.5 text-center border-b-2 transition-all", activeTab === tabId ? "text-blue-600 border-blue-600" : "text-slate-500 border-transparent hover:text-slate-700")}>
                      <span className="flex items-center justify-center gap-1 text-xs font-semibold">
                        {t.icon} {t.label}
                        {isSaved && <Check className="w-3 h-3 text-emerald-500" />}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 px-4 pb-2">{TAB_INFO[activeTab].desc}</p>
            </div>

            {/* Content */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">

              {/* GENERAL */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <FieldLabel label="Business Name" tooltip={TOOLTIPS.name} />
                    <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all" />
                  </div>
                  <div className="relative">
                    <FieldLabel label="Category" tooltip={TOOLTIPS.category} />
                    <button type="button" onClick={() => setShowCategoryDropdown(!showCategoryDropdown)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-left flex items-center justify-between focus:outline-none focus:border-blue-400 transition-all">
                      <span className={formData.category ? "text-slate-700" : "text-slate-400"}>{formData.category || 'Choose Category'}</span>
                      <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showCategoryDropdown && "rotate-180")} />
                    </button>
                    {showCategoryDropdown && (
                      <div className="absolute z-30 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-hidden">
                        <div className="p-2 border-b border-slate-100">
                          <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg">
                            <Search className="w-3.5 h-3.5 text-slate-400" />
                            <input type="text" placeholder="Search..." value={categorySearch} onChange={e => setCategorySearch(e.target.value)} className="flex-1 bg-transparent text-xs focus:outline-none" autoFocus />
                          </div>
                        </div>
                        <div className="overflow-y-auto max-h-48">
                          {filteredCategories.map(cat => (
                            <button key={cat} type="button" onClick={() => { setFormData({ ...formData, category: cat }); setShowCategoryDropdown(false); setCategorySearch(''); }} className={cn("w-full px-3 py-2 text-xs text-left hover:bg-blue-50", formData.category === cat && "bg-blue-50 text-blue-600 font-semibold")}>
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <FieldLabel label="Area / Cluster" tooltip={TOOLTIPS.address} />
                    <input type="text" value={formData.address || planLocation || ''} readOnly className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600" />
                  </div>
                  <div>
                    <FieldLabel label="Exact Address" tooltip={TOOLTIPS.exactAddress} />
                    <input type="text" placeholder="e.g. Shop B12, Ground Floor" value={formData.exactAddress || ''} onChange={e => setFormData({ ...formData, exactAddress: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <div>
                    <FieldLabel label="Contact Name" tooltip={TOOLTIPS.ownerName} />
                    <input type="text" value={formData.ownerName || ''} onChange={e => setFormData({ ...formData, ownerName: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <div>
                    <FieldLabel label="Phone Number" tooltip={TOOLTIPS.phone} />
                    <input type="tel" inputMode="numeric" pattern="[0-9]*" value={formData.phone || ''} onChange={e => { const val = e.target.value.replace(/[^0-9]/g, ''); setFormData({ ...formData, phone: val }); }} placeholder="e.g. 08012345678" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                  <div>
                    <FieldLabel label="Contact Position" tooltip={TOOLTIPS.contactPosition} />
                    <select value={formData.contactPosition || ''} onChange={e => { const val = e.target.value; setFormData({ ...formData, contactPosition: val }); if (val !== 'Custom') setCustomPosition(''); }} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all">
                      <option value="">Select...</option>
                      {contactPositions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {formData.contactPosition === 'Custom' && (
                      <input type="text" placeholder="Enter position..." value={customPosition} onChange={e => { setCustomPosition(e.target.value); setFormData({ ...formData, contactPosition: `Custom: ${e.target.value}` }); }} className="w-full mt-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all" />
                    )}
                  </div>
                  <div>
                    <FieldLabel label="Contact Email" tooltip={TOOLTIPS.contactEmail} />
                    <input type="email" value={formData.contactEmail || ''} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} placeholder="e.g. contact@business.com" className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all" />
                  </div>
                </div>
              )}

              {/* PROFILE */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div>
                    <FieldLabel label="Business Size" tooltip={TOOLTIPS.businessSize} />
                    <select value={formData.businessSize || ''} onChange={e => setFormData({ ...formData, businessSize: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all">
                      <option value="">Select size...</option>
                      {businessSizes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="Daily Customers" tooltip={TOOLTIPS.dailyCustomers} />
                    <select value={formData.dailyCustomers || ''} onChange={e => setFormData({ ...formData, dailyCustomers: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all">
                      <option value="">Select range...</option>
                      {customerRanges.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    {isAnchor && <p className="text-[10px] text-amber-600 font-semibold mt-1">Anchor business</p>}
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Opening Hours</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Open</label>
                        <div className="relative">
                          <div className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-left cursor-pointer">
                            <span className="text-slate-700">{formData.openingHours?.split('-')[0] || 'Select time'}</span>
                          </div>
                          <input ref={openTimeRef} type="time" value={formData.openingHours?.split('-')[0] || ''} onChange={e => { const close = formData.openingHours?.split('-')[1] || ''; setFormData({ ...formData, openingHours: `${e.target.value}-${close}` }); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Close</label>
                        <div className="relative">
                          <div className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-left cursor-pointer">
                            <span className="text-slate-700">{formData.openingHours?.split('-')[1] || 'Select time'}</span>
                          </div>
                          <input ref={closeTimeRef} type="time" value={formData.openingHours?.split('-')[1] || ''} onChange={e => { const open = formData.openingHours?.split('-')[0] || ''; setFormData({ ...formData, openingHours: `${open}-${e.target.value}` }); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="Opening Days" tooltip={TOOLTIPS.openingDays} />
                    <div className="relative">
                      <button type="button" onClick={() => setShowDaysDropdown(!showDaysDropdown)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-left flex items-center justify-between focus:outline-none focus:border-blue-400 transition-all">
                        <span className={formData.openingDays?.length ? "text-slate-700" : "text-slate-400"}>
                          {formData.openingDays?.length === openingDays.length ? 'All Days' : formData.openingDays?.length ? formData.openingDays.join(', ') : 'Select days...'}
                        </span>
                        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showDaysDropdown && "rotate-180")} />
                      </button>
                      {showDaysDropdown && (
                        <div className="absolute z-30 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                          <div className="p-2 border-b border-slate-100">
                            <button type="button" onClick={() => { const all = formData.openingDays?.length === openingDays.length; setFormData({ ...formData, openingDays: all ? [] : [...openingDays] }); }} className={cn("w-full px-3 py-1.5 rounded-lg text-[11px] font-semibold", formData.openingDays?.length === openingDays.length ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500")}>
                              {formData.openingDays?.length === openingDays.length ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                          <div className="p-1">
                            {openingDays.map(day => {
                              const sel = formData.openingDays?.includes(day) || false;
                              return (
                                <button key={day} type="button" onClick={() => { const cur = formData.openingDays || []; const next = sel ? cur.filter(d => d !== day) : [...cur, day]; setFormData({ ...formData, openingDays: next }); }} className={cn("w-full px-3 py-2 rounded-lg text-xs text-left flex items-center justify-between", sel ? "bg-blue-50 text-blue-600 font-semibold" : "text-slate-600 hover:bg-slate-50")}>
                                  {day} {sel && <Check className="w-3.5 h-3.5" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="Level of Interest" tooltip={TOOLTIPS.interested} />
                    <select value={formData.interested || ''} onChange={e => setFormData({ ...formData, interested: e.target.value as any })} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all">
                      <option value="">Select...</option>
                      {interestOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="Visit Notes" tooltip={TOOLTIPS.visitNotes} />
                    <textarea value={formData.visitNotes || ''} onChange={e => setFormData({ ...formData, visitNotes: e.target.value })} placeholder="What was discussed? Next steps?" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all h-20 resize-none" />
                  </div>
                </div>
              )}

              {/* SALES */}
              {activeTab === 'sales' && (
                <div className="space-y-4">
                  <div>
                    <FieldLabel label="Pipeline Status" tooltip={TOOLTIPS.pipelineStatus} />
                    <select value={formData.status || 'NOT_YET'} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all">
                      {pipelineStatusOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel label="Met decision maker?" tooltip={TOOLTIPS.decisionMakerMet} />
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setFormData({ ...formData, decisionMakerMet: true })} className={cn("py-2.5 rounded-xl text-xs font-semibold border transition-all", formData.decisionMakerMet === true ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200")}>Yes</button>
                      <button type="button" onClick={() => setFormData({ ...formData, decisionMakerMet: false })} className={cn("py-2.5 rounded-xl text-xs font-semibold border transition-all", formData.decisionMakerMet === false ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200")}>No</button>
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="Additional Notes" tooltip="Extra comments about this visit" />
                    <textarea value={formData.visitNotes || ''} onChange={e => setFormData({ ...formData, visitNotes: e.target.value })} placeholder="Additional comments..." className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all h-16 resize-none" />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={formData.demoDone || false} onChange={e => setFormData({ ...formData, demoDone: e.target.checked })} className="w-4 h-4 accent-blue-600 rounded" />
                    <span className="text-xs font-semibold text-slate-700">App Demo Performed?</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Next Visit</p>
                    <FieldLabel label="Schedule" tooltip={TOOLTIPS.nextVisit} />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Date</label>
                        <div className="relative">
                          <div className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-left cursor-pointer">
                            <span className="text-slate-700">{formData.nextVisitDate || 'Select date'}</span>
                          </div>
                          <input ref={visitDateRef} type="date" value={formData.nextVisitDate || ''} onChange={e => setFormData({ ...formData, nextVisitDate: e.target.value })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Time</label>
                        <div className="relative">
                          <div className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-left cursor-pointer">
                            <span className="text-slate-700">{formData.nextVisitTime || 'Select time'}</span>
                          </div>
                          <input ref={visitTimeRef} type="time" value={formData.nextVisitTime || ''} onChange={e => setFormData({ ...formData, nextVisitTime: e.target.value })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">GPS</p>
                    <div className="bg-white border border-slate-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-semibold text-slate-700">Location</span>
                        </div>
                        <button type="button" onClick={() => { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition(pos => { setFormData({ ...formData, gpsLat: pos.coords.latitude.toFixed(6), gpsLng: pos.coords.longitude.toFixed(6) }); }); } }} className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[11px] font-semibold rounded-lg hover:bg-blue-100">Capture</button>
                      </div>
                      {formData.gpsLat && formData.gpsLng ? <p className="text-[10px] font-mono text-slate-500">{formData.gpsLat}, {formData.gpsLng}</p> : <p className="text-[10px] text-slate-400">Not captured</p>}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom nav bar */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <div className="flex gap-2">
                {currentTabIndex > 0 && (
                  <button type="button" onClick={() => setActiveTab(tabs[currentTabIndex - 1])} className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shrink-0">
                    Previous
                  </button>
                )}
                <button type="button" onClick={() => handleSave(!isLastTab)} className={cn("flex-1 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors", isLastTab ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700")}>
                  <Save className="w-3.5 h-3.5" />
                  {isLastTab ? 'Save Business' : 'Save & Next'}
                  {!isLastTab && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
