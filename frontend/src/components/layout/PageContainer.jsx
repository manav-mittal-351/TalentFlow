// ─── components/layout/PageContainer.jsx ──────────────────────────────────────
// Helper component standardizing max widths and layouts spacing.

import { cn } from '../../utils/cn.js';

export function PageContainer({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 flex flex-col',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
