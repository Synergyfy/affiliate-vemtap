'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isDesktop;
}

export interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'lg' | 'xl';
  hideClose?: boolean;
  closeButtonClassName?: string;
  /** Override panel max-height (default: mobile 92dvh / desktop 90vh) */
  maxHeightClass?: string;
  /** Max height as a vh number (default 92 mobile / 90 desktop) */
  children: React.ReactNode;
}

const PANEL_SIZES: Record<NonNullable<ModalShellProps['size']>, string> = {
  sm: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
};

export default function ModalShell({
  isOpen,
  onClose,
  header,
  footer,
  size = 'lg',
  hideClose,
  closeButtonClassName,
  maxHeightClass = 'max-h-[92dvh] sm:max-h-[90vh]',
  children,
}: ModalShellProps) {
  const isDesktop = useIsDesktop();

  const panelVariants = isDesktop
    ? {
        initial: { opacity: 0, y: 24, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 24, scale: 0.98 },
      }
    : {
        initial: { y: '100%' },
        animate: { y: 0 },
        exit: { y: '100%' },
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={cn(
              'relative w-full flex flex-col bg-white shadow-2xl overflow-hidden',
              'rounded-t-[28px] sm:rounded-3xl',
              maxHeightClass,
              PANEL_SIZES[size],
              'pb-[env(safe-area-inset-bottom)]',
            )}
          >
            {/* Drag handle (mobile only) */}
            <div className="sm:hidden shrink-0 flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            {header && (
              <div className="shrink-0 border-b border-slate-100 bg-slate-50/50">
                {header}
                {!hideClose && (
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className={cn(
                      'absolute p-2 rounded-xl hover:bg-slate-200 text-slate-400 transition-colors',
                      closeButtonClassName ?? 'top-4 right-4',
                    )}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="shrink-0 border-t border-slate-100 bg-slate-50/50">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}