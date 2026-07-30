// ─── pages/public/RegisterPage.jsx ───────────────────────────────────────────
// Multi-role registration interface (Candidate, Recruiter, Hiring Manager).
// Integrates interactive role selection cards, React Hook Form + Zod validations,
// live API registration, and automatic role-specific dashboard redirects.

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { registerSchema } from '../../utils/validators.js';
import { ROUTES } from '../../constants/routes.js';
import { ROLES, DEPARTMENTS } from '../../constants/roles.js';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Building,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import Logo from '../../components/common/Logo.jsx';
import { getRoleDashboard } from '../../utils/routePermissions.js';

const ROLE_OPTIONS = [
  {
    id: ROLES.CANDIDATE,
    title: 'Candidate',
    tagline: 'Job Seeker & Applicant',
    description: 'Apply for jobs, track applications, and manage your professional profile.',
    features: ['1-Click Job Applications', 'Real-time Status Timeline', 'Resume Profile Manager'],
    icon: User,
  },
  {
    id: ROLES.RECRUITER,
    title: 'Recruiter',
    tagline: 'Talent Acquisition & HR',
    description: 'Post jobs, review applications, manage candidates, and schedule interviews.',
    features: ['Vacancy & Job Manager', 'Kanban Candidate Pipeline', 'Interview Scheduler'],
    icon: Building,
  },
  {
    id: ROLES.HIRING_MANAGER,
    title: 'Hiring Manager',
    tagline: 'Department Lead & Reviewer',
    description: 'Review shortlisted candidates, participate in hiring decisions, and manage interviews.',
    features: ['Department Queue Scoping', 'Scorecard Evaluations', 'Interview Recommendations'],
    icon: UserCheck,
  },
];

export default function RegisterPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // URL query parameter pre-selection e.g. /register?role=recruiter
  const initialRoleParam = searchParams.get('role');
  const validInitialRole = [ROLES.CANDIDATE, ROLES.RECRUITER, ROLES.HIRING_MANAGER].includes(initialRoleParam)
    ? initialRoleParam
    : null;

  const [selectedRole, setSelectedRole] = useState(validInitialRole);
  const [step, setStep] = useState(validInitialRole ? 2 : 1);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: validInitialRole || ROLES.CANDIDATE,
      department: '',
    },
  });

  // Keep form role in sync with selectedRole state
  useEffect(() => {
    if (selectedRole) {
      setValue('role', selectedRole);
    }
  }, [selectedRole, setValue]);

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setValue('role', roleId);
    setStep(2);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setServerError('');
    try {
      // Purge any old session tokens before submitting registration
      logout();

      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: selectedRole,
        department: selectedRole === ROLES.HIRING_MANAGER ? data.department || 'Engineering' : undefined,
      };

      const response = await api.post('/auth/register', payload);
      const { token, user } = response.data.data;

      // Update active AuthContext session
      login(token, user);
      toast.success(`Account created! Welcome as ${user.role.replace('_', ' ')}.`);

      // Route redirection matching user role dashboard
      navigate(getRoleDashboard(user.role), { replace: true });
    } catch (err) {
      console.error('Registration request failed:', err);
      const errMsg = err.response?.data?.message || 'We couldn\'t create your account. Please try again.';
      setServerError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[85vh] px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      
      {/* ── STEP 1: CHOOSE YOUR ROLE ── */}
      {step === 1 && (
        <div className="w-full max-w-5xl mx-auto space-y-8">
          {/* Header Title Section */}
          <div className="text-center space-y-2.5 max-w-xl mx-auto">
            <Logo size="xl" showText={false} className="justify-center mb-2" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Choose Your Account Type
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Select how you would like to use TalentFlow to get started.
            </p>
          </div>

          {/* Role Cards Grid — Equal height cards with aligned buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch pt-2">
            {ROLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.id}
                  className="group relative h-full flex flex-col justify-between p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-800/60 shadow-sm hover:shadow-md transition-all duration-200 cursor-default"
                >
                  {/* Upper Content Section */}
                  <div className="flex-1 flex flex-col justify-between space-y-5">
                    <div className="space-y-4">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0 select-none">
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Title & Tagline */}
                      <div className="space-y-0.5">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                          {option.title}
                        </h3>
                        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                          {option.tagline}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed min-h-[2.5rem]">
                        {option.description}
                      </p>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                      {option.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-350 select-none">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Bottom Action Button — Uniform vertical height across all cards */}
                  <div className="pt-6 mt-auto shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRoleSelect(option.id);
                      }}
                      aria-label={`Continue as ${option.title}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] cursor-pointer transition-all shadow-sm focus-ring"
                    >
                      <span>Continue as {option.title}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Link */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
            <span>Already have an account? </span>
            <Link
              to={ROUTES.LOGIN}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline focus-ring rounded"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}

      {/* ── STEP 2: REGISTRATION FORM ── */}
      {step === 2 && (
        <div className="w-full max-w-md mx-auto space-y-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card transition-colors duration-200">
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 focus-ring rounded"
              type="button"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Role</span>
            </button>

            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
              <span className="capitalize">{selectedRole?.replace('_', ' ')} Account</span>
            </span>
          </div>

          {/* Header Heading */}
          <div className="text-center">
            <Logo size="lg" showText={false} className="justify-center mb-3" />

            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Create your account
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              Enter your details to register as a <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">{selectedRole?.replace('_', ' ')}</span>.
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
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-3.5">
              
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
                    className="block w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none focus-ring"
                    placeholder="Priya Sharma"
                    aria-invalid={errors.name ? 'true' : 'false'}
                  />
                </div>
                {errors.name && (
                  <p className="text-[11px] font-medium text-rose-500">
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
                    className="block w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none focus-ring"
                    placeholder="priya@example.com"
                    aria-invalid={errors.email ? 'true' : 'false'}
                  />
                </div>
                {errors.email && (
                  <p className="text-[11px] font-medium text-rose-500">
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
                    className="block w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none focus-ring"
                    placeholder="••••••••"
                    aria-invalid={errors.password ? 'true' : 'false'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus-ring rounded-lg"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] font-medium text-rose-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Department selector (Hiring Manager only) */}
              {selectedRole === ROLES.HIRING_MANAGER && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="register-department"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Department Scope
                  </label>
                  <select
                    id="register-department"
                    {...register('department')}
                    className="block w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none focus-ring"
                  >
                    <option value="" className="dark:bg-slate-900">Select Department...</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept} className="dark:bg-slate-900">
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Submit register button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 transition-all shadow-md focus-ring hover:scale-[1.01]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Complete Registration</span>
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
      )}

    </div>
  );
}
