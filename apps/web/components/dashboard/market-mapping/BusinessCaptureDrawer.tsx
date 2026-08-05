'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Save, Check, Navigation, Star, ChevronDown, Search, Info, MapPin, Clock, Calendar, ArrowRight, Sun, Moon, Sparkles
} from 'lucide-react';
import { PlannedVisit, BUSINESS_CATEGORIES, DAILY_CUSTOMER_RANGES, OPENING_DAYS } from '@/types/affiliate-market-mapping';
import { cn } from '@/lib/utils';
import { useMarketMapping } from './MarketMappingContext';
import { useMarketMappingConfig } from '@/hooks/use-market-mapping-config';

interface BusinessCaptureDrawerProps {
  visit: PlannedVisit | null;
  onClose: () => void;
  onSave: (updatedVisit: PlannedVisit, closeDrawer?: boolean) => void;
}

type TabId = 'general' | 'profile' | 'sales';

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

const DEFAULT_CONTACT_POSITIONS = ['Owner', 'Manager', 'HR Manager', 'Sales Manager', 'Custom'];
const DEFAULT_BUSINESS_SIZES = [
  { value: 'SMALL', label: 'Small (1-5 staff)' },
  { value: 'MEDIUM', label: 'Medium (6-20 staff)' },
  { value: 'LARGE', label: 'Large (21+ staff)' },
];
const DEFAULT_PIPELINE_STATUSES = [
  { id: 'NOT_YET', name: 'Not yet' },
  { id: 'VISITED', name: 'Visited' },
  { id: 'CONTACTED', name: 'Contacted' },
  { id: 'INTERESTED', name: 'Interested' },
  { id: 'NOT_INTERESTED', name: 'Not Interested' },
  { id: 'CUSTOMER', name: 'Customer' },
];
const DEFAULT_INTEREST_OPTIONS = [
  { value: 'YES', label: 'Interested' },
  { value: 'NO', label: 'Not Interested' },
  { value: 'MAYBE', label: 'Maybe / Not decided' },
];

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

  const categories = config?.businessCategories && config.businessCategories.length > 0
    ? config.businessCategories
    : BUSINESS_CATEGORIES;

  const customerRanges = config?.customerRanges && config.customerRanges.length > 0
    ? config.customerRanges
    : DAILY_CUSTOMER_RANGES;

  const openingDays = config?.openingDays && config.openingDays.length > 0
    ? config.openingDays
    : OPENING_DAYS;

  const contactPositions = config?.contactPositions && config.contactPositions.length > 0
    ? config.contactPositions
    : DEFAULT_CONTACT_POSITIONS;

  const businessSizes = config?.businessSizes && config.businessSizes.length > 0
    ? config.businessSizes
    : DEFAULT_BUSINESS_SIZES;

  const interestOptions = config?.interestOptions && config.interestOptions.length > 0
    ? config.interestOptions
    : DEFAULT_INTEREST_OPTIONS;

  const pipelineStatusOptions = config?.pipelineStatuses && config.pipelineStatuses.length > 0
    ? config.pipelineStatuses
    : DEFAULT_PIPELINE_STATUSES;

  const activePlan = missionPlans[missionPlans.length - 1];
  const planLocation = activePlan?.location || '';

  const [formData, setFormData] = useState<Partial<PlannedVisit>>({});
  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [savedTabs, setSavedTabs] = useState<Set<TabId>>(new Set());
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDaysDropdown, setShowDaysDropdown] = useState(false);
  const [customPositionText, setCustomPositionText] = useState('');
  
  const prevVisitId = useRef<string | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const daysDropdownRef = useRef<HTMLDivElement>(null);
  const openTimeRef = useRef<HTMLInputElement>(null);
  const closeTimeRef = useRef<HTMLInputElement>(null);
  const visitDateRef = useRef<HTMLInputElement>(null);
  const visitTimeRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (daysDropdownRef.current && !daysDropdownRef.current.contains(event.target as Node)) {
        setShowDaysDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update formData ONLY when switching to a different visit
  useEffect(() => {
    if (visit && visit.id !== prevVisitId.current) {
      const data = { ...visit };
      if (!data.address && planLocation) data.address = planLocation;
      setFormData(data);
      setActiveTab('general');
      setSavedTabs(new Set());
      if (data.contactPosition && data.contactPosition.startsWith('Custom: ')) {
        setCustomPositionText(data.contactPosition.replace('Custom: ', ''));
      } else {
        setCustomPositionText('');
      }
      prevVisitId.current = visit.id;
    }
  }, [visit, planLocation]);

  const isAnchor = formData.dailyCustomers === 'HIGH' || formData.dailyCustomers === 'VERY_HIGH';

  const handleSave = useCallback((skipToNext = false) => {
    const newStatus = formData.status === 'NOT_YET' ? 'VISITED' : (formData.status || 'VISITED');
    const updated = { ...(formData as PlannedVisit), status: newStatus as any, isPlaceholder: false, isAnchor };
    setSavedTabs(prev => new Set(prev).add(activeTab));
    onSave(updated, !skipToNext);

    if (skipToNext) {
      const tabsArr: TabId[] = ['general', 'profile', 'sales'];
      const currentIdx = tabsArr.indexOf(activeTab);
      if (currentIdx < tabsArr.length - 1) {
        setTimeout(() => setActiveTab(tabsArr[currentIdx + 1]), 50);
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

  const tabsArr: TabId[] = ['general', 'profile', 'sales'];
  const currentTabIndex = tabsArr.indexOf(activeTab);
  const isLastTab = currentTabIndex === tabsArr.length - 1;

  // Contact position calculation
  const rawPosition = formData.contactPosition || '';
  const isCustomPos = rawPosition === 'Custom' || rawPosition.startsWith('Custom:') || (rawPosition !== '' && !contactPositions.includes(rawPosition));
  const selectPositionValue = isCustomPos ? 'Custom' : rawPosition;

  // Business size matching
  const rawSize = formData.businessSize || '';
  const matchedSize = businessSizes.find(s => s.value === rawSize || s.label === rawSize)?.value || rawSize;

  // Customer range matching
  const rawCustomers = formData.dailyCustomers || '';
  const matchedCustomers = customerRanges.find(r => r.value === rawCustomers || r.label === rawCustomers)?.value || rawCustomers;

  // Interest matching
  const rawInterest = formData.interested || '';
  const matchedInterest = interestOptions.find(o => o.value === rawInterest || o.label === rawInterest)?.value || rawInterest;

  // Status matching
  const rawStatus = formData.status || 'NOT_YET';
  const matchedStatus = pipelineStatusOptions.find(s => s.id === rawStatus || s.name === rawStatus)?.id || rawStatus;

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
                {tabsArr.map(tabId => {
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
                  <div className="relative" ref={categoryDropdownRef}>
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
                            <input type="text" placeholder="Search categories..." value={categorySearch} onChange={e => setCategorySearch(e.target.value)} className="flex-1 bg-transparent text-xs focus:outline-none" autoFocus />
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
                    <select 
                      value={selectPositionValue} 
                      onChange={e => { 
                        const val = e.target.value; 
                        if (val === 'Custom') {
                          setFormData({ ...formData, contactPosition: customPositionText ? `Custom: ${customPositionText}` : 'Custom' });
                        } else {
                          setCustomPositionText('');
                          setFormData({ ...formData, contactPosition: val });
                        }
                      }} 
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all"
                    >
                      <option value="">Select...</option>
                      {contactPositions.map(p => <option key={p} value={p}>{p}</option>)}
                      {!contactPositions.includes('Custom') && <option value="Custom">Custom</option>}
                    </select>
                    {selectPositionValue === 'Custom' && (
                      <input 
                        type="text" 
                        placeholder="Enter position..." 
                        value={customPositionText || (rawPosition.startsWith('Custom: ') ? rawPosition.replace('Custom: ', '') : (rawPosition !== 'Custom' ? rawPosition : ''))} 
                        onChange={e => { 
                          const txt = e.target.value;
                          setCustomPositionText(txt); 
                          setFormData({ ...formData, contactPosition: txt ? `Custom: ${txt}` : 'Custom' }); 
                        }} 
                        className="w-full mt-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all" 
                      />
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
                    <select value={matchedSize} onChange={e => setFormData({ ...formData, businessSize: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all">
                      <option value="">Select size...</option>
                      {businessSizes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="Daily Customers" tooltip={TOOLTIPS.dailyCustomers} />
                    <select value={matchedCustomers} onChange={e => setFormData({ ...formData, dailyCustomers: e.target.value })} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all">
                      <option value="">Select range...</option>
                      {customerRanges.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    {isAnchor && <p className="text-[10px] text-amber-600 font-semibold mt-1">Anchor business</p>}
                  </div>
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <FieldLabel label="Opening Hours" tooltip={TOOLTIPS.openingHours} />
                      {formData.openingHours && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 font-mono">
                          {formData.openingHours.replace('-', ' → ')}
                        </span>
                      )}
                    </div>

                    <div className="bg-gradient-to-br from-slate-50/90 via-white to-blue-50/20 border border-slate-200/80 rounded-2xl p-3 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Open Time */}
                        <div 
                          className="group relative bg-white border border-slate-200 hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-xl p-2.5 transition-all cursor-pointer shadow-2xs"
                          onClick={() => {
                            try { openTimeRef.current?.showPicker(); } catch (e) { openTimeRef.current?.focus(); }
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-amber-600 transition-colors flex items-center gap-1">
                              <Sun className="w-3 h-3 text-amber-500" /> Open Time
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                            <input 
                              ref={openTimeRef} 
                              type="time" 
                              value={formData.openingHours?.split('-')[0] || ''} 
                              onChange={e => { const close = formData.openingHours?.split('-')[1] || ''; setFormData({ ...formData, openingHours: `${e.target.value}-${close}` }); }} 
                              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer font-mono" 
                            />
                          </div>
                        </div>

                        {/* Close Time */}
                        <div 
                          className="group relative bg-white border border-slate-200 hover:border-indigo-400 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-xl p-2.5 transition-all cursor-pointer shadow-2xs"
                          onClick={() => {
                            try { closeTimeRef.current?.showPicker(); } catch (e) { closeTimeRef.current?.focus(); }
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                              <Moon className="w-3 h-3 text-indigo-500" /> Close Time
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                            <input 
                              ref={closeTimeRef} 
                              type="time" 
                              value={formData.openingHours?.split('-')[1] || ''} 
                              onChange={e => { const open = formData.openingHours?.split('-')[0] || ''; setFormData({ ...formData, openingHours: `${open}-${e.target.value}` }); }} 
                              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer font-mono" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Presets */}
                      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-blue-500" /> Presets:
                        </span>
                        {[
                          { label: '8 AM - 6 PM', value: '08:00-18:00' },
                          { label: '9 AM - 5 PM', value: '09:00-17:00' },
                          { label: '8 AM - 10 PM', value: '08:00-22:00' },
                          { label: '24 Hours', value: '00:00-23:59' },
                        ].map(preset => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, openingHours: preset.value })}
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-semibold shrink-0 transition-all border",
                              formData.openingHours === preset.value
                                ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                            )}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="Opening Days" tooltip={TOOLTIPS.openingDays} />
                    <div className="relative" ref={daysDropdownRef}>
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
                    <select value={matchedInterest} onChange={e => setFormData({ ...formData, interested: e.target.value as any })} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all">
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
                    <select value={matchedStatus} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 transition-all">
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
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <FieldLabel label="Next Visit Schedule" tooltip={TOOLTIPS.nextVisit} />
                    
                    <div className="bg-gradient-to-br from-slate-50/90 via-white to-purple-50/20 border border-slate-200/80 rounded-2xl p-3 space-y-2.5">
                      <div className="grid grid-cols-2 gap-2.5">
                        {/* Date */}
                        <div 
                          className="group relative bg-white border border-slate-200 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-xl p-2.5 transition-all cursor-pointer shadow-2xs"
                          onClick={() => {
                            try { visitDateRef.current?.showPicker(); } catch (e) { visitDateRef.current?.focus(); }
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-blue-600 transition-colors">Date</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                              <Calendar className="w-3.5 h-3.5" />
                            </div>
                            <input 
                              ref={visitDateRef} 
                              type="date" 
                              value={formData.nextVisitDate || ''} 
                              onChange={e => setFormData({ ...formData, nextVisitDate: e.target.value })} 
                              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer font-mono" 
                            />
                          </div>
                        </div>

                        {/* Time */}
                        <div 
                          className="group relative bg-white border border-slate-200 hover:border-purple-400 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 rounded-xl p-2.5 transition-all cursor-pointer shadow-2xs"
                          onClick={() => {
                            try { visitTimeRef.current?.showPicker(); } catch (e) { visitTimeRef.current?.focus(); }
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-purple-600 transition-colors">Time</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                              <Clock className="w-3.5 h-3.5" />
                            </div>
                            <input 
                              ref={visitTimeRef} 
                              type="time" 
                              value={formData.nextVisitTime || ''} 
                              onChange={e => setFormData({ ...formData, nextVisitTime: e.target.value })} 
                              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer font-mono" 
                            />
                          </div>
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
                  <button type="button" onClick={() => setActiveTab(tabsArr[currentTabIndex - 1])} className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors shrink-0">
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
