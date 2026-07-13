// ─── components/layout/UserMenu.jsx ──────────────────────────────────────────
// Avatar dropdown menu for authenticated user session management.

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { LogOut, User as UserIcon, Settings } from 'lucide-react';
import { ROUTES } from '../../constants/routes.js';
import { ROLES } from '../../constants/roles.js';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!user) return null;

  // Resolve profile link path depending on user role
  const getProfileLink = () => {
    if (user.role === ROLES.CANDIDATE) return ROUTES.CANDIDATE.PROFILE;
    if (user.role === ROLES.RECRUITER) return ROUTES.RECRUITER.COMPANY;
    return '#'; // HM does not have an independent profile screen in V1
  };

  const getInitials = () => {
    if (!user.name) return 'U';
    return user.name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSignOut = () => {
    logout();
    setIsOpen(false);
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 focus-ring rounded-full"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
        type="button"
      >
        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-sm flex items-center justify-center border border-indigo-200 dark:border-indigo-800 transition-transform duration-200 hover:scale-105">
          {getInitials()}
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {user.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
            <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              {user.role?.replace('_', ' ')}
            </span>
          </div>

          {/* Links */}
          <div className="py-1">
            {getProfileLink() !== '#' && (
              <Link
                to={getProfileLink()}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 focus-ring"
                role="menuitem"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </Link>
            )}
            <Link
              to="#"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 focus-ring"
              role="menuitem"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </Link>
          </div>

          {/* Footer Action */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left focus-ring"
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
