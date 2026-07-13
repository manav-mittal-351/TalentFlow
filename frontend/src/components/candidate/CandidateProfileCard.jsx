// ─── components/candidate/CandidateProfileCard.jsx ─────────────────────────────
// Reusable profile card displaying candidate biography details, location, and skills.

import React from 'react';
import { Mail, MapPin, Briefcase, GraduationCap } from 'lucide-react';

export const CandidateProfileCard = React.memo(function CandidateProfileCard({ candidate }) {
  const name = candidate?.name || 'Unknown Candidate';
  const email = candidate?.email || '';
  const profile = candidate?.profile || {};
  const headline = profile.headline || 'No professional headline provided';
  const location = profile.location || 'Location unspecified';
  const skills = profile.skills || [];
  const experience = profile.experience || [];
  const education = profile.education || [];

  const getInitials = () => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-6 shadow-sm">
      
      {/* 1. Header Bio Info */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center font-bold text-lg text-indigo-650 dark:text-indigo-400 shrink-0">
          {getInitials()}
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-55 block">
            {name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-405 leading-relaxed font-semibold">
            {headline}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              <span>{email}</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{location}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Skills Tag list */}
      <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Skills & Focus Areas
        </h4>
        {skills.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">No skills listed</p>
        ) : (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-1 text-[10px] font-bold bg-slate-50 dark:bg-slate-950 text-slate-650 dark:text-slate-350 border border-slate-150 dark:border-slate-850 rounded-lg hover:border-slate-300 transition-colors"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. Experience timeline segment */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Professional Experience</span>
        </div>
        {experience.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">No experience history listed</p>
        ) : (
          <div className="space-y-3.5">
            {experience.map((exp, i) => (
              <div key={i} className="text-xs space-y-1 relative pl-3 border-l-2 border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {exp.title}
                </span>
                <span className="text-[11px] text-slate-550 dark:text-slate-400 block font-semibold">
                  {exp.company} · {exp.startDate ? exp.startDate.split('T')[0] : 'Start'} to {exp.current ? 'Present' : (exp.endDate ? exp.endDate.split('T')[0] : 'End')}
                </span>
                {exp.description && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed pt-0.5">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Education segment */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Education Background</span>
        </div>
        {education.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">No education history listed</p>
        ) : (
          <div className="space-y-3.5">
            {education.map((edu, i) => (
              <div key={i} className="text-xs space-y-0.5 relative pl-3 border-l-2 border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {edu.degree} in {edu.fieldOfStudy}
                </span>
                <span className="text-[11px] text-slate-550 dark:text-slate-400 block font-semibold">
                  {edu.school} · Class of {edu.gradYear || 'N/A'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
});
