// ─── components/layout/ThemeToggle.jsx ────────────────────────────────────────
// Dropdown menu component allowing users to select Light, Dark, or System theme preferences.

import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { cn } from '../../utils/cn.js';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const options = [
    { id: 'light', label: 'Light', icon: Sun, color: 'text-amber-500' },
    { id: 'dark', label: 'Dark', icon: Moon, color: 'text-indigo-400' },
    { id: 'system', label: 'System', icon: Laptop, color: 'text-slate-400' },
  ];

  const currentOption = options.find((opt) => opt.id === theme) || options[2];
  const CurrentIcon = currentOption.icon;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors focus-ring shrink-0"
        aria-label={`Theme setting: ${currentOption.label}`}
        title={`Theme setting: ${currentOption.label}`}
        aria-expanded={isOpen}
        type="button"
      >
        <CurrentIcon className={cn('w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200', currentOption.color)} />
      </button>

      {isOpen && (
        <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:mt-2.5 w-auto sm:w-40 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl py-1.5 px-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-1">
            Appearance
          </div>
          <div className="space-y-0.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-bold rounded-xl transition-colors',
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  )}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn('w-4 h-4', opt.color)} />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
