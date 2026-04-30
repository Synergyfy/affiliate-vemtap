'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Copy, 
  Share2, 
  Download, 
  Check, 
  ExternalLink,
  QrCode as QrIcon,
  Link as LinkIcon
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export default function ReferralTools() {
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const referralLink = `https://affiliates.vemtap.com/?ref=${user?.referralCode || 'REF12345'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      downloadLink.download = 'vemtap-referral-qr.png';
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
          {/* Referral Link Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
                <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Your Referral Link</h3>
              <p className="text-sm sm:text-base text-slate-500 mb-6">Share this link directly with businesses or on your social media platforms.</p>
            </div>
            
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-600/5 rounded-xl blur-lg group-hover:bg-blue-600/10 transition-all" />
                <div className="relative flex items-center gap-2 bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                  <span className="text-xs sm:text-sm font-medium text-slate-600 truncate flex-grow">{referralLink}</span>
                  <button 
                    onClick={handleCopy}
                    className="p-2 hover:bg-white rounded-lg transition-colors text-blue-600 shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : <Copy className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-grow text-sm sm:text-base" onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button variant="outline" className="p-3 shrink-0">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* QR Code Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
              <QrIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">QR Code</h3>
            <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8">Download and print this QR code for physical marketing or presentations.</p>
            
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-4 border-slate-50 shadow-inner mb-6 sm:mb-8">
              <QRCodeSVG 
                id="referral-qr"
                value={referralLink} 
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
