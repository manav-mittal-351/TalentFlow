// ─── components/common/Badge.jsx ──────────────────────────────────────────────
// Reusable tag component displaying colored status pills.

import React from 'react';
import { cn } from '../../utils/cn.js';

const VARIANT_STYLES = {
  purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/35',
  success: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/35',
  warning: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/35',
  neutral: 'bg-slate-50 dark:bg-slate-950/30 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
};

export const Badge = React.memo(function Badge({ label, variant = 'neutral', className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0',
        VARIANT_STYLES[variant] || VARIANT_STYLES.neutral,
        className
      )}
    >
      {label}
    </span>
  );
});
