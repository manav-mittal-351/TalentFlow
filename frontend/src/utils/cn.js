// ─── utils/cn.js ─────────────────────────────────────────────────────────────
// Dynamic utility merging class list strings safely with Tailwind JIT checks.
// Integrates clsx and tailwind-merge.

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
