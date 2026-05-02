'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  footerText?: string;
  footerLinkText?: string;
  footerLinkHref?: string;
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 md:p-12">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-3">{title}</h1>
            <p className="text-slate-500 leading-relaxed">{subtitle}</p>
          </div>

          {children}

          {(footerText || footerLinkText) && (
            <div className="mt-10 text-center text-sm text-slate-500">
              {footerText}{' '}
              {footerLinkText && footerLinkHref && (
                <Link
                  href={footerLinkHref}
                  className="font-bold text-blue-600 hover:underline"
                >
                  {footerLinkText}
                </Link>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
