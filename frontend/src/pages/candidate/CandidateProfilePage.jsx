// ─── pages/candidate/CandidateProfilePage.jsx ────────────────────────────────
// Candidate Profile Manager — Module 14.
//
// Data sources:
//   GET  /api/v1/auth/me        → user data from AuthContext (pre-loaded at startup)
//   PUT  /api/v1/users/profile  → update personal info / links (via sub-components)
//   POST /api/v1/users/resume   → resume upload (via ProfileResume)
//
// Architecture:
//   - Reads user from AuthContext; uses `updateUserProfile` + `refetchProfile` for
//     synchronizing auth state after successful mutations.
//   - Each section (Personal Info, Links, Resume) is a self-contained component
//     that owns its own mutation. The page coordinates them via `handleUpdate`.
//   - Profile completeness is derived client-side from the profile sub-document.
//
// Doc reference: Document 5 — API Design §9 / Document 8 — UI Pages § Candidate Profile

import { useCallback } from 'react';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { ProfilePersonalInfo } from '../../components/profile/ProfilePersonalInfo.jsx';
import { ProfileLinks } from '../../components/profile/ProfileLinks.jsx';
import { ProfileResume } from '../../components/profile/ProfileResume.jsx';
import { ProfileCompleteness } from '../../components/profile/ProfileCompleteness.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { User, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';

// ─── Avatar initials helper ───────────────────────────────────────────────────
function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Skeleton variant="rect" height="200px" />
        <Skeleton variant="rect" height="180px" />
        <Skeleton variant="rect" height="160px" />
      </div>
      <div className="space-y-6">
        <Skeleton variant="rect" height="220px" />
      </div>
    </div>
  );
}

export default function CandidateProfilePage() {
  const { user, isLoading, updateUserProfile, refetchProfile } = useAuth();

  // Called by each sub-component after a successful PUT /users/profile mutation.
  // Merges the updated user document back into AuthContext so all consuming
  // components (e.g. sidebar avatar) stay in sync without a full page refetch.
  const handleUpdate = useCallback(
    (updatedUser) => {
      if (updatedUser) {
        updateUserProfile(updatedUser);
      } else {
        // If the sub-component only has a partial profile update, re-fetch
        refetchProfile();
      }
    },
    [updateUserProfile, refetchProfile]
  );

  // Special handler for resume: POST /users/resume returns { resumeUrl, profile }
  // not the full user document, so we merge the profile manually.
  const handleResumeUpdate = useCallback(
    (partialProfile) => {
      if (user) {
        updateUserProfile({
          ...user,
          profile: { ...user.profile, ...partialProfile },
        });
      }
    },
    [user, updateUserProfile]
  );

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="My Profile" description="Manage your candidate profile details" />
        <div className="mt-6">
          <ProfileSkeleton />
        </div>
      </PageContainer>
    );
  }

  if (!user) return null;

  const profile = user.profile || {};

  return (
    <PageContainer>
      <PageHeader
        title="My Profile"
        description="Update your professional details, resume, and links visible to recruiters"
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Main column (2/3 width on large screens) ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity card (read-only — name and email come from auth) */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center font-bold text-lg text-indigo-600 dark:text-indigo-400 shrink-0 select-none">
                {getInitials(user.name)}
              </div>
              <div className="min-w-0 space-y-1">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-50 truncate">
                  {user.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span className="capitalize">{user.role}</span>
                  </span>
                  {user.createdAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Member since {format(new Date(user.createdAt), 'MMM yyyy')}
                    </span>
                  )}
                </div>
                {profile.headline && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-0.5">
                    {profile.headline}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Personal Info — editable */}
          <ProfilePersonalInfo profile={profile} onUpdate={handleUpdate} />

          {/* Social & Portfolio Links — editable */}
          <ProfileLinks profile={profile} onUpdate={handleUpdate} />

          {/* Resume — upload */}
          <ProfileResume profile={profile} onUpdate={handleResumeUpdate} />
        </div>

        {/* ── Sidebar column (1/3 width on large screens) ── */}
        <div className="space-y-6">
          <ProfileCompleteness profile={profile} />

          {/* Quick info panel */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Profile Tips
            </h3>
            <ul className="space-y-3">
              {[
                { tip: 'Add a headline so recruiters instantly understand your role.' },
                { tip: 'A detailed bio helps recruiters match you to roles.' },
                { tip: 'Upload a current resume — it is required to apply for jobs.' },
                { tip: 'Link your GitHub so recruiters can see your work directly.' },
                { tip: 'LinkedIn profile increases response rate significantly.' },
              ].map(({ tip }, i) => (
                <li key={i} className="flex gap-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
