'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Link as LinkIcon, 
  Briefcase, 
  Users, 
  Wallet, 
  BookOpen, 
  LogOut, 
  Menu, 
  X,
  Bell,
  User,
  Trophy,
  Clock,
  Lock,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import OnboardingModal from './OnboardingModal';

const sidebarItems = [
  { name: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Referral Tools', icon: LinkIcon, href: '/dashboard/tools' },
  { name: 'Businesses', icon: Briefcase, href: '/dashboard/businesses' },
  { name: 'Manager Network', icon: Users, href: '/dashboard/network' },
  { name: 'Leaderboard', icon: Trophy, href: '/dashboard/leaderboard' },
  { name: 'Wallet', icon: Wallet, href: '/dashboard/wallet' },
  { name: 'Sales Academy', icon: BookOpen, href: '/dashboard/training' },
  { name: 'Profile', icon: User, href: '/dashboard/profile' },
];

import DashboardTour from './DashboardTour';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const pathname = usePathname();
  const router = useRouter();

  const [isTourOpen, setIsTourOpen] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  // Calculate real-time countdown for 90-day window
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number}>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!user?.createdAt) return;
    
    const signupDate = new Date(user.createdAt);
    const targetDate = new Date(signupDate.getTime() + NINETY_DAYS_MS);

    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [user?.createdAt]);

  const isManager = user?.role === 'manager';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasCompletedTour(localStorage.getItem('hasCompletedTour') === 'true');
    }
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    const timer = setTimeout(() => setIsMobileMenuOpen(false), 0);
    return () => clearTimeout(timer);
  }, [pathname]);


  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'info');
    router.push('/login');
  };

  const handleCompleteTour = () => {
    setHasCompletedTour(true);
    localStorage.setItem('hasCompletedTour', 'true');
    setIsTourOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ... sidebars ... */}
      <DashboardTour isOpen={isTourOpen} onClose={() => {
        setIsTourOpen(false);
        setHasCompletedTour(true);
      }} />
      
      {/* Admin Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 sticky top-0 h-screen",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <Link href="/" className="flex items-center text-xl font-bold text-blue-600">
              Vemtap <span className="font-light ml-1 text-slate-400">Affiliates</span>
            </Link>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <nav className="flex-grow px-4 space-y-2 mt-4">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all group",
                  isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600")} />
                {isSidebarOpen && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl w-full text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all group",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-600" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link href="/" className="flex items-center text-lg font-bold text-blue-600">
            Vemtap
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsTourOpen(true)}
            className="p-2 bg-blue-50 text-blue-600 rounded-lg relative"
          >
            <Trophy className="w-5 h-5" />
            {!hasCompletedTour && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white animate-pulse" />
            )}
          </button>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85%] max-w-xs bg-white z-[70] lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">V</div>
                  <span className="text-xl font-bold text-slate-900">Vemtap</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-200 text-slate-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 bg-blue-600 text-white mx-4 mt-6 rounded-2xl shadow-lg shadow-blue-200">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold leading-tight">{user?.fullName || 'John Doe'}</p>
                    <p className="text-[10px] text-blue-100 uppercase tracking-widest font-bold">Affiliate Partner</p>
                  </div>
                </div>
              </div>

              <nav className="flex-grow p-4 space-y-1 mt-4">
                {sidebarItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl transition-all font-bold text-sm",
                        isActive 
                          ? "bg-blue-50 text-blue-600" 
                          : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-slate-400")} />
                      <span>{item.name}</span>
                      {isActive && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </Link>
                  );
                })}
              </nav>
              
              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 p-4 rounded-xl w-full text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-sm"
                >
                  <LogOut className="w-5 h-5 text-slate-400" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-w-0">
        {/* Top Header */}
        <header className="hidden lg:flex h-20 bg-white border-b border-slate-200 items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-900">
              {sidebarItems.find(item => item.href === pathname)?.name || 'Dashboard'}
            </h1>
            <button 
              onClick={() => setIsTourOpen(true)}
              className="ml-4 flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-all group relative"
            >
              <Trophy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              Platform Tour
              {!hasCompletedTour && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white animate-pulse" />
              )}
            </button>

            {!isManager && (
              <button 
                onClick={() => router.push('/dashboard/network')}
                className="ml-4 flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100 hover:bg-orange-100 transition-all group shadow-sm shadow-orange-100"
              >
                <Clock className="w-3.5 h-3.5" />
                {timeLeft.days} Days Left
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-slate-100 relative text-slate-600">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{user?.fullName || 'John Doe'}</p>
                <p className="text-xs text-slate-500">Affiliate Partner</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">
                <User className="w-6 h-6" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 pt-20 lg:pt-8">
          <OnboardingModal />
          {children}
        </div>
      </main>
    </div>
  );
}
