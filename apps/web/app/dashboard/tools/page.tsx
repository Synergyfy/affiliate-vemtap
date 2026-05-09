'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  Share2,
  Download,
  Check,
  QrCode as QrIcon,
  Link as LinkIcon,
  Users
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { useMarketingTools, useShortLinks, useCreateShortLink, useDeleteShortLink } from '@/services/useToolsHooks';
import { useToast } from '@/hooks/toast';
import { Loader2, Plus, Trash2, ExternalLink, FileText, Image as ImageIcon, Video } from 'lucide-react';

export default function ReferralTools() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [copiedBusiness, setCopiedBusiness] = useState(false);
  const [copiedAffiliate, setCopiedAffiliate] = useState(false);
  const [shortLinkCode, setShortLinkCode] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const referralCode = user?.referralCode || 'SYSTEM';
  const VEMTAP_BASE_URL = process.env.NEXT_PUBLIC_VEMTAP_URL || 'https://vemtap.com';

  const businessLink = `${VEMTAP_BASE_URL}/get-started?ref=${referralCode}`;
  const affiliateLink = `${origin || 'https://affiliates.vemtap.com'}/signup?ref=${referralCode}`;

  // Hooks
  const { data: toolsData, isLoading: isToolsLoading } = useMarketingTools();
  const { data: shortLinks, isLoading: isLinksLoading } = useShortLinks();
  const createShortLink = useCreateShortLink();
  const deleteShortLink = useDeleteShortLink();

  const handleCopy = (text: string, type?: 'business' | 'affiliate') => {
    navigator.clipboard.writeText(text);
    if (type === 'business') {
      setCopiedBusiness(true);
      setTimeout(() => setCopiedBusiness(false), 2000);
    } else if (type === 'affiliate') {
      setCopiedAffiliate(true);
      setTimeout(() => setCopiedAffiliate(false), 2000);
    }
    showToast('Link copied to clipboard', 'success');
  };

  const handleCreateShortLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortLinkCode) return;
    try {
      await createShortLink.mutateAsync({ code: shortLinkCode });
      setShortLinkCode('');
      showToast('Short link created successfully', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleDeleteShortLink = async (id: string) => {
    if (!confirm('Are you sure you want to delete this short link?')) return;
    try {
      await deleteShortLink.mutateAsync(id);
      showToast('Short link deleted', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const shareOnSocial = (platform: string) => {
    const text = encodeURIComponent(`Join Vemtap and start growing your business! Use my referral code: ${referralCode}`);
    const url = encodeURIComponent(businessLink);

    let shareUrl = '';
    switch (platform) {
      case 'WhatsApp': shareUrl = `https://wa.me/?text=${text}%20${url}`; break;
      case 'Twitter': shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`; break;
      case 'LinkedIn': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
      case 'Facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
    }

    if (shareUrl) window.open(shareUrl, '_blank');
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('referral-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'vemtap-business-qr.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Referral Tools</h2>
          <p className="text-sm sm:text-base text-slate-500">Use these tools to share Vemtap with your network and earn commissions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Business Referral Link Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Business Referral Link</h3>
              <p className="text-sm sm:text-base text-slate-500 mb-6">Refer businesses to Vemtap and earn commissions on their subscriptions.</p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-600/5 rounded-xl blur-lg group-hover:bg-blue-600/10 transition-all" />
                <div className="relative flex items-center gap-2 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                  <span className="text-xs sm:text-sm font-medium text-slate-600 truncate flex-grow">{businessLink}</span>
                  <button
                    onClick={() => handleCopy(businessLink, 'business')}
                    className="p-2 hover:bg-white rounded-lg transition-colors text-blue-600 shrink-0"
                  >
                    {copiedBusiness ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-grow text-sm sm:text-base" onClick={() => handleCopy(businessLink, 'business')}>
                  {copiedBusiness ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button variant="outline" className="p-3 shrink-0" onClick={() => {
                  const text = encodeURIComponent(`Join Vemtap and start growing your business! Use my referral code: ${referralCode}`);
                  const url = encodeURIComponent(businessLink);
                  window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
                }}>
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Affiliate Referral Link Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Affiliate Referral Link</h3>
              <p className="text-sm sm:text-base text-slate-500 mb-6">Invite others to join the affiliate network and earn indirect commissions.</p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-purple-600/5 rounded-xl blur-lg group-hover:bg-purple-600/10 transition-all" />
                <div className="relative flex items-center gap-2 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                  <span className="text-xs sm:text-sm font-medium text-slate-600 truncate flex-grow">{affiliateLink}</span>
                  <button
                    onClick={() => handleCopy(affiliateLink, 'affiliate')}
                    className="p-2 hover:bg-white rounded-lg transition-colors text-purple-600 shrink-0"
                  >
                    {copiedAffiliate ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-grow text-sm sm:text-base bg-purple-600 hover:bg-purple-700" onClick={() => handleCopy(affiliateLink, 'affiliate')}>
                  {copiedAffiliate ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button variant="outline" className="p-3 shrink-0" onClick={() => {
                  const text = encodeURIComponent(`Join my network on Vemtap Affiliates and start earning! Use my code: ${referralCode}`);
                  const url = encodeURIComponent(affiliateLink);
                  window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
                }}>
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* QR Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
              <QrIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">QR Code (Business)</h3>
            <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8">Download and print this QR code for physical marketing to businesses.</p>

            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-4 border-slate-50 shadow-inner mb-6 sm:mb-8">
              <QRCodeSVG
                id="referral-qr"
                value={businessLink}
                size={140}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: "https://vemtap.com/favicon.ico",
                  x: undefined,
                  y: undefined,
                  height: 30,
                  width: 30,
                  excavate: true,
                }}
              />
            </div>

            <Button variant="outline" className="w-full text-sm sm:text-base" onClick={handleDownloadQR}>
              <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Download PNG
            </Button>
          </motion.div>

          {/* Marketing Materials Help Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-600 p-6 sm:p-8 rounded-3xl shadow-xl shadow-blue-100 flex flex-col justify-center text-white"
          >
            <h3 className="text-xl font-bold mb-4">Need help sharing?</h3>
            <p className="text-blue-100 text-sm mb-6">Use our pre-designed flyers and scripts to effectively promote Vemtap and close more deals.</p>
            <Button className="bg-white text-blue-600 hover:bg-blue-50 font-bold" onClick={() => document.getElementById('marketing-section')?.scrollIntoView({ behavior: 'smooth' })}>
              View Materials
            </Button>
          </motion.div>
        </div>

        {/* Custom Short Links */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <LinkIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Custom Short Links</h3>
          </div>

          <form onSubmit={handleCreateShortLink} className="flex gap-2 mb-6">
            <div className="relative flex-grow">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">vemtap.link/</span>
              <input
                type="text"
                value={shortLinkCode}
                onChange={(e) => setShortLinkCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="my-custom-link"
                className="w-full pl-24 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <Button type="submit" disabled={createShortLink.isPending} className="px-6">
              {createShortLink.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Create
            </Button>
          </form>

          <div className="space-y-3">
            {isLinksLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
            ) : (shortLinks || []).length > 0 ? (
              (shortLinks || []).map((link: any) => (
                <div key={link.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-bold text-slate-900">vemtap.link/{link.code}</div>
                    <div className="text-[10px] font-bold text-slate-400 bg-white border border-slate-100 px-2 py-0.5 rounded-full">
                      {link.clicks} clicks
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(`https://vemtap.link/${link.code}`)}
                      className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteShortLink(link.id)}
                      className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-red-600 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-sm text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No custom short links created yet.
              </p>
            )}
          </div>
        </div>

        {/* Marketing Materials */}
        <div id="marketing-section" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Marketing Materials</h3>
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button className="px-3 py-1.5 text-xs font-bold bg-white text-slate-900 rounded-md shadow-sm">All</button>
              <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900">Flyers</button>
              <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900">Scripts</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isToolsLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-slate-50 animate-pulse rounded-3xl" />
              ))
            ) : (toolsData?.data || []).length > 0 ? (
              (toolsData?.data || []).map((tool: any) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group"
                >
                  <div className="h-40 bg-slate-100 relative overflow-hidden">
                    {tool.type === 'FLYER' ? (
                      <img src={tool.content} alt={tool.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50">
                        <FileText className="w-12 h-12 text-blue-200" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="text-[10px] font-bold px-2 py-1 bg-white/90 backdrop-blur rounded-full text-slate-900 uppercase">
                        {tool.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-grow">
                    <h4 className="font-bold text-slate-900 mb-1">{tool.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">{tool.description || 'Marketing resource for affiliates.'}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-grow text-xs h-9" onClick={() => tool.type === 'COPY_TEMPLATE' ? handleCopy(tool.content) : window.open(tool.content, '_blank')}>
                        {tool.type === 'COPY_TEMPLATE' ? <Copy className="w-3 h-3 mr-2" /> : <Download className="w-3 h-3 mr-2" />}
                        {tool.type === 'COPY_TEMPLATE' ? 'Copy Script' : 'Download'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm">No marketing materials available at the moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Share Buttons */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white">
          <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6 sm:gap-8">
            <div className="text-center lg:text-left">
              <h4 className="text-lg sm:text-xl font-bold mb-2">Quick Share</h4>
              <p className="text-sm sm:text-base text-slate-400">Share your referral link instantly on these platforms.</p>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-4 w-full lg:w-auto">
              {[
                { name: 'WhatsApp', color: 'bg-[#25D366]', icon: Share2 },
                { name: 'Twitter', color: 'bg-[#1DA1F2]', icon: Share2 },
                { name: 'LinkedIn', color: 'bg-[#0077B5]', icon: Share2 },
                { name: 'Facebook', color: 'bg-[#1877F2]', icon: Share2 },
              ].map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => shareOnSocial(platform.name)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-transform hover:scale-105 active:scale-95",
                    platform.color
                  )}
                >
                  <platform.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  {platform.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
