// ─── pages/public/RegisterPage.jsx ───────────────────────────────────────────
// Candidate registration page interface integrating React Hook Form + Zod validations,
// live Axios requests, and automatic dashboard redirects.

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { registerSchema } from '../../utils/validators.js';
import { ROUTES } from '../../constants/routes.js';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock, Mail, User, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setServerError('');
    try {
      const response = await api.post('/auth/register', data);
      const { token, user } = response.data.data;

      // Update active session profiles
      login(token, user);
      toast.success('Registration successful! Welcome to TalentFlow.');

      // Default registration route targets Candidate Dashboard
      navigate(ROUTES.CANDIDATE.DASHBOARD, { replace: true });
    } catch (err) {
      console.error('Registration request failed:', err);
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
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
            Create candidate profile
          </h2>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Start applying to premium positions and tracking pipelines.
          </p>
        </div>

        {/* Server errors list */}
        {serverError && (
          <div
            className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-xs font-medium text-rose-600 dark:text-rose-400"
            role="alert"
          >
            {serverError}
          </div>
        )}

        {/* Registration input form */}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4">
            {/* Full Name input */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-name"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  autoFocus
                  {...register('name')}
                  className="block w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus-visible:outline-none outline-none focus-ring"
                  placeholder="Priya Sharma"
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'register-name-error' : undefined}
                />
              </div>
              {errors.name && (
                <p id="register-name-error" className="text-[11px] font-medium text-rose-500">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-email"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="block w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus-visible:outline-none outline-none focus-ring"
                  placeholder="priya@example.com"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'register-email-error' : undefined}
                />
              </div>
              {errors.email && (
                <p id="register-email-error" className="text-[11px] font-medium text-rose-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label
                htmlFor="register-password"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password')}
                  className="block w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus-visible:outline-none outline-none focus-ring"
                  placeholder="••••••••"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  aria-describedby={errors.password ? 'register-password-error' : undefined}
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
                <p id="register-password-error" className="text-[11px] font-medium text-rose-500">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit register button wrapper */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-500 transition-all shadow-md focus-ring hover:scale-[1.01]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </div>
        </form>

        {/* Existing account reference link */}
        <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          <span>Already have an account? </span>
          <Link
            to={ROUTES.LOGIN}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline focus-ring rounded"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
