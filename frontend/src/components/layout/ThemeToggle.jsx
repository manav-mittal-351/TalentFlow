// ─── components/layout/ThemeToggle.jsx ────────────────────────────────────────
// Switch button toggling custom properties between Light, Dark, and OS theme settings.

import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.jsx';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleCycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const renderIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-5 h-5 text-amber-500 transition-transform duration-300 hover:rotate-45" />;
      case 'dark':
        return <Moon className="w-5 h-5 text-indigo-400 transition-transform duration-300 hover:scale-110" />;
      default:
        return <Laptop className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Theme: Light. Click to switch to Dark.';
      case 'dark':
        return 'Theme: Dark. Click to switch to System.';
      default:
        return 'Theme: System. Click to switch to Light.';
    }
  };

  return (
    <button
      onClick={handleCycleTheme}
      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-ring"
      aria-label={getLabel()}
      title={getLabel()}
      type="button"
    >
      {renderIcon()}
    </button>
  );
}
