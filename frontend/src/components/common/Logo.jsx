import clsx from 'clsx';

export default function Logo({ className = '', size = 'md', showText = true, textClassName = '' }) {
  // Sizing mapping for flexibility across layouts
  const sizeMap = {
    sm: { box: 'w-6 h-6', text: 'text-sm' },
    md: { box: 'w-8 h-8', text: 'text-base' },
    lg: { box: 'w-10 h-10', text: 'text-lg' },
    xl: { box: 'w-12 h-12', text: 'text-xl' },
  };

  const dims = sizeMap[size] || sizeMap.md;

  return (
    <div className={clsx('flex items-center gap-2.5 shrink-0 select-none group', className)}>
      {/* Logo Icon Container */}
      <div className={clsx('relative flex items-center justify-center shrink-0', dims.box)}>
        <svg
          className="w-full h-full"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 1. The T top bar */}
          <path
            d="M 8 8 H 24"
            stroke="url(#logo-gradient-t)"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="transition-transform duration-300 group-hover:-translate-y-0.5"
          />

          {/* 2. The T main stem */}
          <path
            d="M 16 8 V 24"
            stroke="url(#logo-gradient-t)"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="transition-transform duration-300 group-hover:scale-y-[1.02] origin-top"
          />

          {/* 3. The F-branch / Checkmark */}
          <path
            d="M 16 15 L 20 20 L 26 12"
            stroke="url(#logo-gradient-f)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="logo-gradient-t" x1="8" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4f46e5" /> {/* Indigo 600 */}
              <stop offset="100%" stopColor="#7c3aed" /> {/* Violet 600 */}
            </linearGradient>
            <linearGradient id="logo-gradient-f" x1="16" y1="12" x2="26" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06b6d4" /> {/* Cyan 500 */}
              <stop offset="100%" stopColor="#3b82f6" /> {/* Blue 500 */}
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <span
          className={clsx(
            'font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-800 dark:from-white dark:via-slate-200 dark:to-indigo-300 bg-clip-text text-transparent transition-colors duration-200',
            dims.text,
            textClassName
          )}
        >
          TalentFlow
        </span>
      )}
    </div>
  );
}
