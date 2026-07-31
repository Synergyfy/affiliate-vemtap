'use client';

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, X, Zap, Shield, Wifi } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface PwaInstallContextType {
  openPrompt: () => void;
  canInstall: boolean;
}

const PwaInstallContext = createContext<PwaInstallContextType | undefined>(undefined);

export function usePwaInstall() {
  const ctx = useContext(PwaInstallContext);
  if (!ctx) throw new Error('usePwaInstall must be used within PwaInstallProvider');
  return ctx;
}

const DISMISS_KEY = 'pwa-install-dismissed-at';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
const APP_NAME = 'Vemtap';
const AUTO_SHOW_DELAY = 1200;
const AUTO_HIDE_DELAY = 12000;

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function wasDismissedRecently() {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(DISMISS_KEY);
  if (!stored) return false;
  return Date.now() - Number(stored) < COOLDOWN_MS;
}

const FEATURES = [
  { icon: Zap, label: 'Instant Access' },
  { icon: Shield, label: 'Works Offline' },
  { icon: Wifi, label: 'Push Alerts' },
];

export default function PwaInstallProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [hasDeferred, setHasDeferred] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);

  // Listen for beforeinstallprompt and prevent the default browser prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setHasDeferred(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // After the event fires, wait ~1.2s before animating the prompt in
  useEffect(() => {
    if (!hasDeferred) return;
    if (isStandalone()) return;
    if (wasDismissedRecently()) return;
    const t = setTimeout(() => {
      setOpenCount((c) => c + 1);
      setIsOpen(true);
    }, AUTO_SHOW_DELAY);
    return () => clearTimeout(t);
  }, [hasDeferred]);

  const dismiss = useCallback((persist = true) => {
    setIsOpen(false);
    if (persist) {
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    }
  }, []);

  // Auto-hide after 12s; clear the timer on unmount/close
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => dismiss(true), AUTO_HIDE_DELAY);
    return () => clearTimeout(t);
  }, [isOpen, dismiss]);

  const openPrompt = useCallback(() => {
    setOpenCount((c) => c + 1);
    setIsOpen(true);
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) {
      showToast(
        'Open your browser menu and choose "Add to Home Screen" to install Vemtap.',
        'info'
      );
      dismiss(true);
      return;
    }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    deferredPrompt.current = null;
    setHasDeferred(false);
    if (choice.outcome === 'accepted') {
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch {
        /* ignore */
      }
      dismiss(false);
      showToast('Vemtap installed. Enjoy the native experience!', 'success');
    } else {
      dismiss(true);
    }
  };

  return (
    <PwaInstallContext.Provider value={{ openPrompt, canInstall: hasDeferred }}>
      {children}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="pwa-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              onClick={() => dismiss(true)}
              className="fixed inset-0 z-[80] bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              key="pwa-sheet"
              initial={{ opacity: 0, y: 80, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95, transition: { duration: 0.25, ease: 'easeIn' } }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              role="dialog"
              aria-modal="true"
              aria-label={`Install ${APP_NAME} app`}
              className="fixed z-[90] bottom-4 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:w-[420px]"
            >
              {/* Animated gradient border */}
              <div
                className="p-[1px] rounded-2xl animate-gradient-border"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #2563eb, #60a5fa, #818cf8)',
                  backgroundSize: '300% 100%',
                }}
              >
                {/* Card */}
                <div className="relative bg-white/[0.92] backdrop-blur-[24px] rounded-[15px] shadow-xl shadow-slate-900/10 overflow-hidden">
                  {/* Auto-dismiss progress bar */}
                  <div key={openCount} className="absolute top-0 left-0 right-0 h-0.5 z-10">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-400 animate-pwa-progress"
                      style={{ animationDuration: `${AUTO_HIDE_DELAY}ms` }}
                    />
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => dismiss(true)}
                    aria-label="Close"
                    className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="p-5 pt-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 pr-6">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.15 }}
                        className="relative shrink-0"
                      >
                        <div
                          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center overflow-hidden"
                          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)' }}
                        >
                          <Image
                            src="/assets/logo-icon.png"
                            alt={APP_NAME}
                            width={40}
                            height={40}
                            className="w-9 h-9 object-contain"
                          />
                        </div>
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-white" />
                        </span>
                      </motion.div>

                      <div className="min-w-0">
                        <motion.h3
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                          className="text-[17px] font-bold text-slate-900 leading-tight"
                        >
                          Get the {APP_NAME} App
                        </motion.h3>
                        <motion.p
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.28, duration: 0.3 }}
                          className="text-[13px] text-slate-500 font-medium mt-0.5"
                        >
                          Install for a faster, native-like experience
                        </motion.p>
                      </div>
                    </div>

                    {/* Feature pills */}
                    <motion.div
                      initial="hidden"
                      animate="show"
                      variants={{
                        hidden: {},
                        show: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } },
                      }}
                      className="flex flex-wrap gap-2 mt-4"
                    >
                      {FEATURES.map((f) => (
                        <motion.span
                          key={f.label}
                          variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/5 border border-blue-600/10 text-blue-700 text-[11px] font-bold"
                        >
                          <f.icon className="w-3.5 h-3.5 text-blue-600/70" />
                          {f.label}
                        </motion.span>
                      ))}
                    </motion.div>

                    {/* Buttons */}
                    <div className="flex items-center gap-2.5 mt-5">
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                        onClick={handleInstall}
                        className="relative flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 text-white text-sm font-bold shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/40 active:translate-y-0 transition-all overflow-hidden"
                      >
                        <span className="absolute inset-0 shimmer-sweep" />
                        <Download className="w-4 h-4 relative z-10" />
                        <span className="relative z-10">Install App</span>
                      </motion.button>
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55, duration: 0.3 }}
                        onClick={() => dismiss(true)}
                        className="px-5 py-3 rounded-xl text-slate-500 text-sm font-bold hover:bg-slate-100 active:bg-slate-200 transition-colors"
                      >
                        Not now
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PwaInstallContext.Provider>
  );
}
