'use client';

import { motion } from 'motion/react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkHref,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Branding/Info */}
      <div className="lg:w-1/2 bg-blue-600 p-12 flex flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative z-10">
          <Link href="/" className="flex items-center text-2xl font-bold">
            Vemtap <span className="font-light ml-1 opacity-80">Affiliates</span>
          </Link>
        </div>
        <div className="relative z-10 max-w-md">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-6 leading-tight"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-blue-100"
          >
            {subtitle}
          </motion.p>
        </div>
        <div className="relative z-10 text-sm text-blue-200">
          &copy; {new Date().getFullYear()} Vemtap. All rights reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="lg:w-1/2 bg-white p-8 md:p-16 flex flex-col justify-center items-center">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {children}
            <p className="mt-8 text-center text-slate-600">
              {footerText}{' '}
              <Link href={footerLinkHref} className="text-blue-600 font-bold hover:underline">
                {footerLinkText}
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
