// ─── pages/public/HomePage.jsx ────────────────────────────────────────────────
// Premium startup landing page. Renders Hero mesh grids, modular features cards,
// pipeline stage vectors, live job boards queries, and accordion FAQs.
// Document reference: Document 8 — UI Pages § Page 1 Home / Landing

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ROUTES } from '../../constants/routes.js';
import { JobCard } from '../../components/jobs/JobCard.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { cn } from '../../utils/cn.js';
import api from '../../services/api.js';
import {
  Compass,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Search,
  CheckCircle2,
  Calendar,
  Users,
  Lock,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

// FAQ Array Definition
const FAQS = [
  {
    q: 'What is TalentFlow?',
    a: 'TalentFlow is a premium, full-stack recruitment platform designed to coordinate candidates, hiring managers, and recruiters in a single, unified workspace flow.',
  },
  {
    q: 'How do I apply for jobs?',
    a: 'Candidates can browse open positions on our public board, register an account, upload their resumes, and apply directly to any active listing with a single click.',
  },
  {
    q: 'Can I track my application status?',
    a: 'Yes, candidates have access to a visual timeline detailing their status as they move from Applied, to Shortlisted, Interviewing, and Hired.',
  },
  {
    q: 'How do hiring managers submit scorecards?',
    a: 'Hiring managers are assigned review tasks and can evaluate candidates by submitting scorecard reviews directly in their private department workspaces.',
  },
  {
    q: 'Is my resume data secure?',
    a: 'Absolutely. TalentFlow implements role-based access control and secure JWT authentication. Recruiters can only access candidates applying to active job roles.',
  },
];

export default function HomePage() {
  const shouldReduceMotion = useReducedMotion();
  const [activeFaq, setActiveFaq] = useState(null);

  // 1. Fetch 3 published jobs from the database using TanStack Query
  const {
    data: jobsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['latestJobs'],
    queryFn: async () => {
      const response = await api.get('/jobs', {
        params: { page: 1, limit: 3, status: 'published' },
      });
      return response.data?.data || [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const toggleFaq = (idx) => {
    setActiveFaq((prev) => (prev === idx ? null : idx));
  };

  // Animation Constants (Supports prefers-reduced-motion)
  const fadeUpVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      
      {/* ────────────────── SECTION 1: HERO ────────────────── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-16 px-4 md:px-8 border-b border-slate-200/50 dark:border-slate-800/50">
        {/* Animated Mesh Gradient Background wrapper */}
        <div className="absolute inset-0 z-0 opacity-30 dark:opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-400 blur-[120px] dark:bg-indigo-900 animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-400 blur-[120px] dark:bg-cyan-900 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero text panel (Glassmorphism design) */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUpVariants}
            className="lg:col-span-7 space-y-6 text-left max-w-2xl"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Recruitment Platform</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.1]">
              Hire Smarter. <br />
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400 bg-clip-text text-transparent">
                Move Faster.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-350 max-w-lg leading-relaxed">
              TalentFlow streamlines your entire hiring lifecycle. Connect recruiters, candidates, and hiring managers under a single, unified database system.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to={ROUTES.JOBS}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all focus-ring hover:scale-[1.02] shadow-md shadow-indigo-100 dark:shadow-none"
              >
                Browse Open Roles
              </Link>
              <Link
                to={ROUTES.LOGIN}
                className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all focus-ring hover:scale-[1.02]"
              >
                Post a Job →
              </Link>
            </div>
          </motion.div>

          {/* Hero pipeline diagram card */}
          <motion.div
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="lg:col-span-5 hidden lg:block"
          >
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-xl max-w-sm mx-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Pipeline Mockup
                </span>
              </div>
              
              {/* Fake pipeline stages wrapper cards */}
              {[
                { title: 'Applied', count: 18, color: 'border-l-indigo-500 bg-indigo-500/5' },
                { title: 'Interviewing', count: 4, color: 'border-l-amber-500 bg-amber-500/5' },
                { title: 'Hired', count: 2, color: 'border-l-emerald-500 bg-emerald-500/5' },
              ].map((stage, i) => (
                <div
                  key={i}
                  className={cn(
                    'p-3 border-l-4 rounded-r-xl border-y border-r border-slate-150/70 dark:border-slate-800 flex items-center justify-between',
                    stage.color
                  )}
                >
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">
                    {stage.title}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {stage.count}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ────────────────── SECTION 2: FEATURES ────────────────── */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUpVariants}
          className="text-center max-w-3xl mx-auto space-y-3 mb-16"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Workspaces Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Everything your team needs to hire well
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            TalentFlow integrates specialized portals for every user persona involved in the recruitment lifecycle.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              title: 'Easy Apply',
              desc: 'Candidates submit applications and upload resume files with absolute simplicity.',
              icon: Compass,
              color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
            },
            {
              title: 'Pipeline Tracking',
              desc: 'Recruiters manage candidate workflow stages through fully interactive status updates.',
              icon: TrendingUp,
              color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30',
            },
            {
              title: 'Interview Scheduling',
              desc: 'Schedule virtual or in-person evaluation sessions and sync calendar statuses.',
              icon: Calendar,
              color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30',
            },
            {
              title: 'Status Visibility',
              desc: 'Dynamic timelines show candidates exactly where they stand in real time.',
              icon: CheckCircle2,
              color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
            },
            {
              title: 'Team Collaboration',
              desc: 'Hiring managers submit scorecard evaluations directly to coordinate decisions.',
              icon: Users,
              color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30',
            },
            {
              title: 'Role-Based Access',
              desc: 'Secure permission checks restrict databases based on recruiters, managers, or candidates.',
              icon: Lock,
              color: 'text-slate-500 bg-slate-100 dark:bg-slate-800/40',
            },
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUpVariants}
                whileHover={shouldReduceMotion ? {} : { y: -4 }}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all shadow-sm"
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-5', feat.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-2">
                  {feat.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* ────────────────── SECTION 3: PIPELINE ILLUSTRATION ────────────────── */}
      <section className="bg-slate-100/50 dark:bg-slate-900/30 border-y border-slate-200/50 dark:border-slate-800/50 py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariants}
            className="text-center max-w-2xl mx-auto mb-16 space-y-3"
          >
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Simple Recruitment Flows
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Watch applicants progress seamlessly from initial profile creation to hired staff.
            </p>
          </motion.div>

          {/* Staggered Horizontal Cards Grid */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { step: '01', title: 'Apply', detail: 'Candidates register profile files.' },
              { step: '02', title: 'Review', detail: 'Recruiters inspect resumes.' },
              { step: '03', title: 'Interview', detail: 'Hiring managers submit reviews.' },
              { step: '04', title: 'Hire', detail: 'Pipeline processes offers.' },
            ].map((card, i) => (
              <motion.div
                key={i}
                variants={fadeUpVariants}
                className="relative p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between min-h-[140px]"
              >
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                    Step {card.step}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 mt-1">
                    {card.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {card.detail}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ────────────────── SECTION 4: LATEST JOBS (REAL DATA) ────────────────── */}
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Careers Board
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Currently Hiring
            </h2>
          </div>
          <Link
            to={ROUTES.JOBS}
            className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors focus-ring rounded"
          >
            <span>See All Jobs</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dynamic Fetch State Resolution */}
        {isLoading ? (
          /* Loading skeletons */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton variant="circular" width="40px" height="40px" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60px" height="12px" />
                    <Skeleton variant="text" width="140px" height="16px" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton variant="text" width="60px" height="18px" className="rounded-full" />
                  <Skeleton variant="text" width="60px" height="18px" className="rounded-full" />
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                  <Skeleton variant="text" width="90px" height="16px" />
                  <Skeleton variant="text" width="60px" height="16px" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          /* Error state handles failures gracefully */
          <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/10 flex flex-col items-center justify-center text-center gap-3 max-w-md mx-auto">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Failed to load current jobs
            </h3>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl shadow-sm focus-ring transition-transform hover:scale-[1.01]"
              type="button"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry connection</span>
            </button>
          </div>
        ) : jobsData.length === 0 ? (
          /* Empty Database state */
          <div className="p-10 rounded-2xl border border-slate-250 dark:border-slate-800 text-center space-y-3 bg-white dark:bg-slate-900 max-w-lg mx-auto shadow-sm">
            <Search className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No Active Openings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
              There are no published postings registered in the database at the moment. Populate the registry profiles to view them live on this dashboard.
            </p>
          </div>
        ) : (
          /* Render real Job Cards */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {jobsData.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* ────────────────── SECTION 5: FAQ ACCORDION ────────────────── */}
      <section className="bg-slate-100/50 dark:bg-slate-900/30 border-t border-slate-200/50 dark:border-slate-800/50 py-20 px-4 md:px-8">
        <div className="max-w-3xl mx-auto w-full">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUpVariants}
            className="text-center mb-16 space-y-2"
          >
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Quick answers to common questions about the TalentFlow platform.
            </p>
          </motion.div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isExpanded = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-semibold text-slate-900 dark:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors focus-ring"
                    aria-expanded={isExpanded}
                    type="button"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-slate-400 transition-transform duration-200',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      height: isExpanded ? 'auto' : 0,
                      opacity: isExpanded ? 1 : 0,
                    }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50/50 dark:bg-slate-900/30">
                      {faq.a}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ────────────────── SECTION 6: CTA BANNER ────────────────── */}
      <section className="bg-gradient-to-br from-indigo-700 to-indigo-900 dark:from-indigo-950 dark:to-slate-950 text-white py-16 px-4 md:px-8 text-center border-t border-slate-200/50 dark:border-slate-800/50">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUpVariants}
          className="max-w-2xl mx-auto space-y-6"
        >
          <h2 className="text-3xl font-extrabold tracking-tight">
            Ready to build your team?
          </h2>
          <p className="text-indigo-100 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Create a profile and streamline your recruitment pipeline today.
          </p>
          <div className="pt-2">
            <Link
              to={ROUTES.REGISTER}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white text-indigo-950 font-bold hover:bg-indigo-50 shadow-lg hover:scale-105 transition-all focus-ring text-sm"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 text-indigo-700" />
            </Link>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
