'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Check, Navigation, Star, ChevronDown, Search, Info, MapPin, Clock,
  Calendar, ArrowRight, Sun, Moon, Sparkles, ExternalLink, RotateCcw,
  Building2, Phone, Mail, User, Briefcase, Users, Flame, CheckCircle2,
  AlertCircle, ShieldCheck, Compass, ArrowLeft
} from 'lucide-react';
import { PlannedVisit, BUSINESS_CATEGORIES, DAILY_CUSTOMER_RANGES, OPENING_DAYS, getCompletenessScore } from '@/types/affiliate-market-mapping';
import { cn } from '@/lib/utils';
import { useMarketMapping } from './MarketMappingContext';
import { useMarketMappingConfig } from '@/hooks/use-market-mapping-config';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface BusinessCaptureFormProps {
  initialVisit?: PlannedVisit | null;
  returnUrl?: string;
  onSaved?: (savedVisit: PlannedVisit) => void;
}

const TOOLTIPS: Record<string, string> = {
  name: 'Official business name from signage or front banner',
  category: 'Business type classification for targeted campaigns',
  address: 'Assigned territory or cluster location',
  exactAddress: 'Shop number, floor, building name, or closest landmark',
  ownerName: 'Primary decision maker or store manager name',
  phone: 'Active phone number for calls or WhatsApp outreach',
  contactPosition: 'Role of the contact person at this location',
  contactEmail: 'Official email address for follow-ups and invoices',
  businessSize: 'Staff count — Small (1–5), Medium (6–20), Large (21+)',
  dailyCustomers: 'Daily foot traffic — High or Very High marks this as an Anchor business',
  interested: 'Proprietor\'s receptiveness to joining VemTap',
  visitNotes: 'Key discussion points, objections, and agreements',
  openingHours: 'Regular daily store operating hours',
  openingDays: 'Days of the week the business is open for trading',
  nextVisit: 'Scheduled date and time for the follow-up meeting',
  pipelineStatus: 'Current stage in your sales funnel',
  decisionMakerMet: 'Did you interact directly with the owner or key decision maker?',
  demoDone: 'Indicate whether you presented the live VemTap application demo',
  gps: 'Capture precise GPS satellite coordinates at the shop front',
};

const DEFAULT_CONTACT_POSITIONS = ['Owner', 'Manager', 'HR Manager', 'Sales Manager', 'Custom'];
const DEFAULT_BUSINESS_SIZES = [
  { value: 'SMALL', label: 'Small (1–5 staff)', desc: 'Micro retail / kiosk' },
  { value: 'MEDIUM', label: 'Medium (6–20 staff)', desc: 'Standard storefront' },
  { value: 'LARGE', label: 'Large (21+ staff)', desc: 'Supermarket / chain' },
];
const DEFAULT_PIPELINE_STATUSES = [
  { id: 'NOT_YET', name: 'To Visit', color: 'bg-slate-500', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-300' },
  { id: 'VISITED', name: 'Visited', color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
  { id: 'CONTACTED', name: 'Contacted', color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  { id: 'INTERESTED', name: 'Interested', color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
  { id: 'NOT_INTERESTED', name: 'Not Interested', color: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
  { id: 'CUSTOMER', name: 'Customer', color: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300' },
];
const DEFAULT_INTEREST_OPTIONS = [
  { value: 'YES', label: 'Interested', emoji: '🔥', desc: 'Ready to proceed' },
  { value: 'MAYBE', label: 'Maybe / Undecided', emoji: '🤔', desc: 'Needs follow-up' },
  { value: 'NO', label: 'Not Interested', emoji: '✋', desc: 'Declined' },
];

function TooltipHelper({ text }: { text: string }) {
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
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full hover:bg-slate-100"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {show && (
        <div className="absolute z-50 left-0 bottom-full mb-1.5 w-56 px-3 py-2 bg-slate-900 text-white text-[11px] font-medium rounded-xl shadow-xl leading-snug pointer-events-auto border border-slate-700">
          {text}
          <div className="absolute -bottom-1 left-3 w-2 h-2 bg-slate-900 rotate-45 border-r border-b border-slate-700" />
        </div>
      )}
    </div>
  );
}

function FormSectionHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
  gradient = 'from-blue-600 to-indigo-600'
}: {
  title: string;
  subtitle: string;
  icon: any;
  badge?: React.ReactNode;
  gradient?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm bg-gradient-to-br", gradient)}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            {title}
          </h3>
          <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
        </div>
      </div>
      {badge && <div>{badge}</div>}
    </div>
  );
}

function toDateInputValue(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getNextVisitError(
  submittedDate?: string,
  submittedTime?: string,
  originalDate?: string,
  originalTime?: string,
): string | null {
  const date = String(submittedDate || '').slice(0, 10).trim();
  const time = String(submittedTime || '').slice(0, 5).trim();
  if (!date) return null;

  const unchanged =
    date === String(originalDate || '').slice(0, 10).trim() &&
    time === String(originalTime || '').slice(0, 5).trim();
  if (unchanged) return null;

  const now = new Date();
  const today = toDateInputValue(now);
  if (date < today) return 'Next visit date cannot be in the past';
  if (date === today && time && time < toTimeInputValue(now)) {
    return 'Next visit time cannot be in the past';
  }
  return null;
}

export default function BusinessCaptureForm({
  initialVisit,
  returnUrl = '/dashboard/market-mapping/pipeline',
  onSaved,
}: BusinessCaptureFormProps) {
  const router = useRouter();
  const { missionPlans, stats, saveCapture, addVisits, visits } = useMarketMapping();
  const { data: config } = useMarketMappingConfig();
  const { showToast } = useToast();

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

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const dayPlan = missionPlans.find(p => p.horizon === 'DAY' && (p.startDate || '').slice(0, 10) === todayKey);
  const weekPlan = missionPlans.find(p => {
    if (p.horizon !== 'WEEK' || !p.startDate) return false;
    const start = new Date(p.startDate);
    const end = p.endDate ? new Date(p.endDate) : new Date(start.getTime() + 6 * 86400000);
    return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= today && today <= end;
  });
  const planLocation = dayPlan?.location || weekPlan?.location || config?.assignedCluster || stats?.clusterName || '';

  const [formData, setFormData] = useState<Partial<PlannedVisit>>(() => {
    if (initialVisit) {
      return {
        ...initialVisit,
        address: initialVisit.address || planLocation,
      };
    }
    return {
      id: `biz-${Date.now()}`,
      name: '',
      category: '',
      status: 'NOT_YET',
      isPlaceholder: true,
      address: planLocation,
      horizon: 'DAY',
    };
  });

  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDaysDropdown, setShowDaysDropdown] = useState(false);
  const [customPositionText, setCustomPositionText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAcquiringGps, setIsAcquiringGps] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const daysDropdownRef = useRef<HTMLDivElement>(null);
  const openTimeRef = useRef<HTMLInputElement>(null);
  const closeTimeRef = useRef<HTMLInputElement>(null);
  const visitDateRef = useRef<HTMLInputElement>(null);
  const visitTimeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialVisit) {
      const data = { ...initialVisit };
      if (!data.address && planLocation) data.address = planLocation;
      setFormData(data);
      if (data.contactPosition && data.contactPosition.startsWith('Custom: ')) {
        setCustomPositionText(data.contactPosition.replace('Custom: ', ''));
      } else {
        setCustomPositionText('');
      }
    }
  }, [initialVisit, planLocation]);

  // Handle outside click for dropdowns
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

  const isAnchor = formData.dailyCustomers === 'HIGH' || formData.dailyCustomers === 'VERY_HIGH';

  // GPS Acquisition
  const handleCaptureGps = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setIsAcquiringGps(true);
    showToast('Acquiring satellite GPS lock...', 'info');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const accuracy = Math.round(pos.coords.accuracy);
        setGpsAccuracy(accuracy);

        let address = '';
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&addressdetails=1`
          );
          const data = await res.json();
          if (data?.display_name) {
            address = data.display_name;
          }
        } catch {
          address = '';
        }

        setFormData(prev => ({
          ...prev,
          gpsLat: lat,
          gpsLng: lng,
          gpsAddress: address || prev.gpsAddress,
        }));
        setIsAcquiringGps(false);
        showToast('✓ High-precision GPS coordinates locked & saved!', 'success');
      },
      (err) => {
        setIsAcquiringGps(false);
        let msg = 'Could not acquire GPS position.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission was denied. Please allow location access.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable. Ensure GPS/location services are enabled.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Please try again.';
        }
        showToast(msg, 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [showToast]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch) return categories;
    return categories.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase()));
  }, [categorySearch, categories]);

  const filledScore = getCompletenessScore(formData as PlannedVisit);
  const totalScore = 19;
  const percentComplete = Math.round((filledScore / totalScore) * 100);
  const starRating = Math.round((filledScore / totalScore) * 5);

  const rawPosition = formData.contactPosition || '';
  const isCustomPos = rawPosition === 'Custom' || rawPosition.startsWith('Custom:') || (rawPosition !== '' && !contactPositions.includes(rawPosition));
  const selectPositionValue = isCustomPos ? 'Custom' : rawPosition;

  const rawSize = formData.businessSize || '';
  const matchedSize = businessSizes.find(s => s.value === rawSize || s.label === rawSize)?.value || rawSize;

  const rawCustomers = formData.dailyCustomers || '';
  const matchedCustomers = customerRanges.find(r => r.value === rawCustomers || r.label === rawCustomers)?.value || rawCustomers;

  const rawInterest = formData.interested || '';
  const matchedInterest = interestOptions.find(o => o.value === rawInterest || o.label === rawInterest)?.value || rawInterest;

  const rawStatus = formData.status || 'NOT_YET';
  const matchedStatus = pipelineStatusOptions.find(s => s.id === rawStatus || s.name === rawStatus)?.id || rawStatus;

  const now = new Date();
  const nextVisitMinDate = toDateInputValue(now);
  const nextVisitIsToday = (formData.nextVisitDate || '').slice(0, 10) === nextVisitMinDate;
  const nextVisitMinTime = nextVisitIsToday ? toTimeInputValue(now) : undefined;

  // Handle Save
  const handleSave = async (stayOnPage = false) => {
    if (isSaving) return;

    if (!formData.name?.trim()) {
      showToast('Please enter a business name.', 'error');
      return;
    }

    const nextVisitError = getNextVisitError(
      formData.nextVisitDate,
      formData.nextVisitTime,
      initialVisit?.nextVisitDate,
      initialVisit?.nextVisitTime,
    );
    if (nextVisitError) {
      showToast(nextVisitError, 'error');
      return;
    }

    setIsSaving(true);
    try {
      const newStatus = formData.status === 'NOT_YET' ? 'VISITED' : (formData.status || 'VISITED');
      const visitToSave: PlannedVisit = {
        id: formData.id || `biz-${Date.now()}`,
        name: formData.name.trim(),
        category: formData.category || 'General Store',
        status: newStatus as any,
        isPlaceholder: false,
        isAnchor,
        address: formData.address || planLocation,
        exactAddress: formData.exactAddress,
        phone: formData.phone,
        ownerName: formData.ownerName,
        contactPosition: formData.contactPosition,
        contactEmail: formData.contactEmail,
        horizon: formData.horizon || 'DAY',
        dailyCustomers: formData.dailyCustomers,
        businessSize: formData.businessSize,
        openingHours: formData.openingHours,
        openingDays: formData.openingDays,
        gpsLat: formData.gpsLat,
        gpsLng: formData.gpsLng,
        gpsAddress: formData.gpsAddress,
        nextVisitDate: formData.nextVisitDate,
        nextVisitTime: formData.nextVisitTime,
        decisionMakerMet: formData.decisionMakerMet,
        interested: formData.interested,
        demoDone: formData.demoDone,
        visitNotes: formData.visitNotes,
      };

      const exists = visits.some(v => v.id === visitToSave.id);
      if (exists) {
        saveCapture(visitToSave);
      } else {
        addVisits([visitToSave]);
      }

      showToast('✓ Business profile saved successfully!', 'success');
      if (onSaved) onSaved(visitToSave);

      if (!stayOnPage) {
        router.push(returnUrl);
      }
    } catch (err: any) {
      showToast('Failed to save business: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(returnUrl);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-48 lg:pb-24">

      {/* Top Bar / Navigation */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all shadow-2xs active:scale-95 shrink-0"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                {formData.name ? formData.name : 'Capture New Business'}
              </h1>
              {isAnchor && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Anchor
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {formData.category || 'General Store'} · {formData.address || planLocation || 'Field territory'}
            </p>
          </div>
        </div>

        {/* Action button header (mobile & desktop) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className={cn(
              "px-3.5 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white text-xs font-black rounded-xl shadow-lg shadow-blue-200/50 flex items-center gap-1.5 sm:gap-2 shrink-0",
              isSaving && "opacity-80 cursor-wait"
            )}
          >
            <Save className={cn("w-3.5 sm:w-4 h-3.5 sm:h-4", isSaving && "animate-spin")} />
            <span>{isSaving ? 'Saving...' : 'Save & Done'}</span>
          </button>
        </div>
      </div>

      {/* Profile Completeness & Quick Score Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-8 -top-8 w-48 h-48 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-md border border-blue-500/30">
                Field Assistant
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    className={cn("w-3.5 h-3.5", i <= starRating ? "text-amber-400 fill-amber-400" : "text-white/20")}
                  />
                ))}
              </div>
            </div>
            <h2 className="text-base md:text-lg font-black tracking-tight text-white">
              Data Completion: <span className="text-blue-400">{percentComplete}%</span>
            </h2>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden max-w-md">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <p className="text-[11px] text-white/60">
              {filledScore} of {totalScore} fields captured · {totalScore - filledScore === 0 ? 'Fully recorded' : `${totalScore - filledScore} fields remaining`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {formData.gpsLat && formData.gpsLng ? (
              <div className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-xs font-bold">
                <Navigation className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>GPS Location Locked</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCaptureGps}
                disabled={isAcquiringGps}
                className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-black transition-all shadow-lg shadow-blue-900/50"
              >
                <Navigation className={cn("w-4 h-4", isAcquiringGps && "animate-spin")} />
                {isAcquiringGps ? 'Locating...' : 'Lock GPS Now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PROMINENT GPS STATION & LOCATION (HERO PLACEMENT) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border-2 border-blue-200/80 shadow-md shadow-blue-500/5 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/70 rounded-bl-full pointer-events-none" />

        <FormSectionHeader
          title="GPS Geolocation & Mapping"
          subtitle="Real-time satellite coordinates & store footprint"
          icon={Navigation}
          gradient="from-blue-600 to-cyan-600"
          badge={
            formData.gpsLat && formData.gpsLng ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> GPS Pinned
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Location Pending
              </span>
            )
          }
        />

        {formData.gpsLat && formData.gpsLng ? (
          /* Locked GPS Display Card */
          <div className="bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 border border-emerald-200 rounded-2xl p-4 md:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
                  <Navigation className="w-6 h-6 fill-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Verified Coordinates
                    </span>
                    {gpsAccuracy && (
                      <span className="text-[10px] font-bold text-slate-500">
                        Accuracy: ±{gpsAccuracy}m
                      </span>
                    )}
                  </div>
                  <p className="text-sm md:text-base font-black text-slate-900 font-mono mt-1">
                    {formData.gpsLat}, {formData.gpsLng}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${formData.gpsLat},${formData.gpsLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  View Map
                </a>
                <button
                  type="button"
                  onClick={handleCaptureGps}
                  disabled={isAcquiringGps}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                >
                  <RotateCcw className={cn("w-3.5 h-3.5", isAcquiringGps && "animate-spin")} />
                  Recapture
                </button>
              </div>
            </div>

            {formData.gpsAddress && (
              <div className="pt-2.5 border-t border-emerald-100 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {formData.gpsAddress}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Action Trigger for GPS Acquisition */
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 border border-dashed border-blue-300 rounded-2xl p-6 text-center space-y-3">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
              <div className="relative w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                <Navigation className="w-7 h-7" />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900">Pin Exact Shop Location</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                Stand at the store entrance to capture accurate GPS coordinates and street address.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCaptureGps}
              disabled={isAcquiringGps}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white text-sm font-black rounded-2xl shadow-xl shadow-blue-200"
            >
              <Compass className={cn("w-5 h-5", isAcquiringGps && "animate-spin")} />
              {isAcquiringGps ? 'Locking Satellite GPS...' : 'Capture GPS Location Now'}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. GENERAL BUSINESS IDENTITY & CONTACT */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-4">
        <FormSectionHeader
          title="General Information"
          subtitle="Business identification and primary contact person"
          icon={Building2}
          gradient="from-indigo-600 to-purple-600"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Business Name */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Business Name *</label>
              <TooltipHelper text={TOOLTIPS.name} />
            </div>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Divine Grace Supermarket & Pharmacy"
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative" ref={categoryDropdownRef}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Category *</label>
              <TooltipHelper text={TOOLTIPS.category} />
            </div>
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-semibold text-left flex items-center justify-between focus:outline-none focus:border-blue-500 transition-all"
            >
              <span className={formData.category ? "text-slate-900 font-bold" : "text-slate-400"}>
                {formData.category || 'Choose Category'}
              </span>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showCategoryDropdown && "rotate-180")} />
            </button>

            {showCategoryDropdown && (
              <div className="absolute z-30 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-64 overflow-hidden">
                <div className="p-2.5 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={e => setCategorySearch(e.target.value)}
                      className="flex-1 bg-transparent text-xs font-semibold focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="overflow-y-auto max-h-48 p-1">
                  {filteredCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, category: cat });
                        setShowCategoryDropdown(false);
                        setCategorySearch('');
                      }}
                      className={cn(
                        "w-full px-3 py-2.5 text-xs text-left rounded-xl font-medium transition-colors",
                        formData.category === cat ? "bg-blue-50 text-blue-600 font-black" : "hover:bg-slate-50 text-slate-700"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Assigned Area / Cluster */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Assigned Area / Cluster</label>
              <TooltipHelper text={TOOLTIPS.address} />
            </div>
            <input
              type="text"
              readOnly
              value={formData.address || planLocation || 'General Territory'}
              className="w-full px-4 py-3 bg-slate-100/70 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-600 cursor-not-allowed"
            />
          </div>

          {/* Exact Address / Landmark */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Exact Shop Number & Landmark</label>
              <TooltipHelper text={TOOLTIPS.exactAddress} />
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="e.g. Shop 14, Plot 8 Commercial Avenue, Opp. Total Station"
                value={formData.exactAddress || ''}
                onChange={e => setFormData({ ...formData, exactAddress: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Contact Person Name */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Contact / Owner Name</label>
              <TooltipHelper text={TOOLTIPS.ownerName} />
            </div>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="e.g. Mr. Emmanuel Okafor"
                value={formData.ownerName || ''}
                onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Contact Position */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Contact Position</label>
              <TooltipHelper text={TOOLTIPS.contactPosition} />
            </div>
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
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="">Select Role / Position...</option>
              {contactPositions.map(p => <option key={p} value={p}>{p}</option>)}
              {!contactPositions.includes('Custom') && <option value="Custom">Custom</option>}
            </select>
            {selectPositionValue === 'Custom' && (
              <input
                type="text"
                placeholder="Specify custom role (e.g. Managing Director)..."
                value={customPositionText || (rawPosition.startsWith('Custom: ') ? rawPosition.replace('Custom: ', '') : (rawPosition !== 'Custom' ? rawPosition : ''))}
                onChange={e => {
                  const txt = e.target.value;
                  setCustomPositionText(txt);
                  setFormData({ ...formData, contactPosition: txt ? `Custom: ${txt}` : 'Custom' });
                }}
                className="w-full mt-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-all"
              />
            )}
          </div>

          {/* Phone Number */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Phone Number</label>
              <TooltipHelper text={TOOLTIPS.phone} />
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 08012345678"
                value={formData.phone || ''}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, phone: val });
                }}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Contact Email */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Contact Email</label>
              <TooltipHelper text={TOOLTIPS.contactEmail} />
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="e.g. store@business.com"
                value={formData.contactEmail || ''}
                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BUSINESS PROFILE & OPERATIONS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-4">
        <FormSectionHeader
          title="Store Profile & Operations"
          subtitle="Staff size, customer foot traffic, and operating hours"
          icon={Users}
          gradient="from-amber-500 to-orange-600"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Business Size */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Business Size</label>
              <TooltipHelper text={TOOLTIPS.businessSize} />
            </div>
            <select
              value={matchedSize}
              onChange={e => setFormData({ ...formData, businessSize: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="">Select size classification...</option>
              {businessSizes.map(s => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Daily Customers */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <label className="block text-xs font-bold text-slate-700">Daily Foot Traffic / Customers</label>
                <TooltipHelper text={TOOLTIPS.dailyCustomers} />
              </div>
              {isAnchor && (
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500" /> ANCHOR POTENTIAL
                </span>
              )}
            </div>
            <select
              value={matchedCustomers}
              onChange={e => setFormData({ ...formData, dailyCustomers: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="">Select customer volume...</option>
              {customerRanges.map(r => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Operating Hours */}
          <div className="md:col-span-2 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label className="block text-xs font-bold text-slate-700">Opening Hours</label>
                <TooltipHelper text={TOOLTIPS.openingHours} />
              </div>
              {formData.openingHours && (
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  {formData.openingHours.replace('-', ' → ')}
                </span>
              )}
            </div>

            <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Open Time */}
                <div
                  className="group relative bg-white border border-slate-200 hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 rounded-xl p-3 transition-all cursor-pointer shadow-2xs"
                  onClick={() => {
                    try { openTimeRef.current?.showPicker(); } catch (e) { openTimeRef.current?.focus(); }
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-amber-600 transition-colors flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-500" /> Opening Time
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <input
                      ref={openTimeRef}
                      type="time"
                      value={formData.openingHours?.split('-')[0] || ''}
                      onChange={e => {
                        const close = formData.openingHours?.split('-')[1] || '';
                        setFormData({ ...formData, openingHours: `${e.target.value}-${close}` });
                      }}
                      className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer font-mono"
                    />
                  </div>
                </div>

                {/* Close Time */}
                <div
                  className="group relative bg-white border border-slate-200 hover:border-indigo-400 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-xl p-3 transition-all cursor-pointer shadow-2xs"
                  onClick={() => {
                    try { closeTimeRef.current?.showPicker(); } catch (e) { closeTimeRef.current?.focus(); }
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                      <Moon className="w-3.5 h-3.5 text-indigo-500" /> Closing Time
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <input
                      ref={closeTimeRef}
                      type="time"
                      value={formData.openingHours?.split('-')[1] || ''}
                      onChange={e => {
                        const open = formData.openingHours?.split('-')[0] || '';
                        setFormData({ ...formData, openingHours: `${open}-${e.target.value}` });
                      }}
                      className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-500" /> Presets:
                </span>
                {[
                  { label: '8 AM – 6 PM', value: '08:00-18:00' },
                  { label: '9 AM – 5 PM', value: '09:00-17:00' },
                  { label: '8 AM – 10 PM', value: '08:00-22:00' },
                  { label: '24 Hours', value: '00:00-23:59' },
                ].map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, openingHours: preset.value })}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all border",
                      formData.openingHours === preset.value
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Opening Days */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Operating Days</label>
              <TooltipHelper text={TOOLTIPS.openingDays} />
            </div>
            <div className="relative" ref={daysDropdownRef}>
              <button
                type="button"
                onClick={() => setShowDaysDropdown(!showDaysDropdown)}
                className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-semibold text-left flex items-center justify-between focus:outline-none focus:border-blue-500 transition-all"
              >
                <span className={formData.openingDays?.length ? "text-slate-900 font-bold" : "text-slate-400"}>
                  {formData.openingDays?.length === openingDays.length
                    ? 'Everyday (Mon – Sun)'
                    : formData.openingDays?.length
                    ? formData.openingDays.join(', ')
                    : 'Select operating days...'}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showDaysDropdown && "rotate-180")} />
              </button>

              {showDaysDropdown && (
                <div className="absolute z-30 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-2">
                  <div className="p-1 border-b border-slate-100 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, openingDays: [...openingDays] })}
                      className="flex-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, openingDays: [] })}
                      className="flex-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-2">
                    {openingDays.map(day => {
                      const isSel = formData.openingDays?.includes(day) || false;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const cur = formData.openingDays || [];
                            const next = isSel ? cur.filter(d => d !== day) : [...cur, day];
                            setFormData({ ...formData, openingDays: next });
                          }}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all",
                            isSel
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          {day}
                          {isSel && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. SALES PIPELINE & ENGAGEMENT */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-4">
        <FormSectionHeader
          title="Sales Pipeline & Action Plan"
          subtitle="Funnel stage, interest level, and next visit schedule"
          icon={Flame}
          gradient="from-emerald-600 to-teal-600"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pipeline Status Selector */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Pipeline Stage</label>
              <TooltipHelper text={TOOLTIPS.pipelineStatus} />
            </div>
            <select
              value={matchedStatus}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 transition-all"
            >
              {pipelineStatusOptions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Level of Interest */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Proprietor Interest Level</label>
              <TooltipHelper text={TOOLTIPS.interested} />
            </div>
            <select
              value={matchedInterest}
              onChange={e => setFormData({ ...formData, interested: e.target.value as any })}
              className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 transition-all"
            >
              <option value="">Select interest...</option>
              {interestOptions.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Decision Maker Met */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Met Key Decision Maker?</label>
              <TooltipHelper text={TOOLTIPS.decisionMakerMet} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, decisionMakerMet: true })}
                className={cn(
                  "py-3 rounded-2xl text-xs font-black border transition-all flex items-center justify-center gap-1.5",
                  formData.decisionMakerMet === true
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                <Check className="w-3.5 h-3.5" /> Yes
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, decisionMakerMet: false })}
                className={cn(
                  "py-3 rounded-2xl text-xs font-black border transition-all flex items-center justify-center gap-1.5",
                  formData.decisionMakerMet === false
                    ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                No
              </button>
            </div>
          </div>

          {/* App Demo Done */}
          <div className="flex items-center">
            <label className="w-full flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all mt-5">
              <input
                type="checkbox"
                checked={formData.demoDone || false}
                onChange={e => setFormData({ ...formData, demoDone: e.target.checked })}
                className="w-5 h-5 accent-blue-600 rounded-lg"
              />
              <div>
                <span className="text-xs font-black text-slate-900 block">VemTap App Demo Completed</span>
                <span className="text-[10px] text-slate-500 font-medium">Demonstrated loyalty &amp; QR payment tools</span>
              </div>
            </label>
          </div>

          {/* Next Visit Schedule */}
          <div className="md:col-span-2 space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <label className="block text-xs font-bold text-slate-700">Next Follow-Up Visit Schedule</label>
              <TooltipHelper text={TOOLTIPS.nextVisit} />
            </div>

            <div className="bg-gradient-to-br from-slate-50 via-white to-purple-50/30 border border-slate-200 rounded-2xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date */}
                <div
                  className="group relative bg-white border border-slate-200 hover:border-blue-400 focus-within:border-blue-500 rounded-xl p-3 transition-all cursor-pointer shadow-2xs"
                  onClick={() => {
                    try { visitDateRef.current?.showPicker(); } catch (e) { visitDateRef.current?.focus(); }
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-blue-600 transition-colors">
                      Follow-up Date
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      ref={visitDateRef}
                      type="date"
                      min={nextVisitMinDate}
                      value={formData.nextVisitDate || ''}
                      onChange={e => setFormData({ ...formData, nextVisitDate: e.target.value })}
                      className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer font-mono"
                    />
                  </div>
                </div>

                {/* Time */}
                <div
                  className="group relative bg-white border border-slate-200 hover:border-purple-400 focus-within:border-purple-500 rounded-xl p-3 transition-all cursor-pointer shadow-2xs"
                  onClick={() => {
                    try { visitTimeRef.current?.showPicker(); } catch (e) { visitTimeRef.current?.focus(); }
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-purple-600 transition-colors">
                      Follow-up Time
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-100 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <input
                      ref={visitTimeRef}
                      type="time"
                      min={nextVisitMinTime}
                      value={formData.nextVisitTime || ''}
                      onChange={e => setFormData({ ...formData, nextVisitTime: e.target.value })}
                      className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Discussion Notes */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <label className="block text-xs font-bold text-slate-700">Visit Notes &amp; Actionable Intelligence</label>
              <TooltipHelper text={TOOLTIPS.visitNotes} />
            </div>
            <textarea
              rows={4}
              value={formData.visitNotes || ''}
              onChange={e => setFormData({ ...formData, visitNotes: e.target.value })}
              placeholder="Record key conversation points, proprietor feedback, requested features, or agreed pricing..."
              className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-400 resize-none"
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STICKY BOTTOM ACTION DOCK (POSITIONED ABOVE MOBILE BOTTOM NAV) */}
      {/* ========================================================================= */}
      <div className="fixed bottom-20 lg:bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shrink-0"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all text-slate-700 text-xs font-black rounded-xl sm:rounded-2xl shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Save </span>Draft
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className={cn(
                "flex-1 sm:flex-initial sm:px-8 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white text-xs sm:text-sm font-black rounded-xl sm:rounded-2xl shadow-lg shadow-blue-200/50 flex items-center justify-center gap-1.5 sm:gap-2",
                isSaving && "opacity-80 cursor-wait"
              )}
            >
              <Save className={cn("w-3.5 sm:w-4 h-3.5 sm:h-4", isSaving && "animate-spin")} />
              {isSaving ? 'Saving Profile...' : 'Save & Done'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
