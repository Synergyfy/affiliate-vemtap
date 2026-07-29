'use client';

import { useState } from 'react';
import { Plus, Camera, Navigation, Mic, Phone, PlusCircle, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingActionMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { icon: PlusCircle, label: 'Add Business', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
    { icon: Camera, label: 'Capture Photo', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
    { icon: Navigation, label: 'Navigate', color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' },
    { icon: Mic, label: 'Voice Note', color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
    { icon: Phone, label: 'Call Business', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
    { icon: StickyNote, label: 'Add Note', color: 'text-slate-600 bg-slate-100 hover:bg-slate-200' },
  ];

  return (
    <div className="fixed bottom-24 md:bottom-8 right-6 z-40 flex flex-col items-end gap-3">
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="flex flex-col items-end gap-3 mb-2"
          >
            {actions.map((action, idx) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 group"
              >
                <span className="bg-white text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </span>
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shadow-lg border border-white transition-colors", action.color)}>
                  <action.icon className="w-5 h-5" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300",
          isOpen ? "bg-slate-900 rotate-45" : "bg-blue-600 hover:bg-blue-700"
        )}
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

    </div>
  );
}
