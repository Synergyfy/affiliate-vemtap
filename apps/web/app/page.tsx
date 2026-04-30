'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  CheckCircle2, 
  DollarSign, 
  Users, 
  HelpCircle, 
  ChevronRight, 
  TrendingUp, 
  ShieldCheck, 
  Zap,
  Globe,
  BarChart3,
  Smartphone,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const BentoCard = ({ 
  title, 
  description, 
  icon: Icon, 
  className, 
  delay = 0,
  image
}: { 
  title: string; 
  description: string; 
  icon: any; 
  className?: string;
  delay?: number;
  image?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={cn(
      "group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 transition-all hover:shadow-2xl hover:shadow-blue-100/50 hover:-translate-y-1",
      className
    )}
  >
    {image && (
      <div className="absolute inset-0 -z-10 opacity-10 transition-opacity group-hover:opacity-20">
        <Image 
          src={image} 
          alt={title} 
          fill 
          className="object-cover" 
          referrerPolicy="no-referrer"
        />
      </div>
    )}
    <div className="relative z-10">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-xl font-bold text-slate-900">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-blue-100 selection:text-blue-900">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">V</div>
              <div className="flex flex-col leading-none">
                <span className="text-xl font-bold text-slate-900">Vemtap</span>
                <span className="text-[10px] uppercase tracking-widest font-bold text-blue-600">Affiliates</span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-10">
              <a href="#how-it-works" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">Process</a>
              <a href="#earnings" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">Earnings</a>
              <a href="#faqs" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">FAQs</a>
              <div className="h-6 w-px bg-slate-200" />
              <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors uppercase tracking-wider">Login</Link>
              <Link href="/signup" className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 hover:shadow-blue-200 active:scale-95">
                Join Network
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-slate-600 hover:text-blue-600 transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                <a 
                  href="#how-it-works" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  Process
                </a>
                <a 
                  href="#earnings" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  Earnings
                </a>
                <a 
                  href="#faqs" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  FAQs
                </a>
                <div className="h-px bg-slate-100 w-full" />
                <Link 
                  href="/login" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  href="/signup" 
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold text-center shadow-xl shadow-blue-200"
                >
                  Join Network
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-grow pt-20">
        {/* Hero Section - Split Layout */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.03),transparent_70%)]" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[120px] opacity-50 -mr-64 -mb-64" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest mb-8">
                  <Zap className="w-3 h-3 fill-current" />
                  Now Open for 2026 Enrollment
                </div>
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-normal tracking-tighter text-slate-900 leading-[0.9] mb-6 sm:mb-8">
                  Turn Your <br />
                  <span className="text-blue-600 italic">Network</span> Into <br />
                  <span className="relative">
                    Revenue
                    <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full h-2 sm:h-3 text-blue-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                      <path d="M0 5 Q 25 0 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="8" />
                    </svg>
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 sm:mb-10 max-w-xl">
                  Join Nigeria&apos;s most rewarding affiliate network. Refer businesses to Vemtap and earn <span className="font-bold text-slate-900 underline decoration-blue-500 decoration-4 underline-offset-4">20% direct commission</span> on every subscription.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <Link href="/signup" className="w-full sm:w-auto bg-blue-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl sm:rounded-3xl text-base sm:text-lg font-normal hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 flex items-center justify-center group active:scale-95">
                    Start Earning Now
                    <ArrowRight className="ml-2 sm:ml-3 group-hover:translate-x-2 transition-transform" />
                  </Link>
                  <a href="#how-it-works" className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 rounded-2xl sm:rounded-3xl text-base sm:text-lg font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center border border-slate-200">
                    See the Process
                  </a>
                </div>
                
                <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
                  <div className="flex -space-x-3 sm:-space-x-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 sm:border-4 border-white bg-slate-200 overflow-hidden relative">
                        <Image 
                          src={`https://picsum.photos/seed/user${i}/100/100`} 
                          alt="User" 
                          fill 
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">1,200+ Affiliates</p>
                    <p className="text-xs text-slate-500">Already earning with Vemtap</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative mt-12 lg:mt-0"
              >
                <div className="relative aspect-[4/5] rounded-[30px] sm:rounded-[40px] overflow-hidden shadow-2xl border-4 sm:border-8 border-white">
                  <Image 
                    src="https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=1974&auto=format&fit=crop" 
                    alt="Business Meeting" 
                    fill 
                    className="object-cover"
                    priority
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent" />
                  
                  {/* Floating Stats Card */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8 right-4 sm:right-8 bg-white/90 backdrop-blur-md p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/20 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Payouts</p>
                          <p className="text-lg sm:text-xl font-black text-slate-900">₦12.5M+</p>
                        </div>
                      </div>
                      <div className="text-emerald-600 font-bold text-[10px] sm:text-sm">+15% this week</div>
                    </div>
                    <div className="h-1.5 sm:h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "75%" }}
                        transition={{ duration: 2, delay: 1 }}
                        className="h-full bg-emerald-500" 
                      />
                    </div>
                  </motion.div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute -top-6 -right-6 sm:-top-12 sm:-right-12 h-32 w-32 sm:h-48 sm:w-48 bg-blue-600 rounded-full -z-10 blur-[60px] sm:blur-[80px] opacity-20" />
                <div className="absolute -bottom-6 -left-6 sm:-bottom-12 sm:-left-12 h-32 w-32 sm:h-48 sm:w-48 bg-emerald-600 rounded-full -z-10 blur-[60px] sm:blur-[80px] opacity-20" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section id="how-it-works" className="py-20 sm:py-32 bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-20">
              <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-3 sm:mb-4">The Ecosystem</h2>
              <h3 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tight">Built for Performance</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 sm:gap-6">
              <BentoCard 
                className="sm:col-span-2 md:col-span-3 md:row-span-2"
                title="20% Direct Commission"
                description="Earn a massive 20% cut from every business you refer. No caps, no limits, just pure earnings for every successful subscription."
                icon={DollarSign}
                image="https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2070&auto=format&fit=crop"
              />
              <BentoCard 
                className="sm:col-span-2 md:col-span-3"
                title="Real-time Tracking"
                description="Monitor your referrals, clicks, and earnings in real-time with our advanced analytics dashboard."
                icon={BarChart3}
                delay={0.1}
              />
              <BentoCard 
                className="sm:col-span-2 md:col-span-3"
                title="Instant Withdrawals"
                description="Request your earnings anytime. We process payments swiftly to ensure you get your rewards when you need them."
                icon={Zap}
                delay={0.2}
              />
              <BentoCard 
                className="sm:col-span-1 md:col-span-2"
                title="Global Reach"
                description="Refer businesses from anywhere in the world to Vemtap's digital solutions."
                icon={Globe}
                delay={0.3}
              />
              <BentoCard 
                className="sm:col-span-1 md:col-span-2"
                title="Mobile First"
                description="Manage your affiliate business on the go with our fully responsive platform."
                icon={Smartphone}
                delay={0.4}
              />
              <BentoCard 
                className="sm:col-span-2 md:col-span-2"
                title="Secure & Trusted"
                description="Your data and earnings are protected by industry-leading security protocols."
                icon={ShieldCheck}
                delay={0.5}
              />
            </div>
          </div>
        </section>

        {/* Earnings Breakdown - Editorial Style */}
        <section id="earnings" className="py-16 sm:py-24 md:py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative bg-slate-900 rounded-[32px] sm:rounded-[40px] md:rounded-[60px] p-6 sm:p-10 md:p-16 lg:p-24 text-white overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] md:w-[800px] h-[300px] sm:h-[500px] md:h-[800px] bg-blue-600 rounded-full blur-[80px] sm:blur-[120px] md:blur-[150px] -mr-32 sm:-mr-48 md:-mr-96 -mt-32 sm:-mt-48 md:-mt-96" />
                <div className="absolute bottom-0 left-0 w-[200px] sm:w-[400px] md:w-[600px] h-[200px] sm:h-[400px] md:h-[600px] bg-emerald-600 rounded-full blur-[80px] sm:blur-[120px] md:blur-[150px] -ml-24 sm:-ml-32 md:-ml-64 -mb-24 sm:-mb-32 md:-mb-64" />
              </div>

              <div className="relative z-10 grid lg:grid-cols-2 gap-12 sm:gap-16 md:gap-20 items-center">
                <div>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black leading-[1.1] sm:leading-[0.9] mb-6 sm:mb-8">
                    The Math of <br className="hidden sm:block" />
                    <span className="text-blue-400">Success</span>
                  </h2>
                  <p className="text-base sm:text-lg md:text-xl text-slate-400 leading-relaxed mb-8 sm:mb-12">
                    Our commission structure is designed to reward both your direct efforts and your leadership as you grow your network.
                  </p>
                  
                  <div className="space-y-6 sm:space-y-8">
                    <div className="flex items-start gap-4 sm:gap-6 group">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl sm:rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30 group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                      </div>
                      <div>
                        <h4 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">Tier 1: Direct Referrals</h4>
                        <p className="text-xs sm:text-sm md:text-base text-slate-400">Earn <span className="text-white font-bold">20% recurring commission</span> for every business you personally bring to Vemtap.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 sm:gap-6 group">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-xl sm:rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white transition-all shrink-0">
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                      </div>
                      <div>
                        <h4 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">Tier 2: Network Growth</h4>
                        <p className="text-xs sm:text-sm md:text-base text-slate-400">Unlock an additional <span className="text-white font-bold">5% indirect commission</span> from your sub-affiliates after 5 successful referrals.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-2xl rounded-[24px] sm:rounded-[30px] md:rounded-[40px] p-6 sm:p-8 md:p-10 border border-white/10 shadow-2xl">
                  <h4 className="text-lg sm:text-xl md:text-2xl font-bold mb-6 sm:mb-8 flex items-center gap-3">
                    <TrendingUp className="text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />
                    Potential Monthly Income
                  </h4>
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex justify-between items-center p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-3xl bg-white/5 border border-white/5">
                      <span className="text-xs sm:text-sm md:text-base text-slate-400 font-medium">10 Businesses (₦50k plan)</span>
                      <span className="text-lg sm:text-xl md:text-2xl font-black text-white">₦100,000</span>
                    </div>
                    <div className="flex justify-between items-center p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl md:rounded-3xl bg-white/5 border border-white/5">
                      <span className="text-xs sm:text-sm md:text-base text-slate-400 font-medium">25 Businesses (₦50k plan)</span>
                      <span className="text-lg sm:text-xl md:text-2xl font-black text-white">₦250,000</span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl bg-blue-600 shadow-xl shadow-blue-600/20">
                      <div>
                        <span className="text-base sm:text-lg md:text-xl text-blue-100 font-bold block mb-1">50 Businesses + Network</span>
                        <span className="text-[10px] sm:text-xs md:text-sm text-blue-200">Including 5% Indirect Commission</span>
                      </div>
                      <span className="text-xl sm:text-2xl md:text-3xl font-black text-white">₦650,000+</span>
                    </div>
                  </div>
                  <p className="text-center text-[10px] sm:text-xs text-slate-500 mt-6 sm:mt-8 italic">
                    *Estimates based on standard business subscription plans.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section - Clean Minimal */}
        <section id="faqs" className="py-20 sm:py-32 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-4 sm:mb-6">Common Questions</h2>
              <p className="text-lg sm:text-xl text-slate-600">Everything you need to know about the Vemtap Affiliate Program.</p>
            </div>
            
            <div className="grid gap-4">
              {[
                { q: 'Is there a signup fee?', a: 'Absolutely not. Joining the Vemtap Affiliate Platform is 100% free. We only make money when you make money.' },
                { q: 'How often are payouts processed?', a: 'Payouts are processed weekly. Once you hit the minimum threshold of ₦5,000, you can request a withdrawal to any Nigerian bank account.' },
                { q: 'Do I get marketing materials?', a: 'Yes! Your dashboard includes personalized referral links, QR codes, and professionally designed banners to help you pitch Vemtap effectively.' },
                { q: 'Can I refer other affiliates?', a: 'Yes, and you should! Once you have referred 5 paying businesses, you unlock Tier 2 commissions (5%) from everyone you refer to the affiliate program.' },
              ].map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="group border border-slate-100 rounded-2xl sm:rounded-[32px] p-6 sm:p-8 hover:bg-slate-50 transition-all hover:border-blue-100"
                >
                  <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4 flex items-center justify-between">
                    <span className="flex items-center">
                      <HelpCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mr-3 sm:mr-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                      {item.q}
                    </span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />
                  </h4>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed pl-8 sm:pl-10">{item.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA - High Impact */}
        <section className="py-20 sm:py-32 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-blue-600" />
          <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[1000px] h-[600px] sm:h-[1000px] bg-white rounded-full blur-[120px] sm:blur-[180px]" />
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl md:text-8xl font-black text-white leading-none mb-8 sm:mb-12 tracking-tighter">
                Your Future <br />
                Starts <span className="italic underline decoration-white/30 decoration-4 sm:decoration-8 underline-offset-4 sm:underline-offset-8">Today</span>
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                <Link href="/signup" className="w-full sm:w-auto bg-white text-blue-600 px-8 sm:px-12 py-4 sm:py-6 rounded-2xl sm:rounded-[32px] text-xl sm:text-2xl font-black hover:bg-blue-50 transition-all shadow-2xl active:scale-95">
                  Join the Network
                </Link>
                <Link href="/login" className="w-full sm:w-auto bg-blue-700 text-white px-8 sm:px-12 py-4 sm:py-6 rounded-2xl sm:rounded-[32px] text-xl sm:text-2xl font-black hover:bg-blue-800 transition-all border border-white/20 active:scale-95">
                  Member Login
                </Link>
              </div>
              <p className="mt-8 sm:mt-12 text-blue-100 font-bold uppercase tracking-[0.2em] sm:tracking-[0.4em] text-[10px] sm:text-sm">
                No Credit Card Required • Free Forever
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer - Modern Minimal */}
      <footer className="bg-white py-12 sm:py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-12 mb-12 sm:mb-20">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">V</div>
                <span className="text-xl font-bold text-slate-900">Vemtap Affiliates</span>
              </div>
              <p className="text-sm sm:text-base text-slate-500 max-w-sm leading-relaxed">
                Empowering individuals to build sustainable income by connecting businesses with world-class digital solutions.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4 sm:mb-6 uppercase tracking-widest text-[10px] sm:text-xs">Platform</h4>
              <ul className="space-y-3 sm:space-y-4 text-sm font-medium text-slate-500">
                <li><a href="#how-it-works" className="hover:text-blue-600 transition-colors">Process</a></li>
                <li><a href="#earnings" className="hover:text-blue-600 transition-colors">Earnings</a></li>
                <li><a href="#faqs" className="hover:text-blue-600 transition-colors">FAQs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-4 sm:mb-6 uppercase tracking-widest text-[10px] sm:text-xs">Legal</h4>
              <ul className="space-y-3 sm:space-y-4 text-sm font-medium text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 sm:pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs sm:text-sm font-medium text-slate-400 text-center md:text-left">&copy; {new Date().getFullYear()} Vemtap. Built for the future of work.</p>
            <div className="flex gap-6">
              {['Twitter', 'LinkedIn', 'Instagram'].map(social => (
                <a key={social} href="#" className="text-xs sm:text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors">{social}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
