// ─── pages/public/LoginPage.jsx ──────────────────────────────────────────────
// User account sign-in interface integrating React Hook Form + Zod schemas,
// live backend Axios requests, and role-based redirecting pathways.

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { loginSchema } from '../../utils/validators.js';
import { ROUTES } from '../../constants/routes.js';
import { ROLES } from '../../constants/roles.js';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // Map roles to their target dashboard pathways
  const ROLE_DASHBOARDS = {
    [ROLES.RECRUITER]: ROUTES.RECRUITER.DASHBOARD,
    [ROLES.CANDIDATE]: ROUTES.CANDIDATE.DASHBOARD,
    [ROLES.HIRING_MANAGER]: ROUTES.HM.DASHBOARD,
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setServerError('');
    try {
      const response = await api.post('/auth/login', data);
      const { token, user } = response.data.data;

      // Update AuthContext session state
      login(token, user);
      toast.success('Successfully logged in');

      // Route redirection matching state history or role defaults
      const from = location.state?.from?.pathname;
      const targetPath = from || ROLE_DASHBOARDS[user.role] || ROUTES.HOME;
      navigate(targetPath, { replace: true });
    } catch (err) {
      console.error('Login request failed:', err);
      const errMsg = err.response?.data?.message || 'Invalid email or password';
      setServerError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[75vh] px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card transition-colors duration-200">
        
        {/* Header Heading */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md mb-4">
            T
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Sign in to your account
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Welcome back! Enter credentials to access your dashboard.
          </p>
        </div>

        {/* Server response error alerts box */}
        {serverError && (
          <div
            className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-600 dark:text-rose-400"
            role="alert"
          >
            {serverError}
          </div>
        )}

        {/* Input credentials form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  {...register('email')}
                  className="block w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus-visible:outline-none outline-none focus-ring"
                  placeholder="name@company.com"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p id="login-email-error" className="text-[11px] font-medium text-rose-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <Link
                  to="#"
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline focus-ring rounded"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className="block w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus-visible:outline-none outline-none focus-ring"
                  placeholder="••••••••"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus-ring rounded-lg"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="login-password-error" className="text-[11px] font-medium text-rose-500">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-500 transition-all shadow-md focus-ring hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </div>
        </form>

        {/* Navigation reference anchor link */}
        <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          <span>New to TalentFlow? </span>
          <Link
            to={ROUTES.REGISTER}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline focus-ring rounded"
          >
            Create candidate account
          </Link>
        </div>
      </div>
    </div>
  );
}
