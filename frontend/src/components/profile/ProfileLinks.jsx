// ─── components/profile/ProfileLinks.jsx ─────────────────────────────────────
// Editable card for candidate portfolio, GitHub, and LinkedIn links.
// Submits via PUT /api/v1/users/profile (fields: portfolioUrl, githubUrl, linkedinUrl).
// Doc reference: Document 5 — API Design §9 (User / Profile Routes)

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link2, Github, Linkedin, Globe, Pen, X, Check } from 'lucide-react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

const inputClass =
  'w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all';

function LinkField({ label, icon: Icon, value, onChange, placeholder, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </label>
      <input
        type="url"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputClass}
      />
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

function DisplayLink({ icon: Icon, href, label, color }) {
  if (!href) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400 italic">
        <Icon className="w-4 h-4 shrink-0" />
        <span>Not provided</span>
      </div>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={`flex items-center gap-2 text-sm font-medium ${color} hover:underline underline-offset-2 transition-colors`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate max-w-xs">{label || href}</span>
    </a>
  );
}

export function ProfileLinks({ profile, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    portfolioUrl: profile?.portfolioUrl || '',
    githubUrl:    profile?.githubUrl    || '',
    linkedinUrl:  profile?.linkedinUrl  || '',
  });

  useEffect(() => {
    if (!editing) {
      setForm({
        portfolioUrl: profile?.portfolioUrl || '',
        githubUrl:    profile?.githubUrl    || '',
        linkedinUrl:  profile?.linkedinUrl  || '',
      });
    }
  }, [profile, editing]);

  const mutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', data),
    onSuccess: (res) => {
      onUpdate(res.data.data);
      setEditing(false);
      toast.success('Links updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update links');
    },
  });

  const handleCancel = () => {
    setForm({
      portfolioUrl: profile?.portfolioUrl || '',
      githubUrl:    profile?.githubUrl    || '',
      linkedinUrl:  profile?.linkedinUrl  || '',
    });
    setEditing(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Social &amp; Portfolio Links
          </h3>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <Pen className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
      </div>

      <div className="p-6">
        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <LinkField
              label="Portfolio"
              icon={Globe}
              value={form.portfolioUrl}
              onChange={(e) => setForm((f) => ({ ...f, portfolioUrl: e.target.value }))}
              placeholder="https://yourportfolio.com"
              hint="Must start with https://"
            />
            <LinkField
              label="GitHub"
              icon={Github}
              value={form.githubUrl}
              onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))}
              placeholder="https://github.com/yourusername"
              hint="Must be a valid github.com URL"
            />
            <LinkField
              label="LinkedIn"
              icon={Linkedin}
              value={form.linkedinUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkedinUrl: e.target.value }))}
              placeholder="https://linkedin.com/in/yourusername"
              hint="Must be a valid linkedin.com URL"
            />
            <div className="flex justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCancel}
                disabled={mutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30 transition-all disabled:opacity-60"
              >
                <Check className="w-3.5 h-3.5" />
                {mutation.isPending ? 'Saving…' : 'Save Links'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <DisplayLink
              icon={Globe}
              href={profile?.portfolioUrl}
              label="Portfolio"
              color="text-indigo-600 dark:text-indigo-400"
            />
            <DisplayLink
              icon={Github}
              href={profile?.githubUrl}
              label="GitHub"
              color="text-slate-800 dark:text-slate-200"
            />
            <DisplayLink
              icon={Linkedin}
              href={profile?.linkedinUrl}
              label="LinkedIn"
              color="text-blue-600 dark:text-blue-400"
            />
          </div>
        )}
      </div>
    </div>
  );
}
