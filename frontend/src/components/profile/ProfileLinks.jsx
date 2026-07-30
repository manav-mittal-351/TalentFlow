// ─── components/profile/ProfileLinks.jsx ─────────────────────────────────────
// Editable card for candidate social & portfolio links.
// Core fields (always shown): Portfolio, GitHub, LinkedIn.
// Extra fields: up to 6 free-form URL inputs, stored in the named backend slots.
// Submits via PUT /api/v1/users/profile.

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link2, Github, Linkedin, Globe, Pen, X, Check, Plus } from 'lucide-react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

// ─── Core platforms (always shown) ───────────────────────────────────────────
const CORE_PLATFORMS = [
  {
    key: 'portfolioUrl', label: 'Portfolio', Icon: Globe,
    placeholder: 'https://yourportfolio.com',
    hint: 'Include the full URL — e.g. https://yourportfolio.com',
    color: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    key: 'githubUrl', label: 'GitHub', Icon: Github,
    placeholder: 'https://github.com/yourusername',
    hint: 'Include your username — e.g. https://github.com/yourusername',
    color: 'text-slate-800 dark:text-slate-200',
  },
  {
    key: 'linkedinUrl', label: 'LinkedIn', Icon: Linkedin,
    placeholder: 'https://linkedin.com/in/yourusername',
    hint: 'Include your profile path — e.g. https://linkedin.com/in/yourusername',
    color: 'text-blue-600 dark:text-blue-400',
  },
];

// Backend field names used as anonymous extra-link storage slots (max 6)
const EXTRA_SLOTS = [
  'twitterUrl', 'leetcodeUrl', 'codechefUrl',
  'hackerrankUrl', 'behanceUrl', 'dribbbleUrl',
];

const ALL_KEYS = [...CORE_PLATFORMS.map(p => p.key), ...EXTRA_SLOTS];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const inputClass =
  'w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all';

const inputErrorClass =
  'w-full rounded-xl border border-red-400 dark:border-red-600 bg-red-50 dark:bg-red-950/20 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-all';

const buildForm = (profile = {}) =>
  Object.fromEntries(ALL_KEYS.map(key => [key, profile?.[key] || '']));

/** How many extra slots have saved values */
const countSavedExtras = (profile = {}) =>
  EXTRA_SLOTS.filter(k => profile?.[k]).length;

// ─── Sub-components ──────────────────────────────────────────────────────────

function CoreLinkField({ label, Icon, value, onChange, placeholder, hint, error }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={error ? inputErrorClass : inputClass}
        autoComplete="url"
        spellCheck={false}
      />
      {error
        ? <p className="text-[11px] text-red-500 font-medium">{error}</p>
        : hint && <p className="text-[11px] text-slate-400">{hint}</p>
      }
    </div>
  );
}

function ExtraLinkField({ index, value, onChange, onRemove, error }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <Link2 className="w-3.5 h-3.5" />
          Link {index + 1}
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-0.5 text-[11px] text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <X className="w-3 h-3" />
          Remove
        </button>
      </div>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="https://..."
        className={error ? inputErrorClass : inputClass}
        autoComplete="url"
        spellCheck={false}
      />
      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}

function DisplayLink({ Icon, href, color }) {
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
      <span className="truncate max-w-xs">{href}</span>
    </a>
  );
}

function ExtraDisplayLink({ href }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-2 transition-colors"
    >
      <Link2 className="w-4 h-4 shrink-0" />
      <span className="truncate max-w-xs">{href}</span>
    </a>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfileLinks({ profile, onUpdate }) {
  const [editing, setEditing]           = useState(false);
  const [form, setForm]                 = useState(() => buildForm(profile));
  const [fieldErrors, setFieldErrors]   = useState({});
  // How many extra link inputs are currently shown (0–6)
  const [extraCount, setExtraCount]     = useState(() => Math.max(countSavedExtras(profile), 0));

  useEffect(() => {
    if (!editing) {
      setForm(buildForm(profile));
      setFieldErrors({});
      setExtraCount(Math.max(countSavedExtras(profile), 0));
    }
  }, [profile, editing]);

  const mutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', data),
    onSuccess: (res) => {
      onUpdate(res.data.data);
      setEditing(false);
      setFieldErrors({});
      toast.success('Links updated');
    },
    onError: (err) => {
      const responseData = err.response?.data;
      if (responseData?.errors?.length) {
        const errs = {};
        responseData.errors.forEach(({ field, message }) => { errs[field] = message; });
        setFieldErrors(errs);
        toast.error('Please fix the highlighted fields');
      } else {
        toast.error(responseData?.message || 'Failed to update links');
      }
    },
  });

  const handleCancel = () => {
    setForm(buildForm(profile));
    setFieldErrors({});
    setExtraCount(Math.max(countSavedExtras(profile), 0));
    setEditing(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFieldErrors({});
    mutation.mutate(form);
  };

  const setField = (key) => (e) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  /** Add a new blank extra link slot */
  const addExtraLink = () => {
    if (extraCount < EXTRA_SLOTS.length) setExtraCount(n => n + 1);
  };

  /** Remove extra link at position i — shifts remaining values down */
  const removeExtraLink = (i) => {
    setForm(f => {
      const updated = { ...f };
      // Shift values: slot[i] = slot[i+1], ..., last slot becomes ''
      for (let j = i; j < extraCount - 1; j++) {
        updated[EXTRA_SLOTS[j]] = f[EXTRA_SLOTS[j + 1]];
      }
      updated[EXTRA_SLOTS[extraCount - 1]] = '';
      return updated;
    });
    setExtraCount(n => n - 1);
  };

  const canAddMore = extraCount < EXTRA_SLOTS.length;

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Card header — action buttons always visible */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Social &amp; Portfolio Links
          </h3>
        </div>

        {editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              type="submit"
              form="links-form"
              disabled={mutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-200 dark:shadow-indigo-900/30 transition-all disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              {mutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : (
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
          <form id="links-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Core platforms */}
            {CORE_PLATFORMS.map(({ key, label, Icon, placeholder, hint }) => (
              <CoreLinkField
                key={key}
                label={label}
                Icon={Icon}
                value={form[key]}
                onChange={setField(key)}
                placeholder={placeholder}
                hint={hint}
                error={fieldErrors[key]}
              />
            ))}

            {/* Extra free-form link inputs */}
            {Array.from({ length: extraCount }, (_, i) => (
              <ExtraLinkField
                key={EXTRA_SLOTS[i]}
                index={i}
                value={form[EXTRA_SLOTS[i]]}
                onChange={setField(EXTRA_SLOTS[i])}
                onRemove={() => removeExtraLink(i)}
                error={fieldErrors[EXTRA_SLOTS[i]]}
              />
            ))}

            {/* Add more links button */}
            {canAddMore && (
              <button
                type="button"
                onClick={addExtraLink}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 border border-dashed border-indigo-300 dark:border-indigo-700/60 rounded-xl px-4 py-2.5 w-full justify-center hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-400 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add more links
              </button>
            )}
          </form>
        ) : (
          <div className="space-y-4">
            {/* Core platforms: always shown */}
            {CORE_PLATFORMS.map(({ key, Icon, label, color }) => (
              <DisplayLink
                key={key}
                Icon={Icon}
                href={profile?.[key]}
                label={label}
                color={color}
              />
            ))}
            {/* Extra links: only shown when saved */}
            {EXTRA_SLOTS.filter(k => profile?.[k]).map((k, i) => (
              <ExtraDisplayLink key={k} href={profile[k]} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
