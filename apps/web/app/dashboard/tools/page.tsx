'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Share2,
  Download,
  Check,
  QrCode as QrIcon,
  Link as LinkIcon,
  Building2,
  UserPlus,
  Rocket,
  ShieldCheck,
  Target,
  Loader2
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/toast';
import { useReferralStats } from '@/hooks/use-referral-stats';
import { useMarketingTools } from '@/hooks/use-marketing-tools';

export default function ReferralTools() {
  const { user } = useAuth();
  const { stats, isLoading: isLoadingStats } = useReferralStats();
  const { tools, isLoading: isLoadingTools } = useMarketingTools();
  const [activeTab, setActiveTab] = useState<'business' | 'agent'>('business');
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');
  const referralCode = user?.referralCode || 'SYSTEM';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const VEMTAP_BASE_URL = process.env.NEXT_PUBLIC_VEMTAP_URL || 'https://vemtap.com';
  const affiliateBaseUrl = origin || 'https://affiliates.vemtap.com';

  const links = {
    business: {
      title: 'Business Onboarding',
      desc: 'Use this link to register new businesses. They will be added to your direct portfolio once they complete setup.',
      url: `${VEMTAP_BASE_URL}/get-started?ref=${referralCode}`,
      icon: Building2,
      color: 'blue',
      badge: 'Revenue Source',
      shareMessage: "Scale your business with Vemtap! Manage payments, customers, and operations seamlessly. Join thousands of merchants growing with us. Sign up today:",
    },
    agent: {
      title: 'Agent Recruitment',
      desc: 'Use this link to refer other affiliate agents. Build your team and earn indirect commissions from their performance.',
      url: `${affiliateBaseUrl}/signup?ref=${referralCode}`,
      icon: UserPlus,
      color: 'emerald',
      badge: 'Team Growth',
      shareMessage: "Join the Vemtap Affiliate Network! Earn high commissions, build your own team, and grow with Africa's fastest-growing business platform. Start your journey here:",
    }
  };

  const activeLink = links[activeTab];
  const { showToast } = useToast();

  const handleCopy = () => {
    const fullMessage = `${activeLink.shareMessage}\n${activeLink.url}`;
    navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    showToast('Marketing message & link copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: activeLink.title, text: activeLink.shareMessage, url: activeLink.url });
      } else {
        handleCopy();
        showToast('Sharing not supported. Link copied instead.', 'info');
      }
    } catch (err) {
      console.log('Error sharing:', err);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('referral-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 100;
      canvas.height = img.height + 200;
      ctx!.fillStyle = '#ffffff';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.fillStyle = '#0f172a';
      ctx!.font = 'bold 24px Inter';
      ctx!.fillText('VEMTAP AFFILIATE', 50, 60);
      ctx?.drawImage(img, 50, 100);
      ctx!.fillStyle = '#64748b';
      ctx!.font = '14px Inter';
      ctx!.fillText(`Scan to join: ${activeTab === 'business' ? 'Merchant' : 'Team'}`, 50, canvas.height - 40);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `vemtap-${activeTab}-qr-kit.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      showToast('QR Kit downloaded!', 'success');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-0">

        {/* Header */}
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Referral Engine</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Scale your earnings by onboarding businesses or growing your sub-agent network.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
          <button
            onClick={() => setActiveTab('business')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'business' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            Business
          </button>
          <button
            onClick={() => setActiveTab('agent')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'agent' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
            )}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Agent
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Link Details Card */}
            <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-100 shadow-lg relative overflow-hidden">
              <div className="relative z-10 space-y-5">
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                  activeTab === 'business' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                )}>
                  <Rocket className="w-3 h-3" />
                  {activeLink.badge}
                </div>

                <h3 className="text-lg sm:text-xl font-black text-slate-900">{activeLink.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                  {activeLink.desc}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[9px] font-black text-slate-400 uppercase">Clicks</span>
                    </div>
                    <p className="text-base font-black text-slate-900">
                      {isLoadingStats ? <Loader2 className="w-3.5 h-3.5 animate-pulse" /> : (stats?.linkClicks || 0)}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-1">
                      <QrIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[9px] font-black text-slate-400 uppercase">QR Scans</span>
                    </div>
                    <p className="text-base font-black text-slate-900">
                      {isLoadingStats ? <Loader2 className="w-3.5 h-3.5 animate-pulse" /> : (stats?.qrScans || 0)}
                    </p>
                  </div>
                </div>

                {/* Link Display */}
                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-700 truncate flex-1 select-all">{activeLink.url}</span>
                  <button onClick={handleCopy} className="p-2 bg-white hover:bg-slate-900 hover:text-white rounded-xl transition-all shadow-sm text-slate-600 shrink-0">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleCopy}
                    className={cn(
                      "flex-1 h-12 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg",
                      activeTab === 'business' ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </Button>
                  <Button onClick={handleShare} variant="outline" className="h-12 px-4 rounded-2xl border-slate-200 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black uppercase text-slate-600">Share</span>
                  </Button>
                </div>
              </div>

              <div className={cn("absolute -right-12 -bottom-12 w-40 h-40 opacity-5", activeTab === 'business' ? "text-blue-900" : "text-emerald-900")}>
                <activeLink.icon className="w-full h-full" />
              </div>
            </div>

            {/* Share Preview */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 border-dashed">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Share Preview</h4>
              </div>
              <p className="text-xs font-medium text-slate-600 italic leading-relaxed">
                "{activeLink.shareMessage}"
              </p>
              <p className="text-[10px] font-bold text-blue-600 mt-2 truncate">{activeLink.url}</p>
            </div>

            {/* Tips */}
            <div className="bg-slate-900 p-4 rounded-2xl">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1">Pro Tip</h4>
              <p className="text-[11px] font-medium text-slate-300">
                Post your {activeTab} link on WhatsApp status for 5x more visibility.
              </p>
            </div>

            {/* Marketing Kit */}
            {isLoadingTools ? (
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-pulse text-slate-300" />
              </div>
            ) : tools.length > 0 ? (
              <button
                onClick={() => window.open(tools[0].content, '_blank')}
                className="w-full bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between active:scale-[0.98] transition-all"
              >
                <div>
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Marketing Kit</h4>
                  <p className="text-xs font-black text-slate-900 truncate">{tools[0].title}</p>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>
            ) : null}
          </motion.div>
        </AnimatePresence>

        {/* QR Code — below content on mobile */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg flex flex-col items-center text-center">
          <QrIcon className="w-6 h-6 text-slate-900 mb-3" />
          <h3 className="text-sm font-black text-slate-900 mb-1">QR Code</h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-5">Scan to join</p>

          <div className="bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-4 border-slate-50">
            <QRCodeSVG
              id="referral-qr"
              value={activeLink.url}
              size={160}
              level="H"
              includeMargin={false}
              imageSettings={{
                src: activeTab === 'business' ? "/assets/logo-icon.png" : (user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.fullName || 'Agent'}`),
                x: undefined, y: undefined, height: 35, width: 35, excavate: true,
              }}
            />
          </div>

          <Button
            variant="outline"
            className="w-full h-11 mt-5 rounded-xl border-slate-200 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
            onClick={handleDownloadQR}
          >
            <Download className="w-4 h-4" />
            Download QR
          </Button>

          <p className="mt-2 text-[9px] text-slate-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified Secure
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
