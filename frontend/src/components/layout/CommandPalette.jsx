// ─── components/layout/CommandPalette.jsx ─────────────────────────────────────
// Ctrl+K Search overlay Dialog drawer. Traps keyboard events and focus points.
// Document reference: Document 9 — Component Tree §1 Layout Components

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Command } from 'lucide-react';

export function CommandPalette({ isOpen, onClose }) {
  const modalRef = useRef(null);
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Trap Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Close when clicking backdrop
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="command-palette-title"
          onClick={handleBackdropClick}
        >
          {/* 1. Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm"
          />

          {/* 2. Dialog Container */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
          >
            {/* Hidden description for accessibility screen readers */}
            <h2 id="command-palette-title" className="sr-only">
              Command Palette Search
            </h2>

            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 border-b border-slate-200 dark:border-slate-800 h-14 bg-slate-50 dark:bg-slate-900/50">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent border-0 outline-none text-slate-900 dark:text-slate-50 placeholder-slate-400 text-sm focus:ring-0 focus:outline-none"
                placeholder="Search resources, jobs, and workspace links..."
                aria-label="Search items"
              />
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-colors focus-ring"
                aria-label="Close search overlay"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Results Placeholder */}
            <div className="p-6 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Command className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Search Infrastructure Placeholder
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Type a job name, applicant profile, or navigation route keyword above. Complete search integration is coming soon.
                </p>
              </div>
            </div>

            {/* Footer tips */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span>Use <kbd className="font-sans font-bold">↑↓</kbd> to navigate, <kbd className="font-sans font-bold">Enter</kbd> to select</span>
              <span>Press <kbd className="font-sans font-bold">Esc</kbd> to close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
