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
  ChevronRight,
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

  // Resolve origin client-side to avoid SSR mismatch
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
      desc: 'Use this link to register new businesses. They will be added to your direct portfolio once they complete setup on vemtap.com.',
      url: `${VEMTAP_BASE_URL}/get-started?ref=${referralCode}`,
      icon: Building2,
      color: 'blue',
      badge: 'Revenue Source',
      shareMessage: "📈 Scale your business with Vemtap! Manage payments, customers, and operations seamlessly. Join thousands of merchants growing with us. Sign up today:",
    },
    agent: {
      title: 'Agent Recruitment',
      desc: 'Use this link to refer other affiliate agents. Build your team and earn indirect commissions from their performance.',
      url: `${affiliateBaseUrl}/signup?ref=${referralCode}`,
      icon: UserPlus,
      color: 'emerald',
      badge: 'Team Growth',
      shareMessage: "🚀 Join the Vemtap Affiliate Network! Earn high commissions, build your own team, and grow with Africa's fastest-growing business platform. Start your journey here:",
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
    const shareData = {
      title: activeLink.title,
      text: activeLink.shareMessage,
      url: activeLink.url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopy();
        showToast('Sharing not supported on this browser. Link copied instead.', 'info');
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
      
      // Draw Header
      ctx!.fillStyle = '#0f172a';
      ctx!.font = 'bold 24px Inter';
      ctx!.fillText('VEMTAP AFFILIATE', 50, 60);
      
      // Draw QR
      ctx?.drawImage(img, 50, 100);
      
      // Draw Footer
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
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 leading-tight">Referral Engine</h2>
            <p className="text-sm text-slate-500 font-medium max-w-md mt-2">
              Scale your earnings by onboarding businesses or growing your sub-agent network.
            </p>
          </div>
          
          {/* Tab Switcher */}
          <div className="bg-slate-100 p-1.5 rounded-[24px] flex items-center gap-1 shadow-inner border border-slate-200 w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('business')}
              className={cn(
                "flex-grow md:flex-grow-0 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'business' ? "bg-white text-blue-600 shadow-lg" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Building2 className="w-4 h-4" />
              Business Link
            </button>
            <button 
              onClick={() => setActiveTab('agent')}
              className={cn(
                "flex-grow md:flex-grow-0 flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === 'agent' ? "bg-white text-emerald-600 shadow-lg" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <UserPlus className="w-4 h-4" />
              Agent Link
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid lg:grid-cols-5 gap-8"
          >
            {/* Link Details Card */}
            <div className="lg:col-span-3 space-y-8">
              <div className="bg-white p-8 sm:p-10 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-100 relative overflow-hidden group">
                <div className="relative z-10">
                  <div className={cn(
                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border",
                    activeTab === 'business' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                  )}>
                    <Rocket className="w-3.5 h-3.5" />
                    {activeLink.badge}
                  </div>
                  
                  <h3 className="text-3xl font-black text-slate-900 mb-4">{activeLink.title}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 max-w-md">
                    {activeLink.desc}
                  </p>

                  <div className="space-y-6">
                    {/* Analytics Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                          <Target className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link Clicks</p>
                          <h4 className="text-lg font-black text-slate-900">
                            {isLoadingStats ? <Loader2 className="w-4 h-4 animate-spin" /> : (stats?.linkClicks || 0)}
                          </h4>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
                          <QrIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QR Scans</p>
                          <h4 className="text-lg font-black text-slate-900">
                            {isLoadingStats ? <Loader2 className="w-4 h-4 animate-spin" /> : (stats?.qrScans || 0)}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <div className="relative group/link">
                      <div className="absolute inset-0 bg-slate-900/5 rounded-2xl blur-lg group-hover/link:bg-slate-900/10 transition-all" />
                      <div className="relative flex items-center gap-3 bg-slate-50 p-4 rounded-3xl border border-slate-200">
                        <LinkIcon className="w-5 h-5 text-slate-400 ml-2" />
                        <span className="text-xs font-black text-slate-700 truncate flex-grow select-all">{activeLink.url}</span>
                        <button 
                          onClick={handleCopy}
                          className="p-3 bg-white hover:bg-slate-900 hover:text-white rounded-2xl transition-all shadow-sm text-slate-600 active:scale-90"
                        >
                          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        onClick={handleCopy}
                        className={cn(
                          "flex-grow h-16 rounded-[24px] text-xs font-black uppercase tracking-widest shadow-xl transition-all",
                          activeTab === 'business' ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
                        )}
                      >
                        {copied ? 'Copied to Clipboard' : 'Copy Referral Link'}
                      </Button>
                      <Button 
                        onClick={handleShare}
                        variant="outline" 
                        className="h-16 px-8 rounded-[24px] border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-3"
                      >
                        <Share2 className="w-5 h-5 text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Share Now</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Background Decoration */}
                <div className={cn(
                  "absolute -right-20 -bottom-20 w-64 h-64 opacity-5 transition-transform group-hover:scale-110",
                  activeTab === 'business' ? "text-blue-900" : "text-emerald-900"
                )}>
                  <activeLink.icon className="w-full h-full" />
                </div>
              </div>

              {/* Share Preview Section */}
              <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-200 border-dashed">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Share Write-up Preview</h4>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                  <p className="text-sm font-medium text-slate-600 italic leading-relaxed">
                    "{activeLink.shareMessage}"
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-600 truncate max-w-[200px]">{activeLink.url}</span>
                    <span className="text-[9px] font-black text-slate-300 uppercase">Marketing Content</span>
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-6 rounded-[32px] text-white">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Pro Tip</h4>
                  <p className="text-xs font-medium text-slate-300">
                    Post your {activeTab} link on WhatsApp status for 5x more visibility from local business owners.
                  </p>
                </div>
                
                {isLoadingTools ? (
                  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                  </div>
                ) : tools.length > 0 ? (
                  <div 
                    onClick={() => {
                      const tool = tools[0];
                      window.open(tool.content, '_blank');
                    }}
                    className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer active:scale-95 transition-all"
                  >
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Marketing Kit</h4>
                      <p className="text-xs font-black text-slate-900 truncate max-w-[150px]">{tools[0].title}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all">
                      <Download className="w-5 h-5" />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between opacity-60">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Marketing Kits</h4>
                      <p className="text-xs font-black text-slate-900">No assets available yet</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-200">
                      <Download className="w-5 h-5" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* QR Code Section */}
            <div className="lg:col-span-2">
              <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-100 flex flex-col items-center text-center sticky top-24">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                  <QrIcon className="w-8 h-8 text-slate-900" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Instant QR Code</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Print or show to scan</p>

                <div className="bg-white p-6 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-8 border-slate-50 relative group">
                  <QRCodeSVG 
                    id="referral-qr"
                    value={activeLink.url} 
                    size={220}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: activeTab === 'business' 
                        ? "/assets/logo-icon.png" 
                        : (user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.fullName || 'Agent'}`),
                      x: undefined,
                      y: undefined,
                      height: 50,
                      width: 50,
                      excavate: true,
                    }}
                  />
                  
                  {/* QR Overlay for Agent - showing we have center logo */}
                  {activeTab === 'agent' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                        <img 
                          src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.fullName || 'Agent'}`} 
                          className="w-full h-full object-cover" 
                          alt="Agent" 
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-10 w-full">
                  <Button 
                    variant="outline" 
                    className="w-full h-14 rounded-2xl border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50 flex items-center justify-center gap-3" 
                    onClick={handleDownloadQR}
                  >
                    <Download className="w-5 h-5" />
                    Download Kit (.PNG)
                  </Button>
                </div>
                
                <p className="mt-4 text-[10px] text-slate-400 font-bold flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified Secure QR
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
