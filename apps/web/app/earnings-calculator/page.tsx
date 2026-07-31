'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Calculator, ArrowLeft, ArrowRight } from 'lucide-react';
import PublicEarningsCalculator from '@/components/earnings-calculator/PublicEarningsCalculator';

export default function PublicEarningsCalculatorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">V</div>
              <div className="flex flex-col leading-none">
                <span className="text-xl font-bold text-slate-900">Vemtap</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-blue-600">Affiliates</span>
              </div>
            </Link>
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">
                Login
              </Link>
              <Link href="/signup" className="bg-slate-900 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 hover:shadow-blue-200 active:scale-95 text-sm">
                Join Network
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page intro */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              The Math of <span className="text-blue-600">Success</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-500 font-medium mt-3 max-w-2xl">
              Estimate your commission potential month by month. Move the target slider, tune your plan mix, and see exactly what a consistent sales effort could earn you.
            </p>
          </div>

          <Suspense fallback={
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <PublicEarningsCalculator
              header={
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Earnings Calculator</h2>
                    <p className="text-xs text-slate-500">Estimate your commission potential month by month</p>
                  </div>
                </div>
              }
            />
          </Suspense>

          {/* CTA */}
          <div className="mt-12 bg-slate-900 rounded-[32px] p-8 sm:p-12 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-30 -mr-24 -mt-24 pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-2xl sm:text-4xl font-black mb-3">Ready to start earning?</h3>
              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto mb-8">
                Join Nigeria&apos;s most rewarding affiliate network and turn the numbers above into reality.
              </p>
              <Link href="/signup" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-2xl sm:rounded-3xl font-bold hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/20 group active:scale-95">
                Start Earning Now
                <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
