// ─── components/profile/ProfilePersonalInfo.jsx ──────────────────────────────
// Editable card for candidate personal info fields.
// Submits via PUT /api/v1/users/profile (fields: headline, bio, phone, location).
// Doc reference: Document 5 — API Design §9 (User / Profile Routes)

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, MapPin, Phone, FileText, Pen, X, Check } from 'lucide-react';
import { cn } from '../../utils/cn.js';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

function Field({ label, icon: Icon, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all';

export function ProfilePersonalInfo({ profile, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    headline:  profile?.headline  || '',
    bio:       profile?.bio       || '',
    phone:     profile?.phone     || '',
    location:  profile?.location  || '',
  });

  // Re-sync form when profile changes externally (e.g. after refetch)
  useEffect(() => {
    if (!editing) {
      setForm({
        headline:  profile?.headline  || '',
        bio:       profile?.bio       || '',
        phone:     profile?.phone     || '',
        location:  profile?.location  || '',
      });
    }
  }, [profile, editing]);

  const mutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', data),
    onSuccess: (res) => {
      onUpdate(res.data.data);
      setEditing(false);
      toast.success('Personal info updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleCancel = () => {
    setForm({
      headline:  profile?.headline  || '',
      bio:       profile?.bio       || '',
      phone:     profile?.phone     || '',
      location:  profile?.location  || '',
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
          <User className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Personal Information
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
            <Field label="Professional Headline" icon={FileText}>
              <input
                type="text"
                maxLength={150}
                value={form.headline}
                onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                placeholder="e.g. Senior React Developer at Acme Co."
                className={inputClass}
              />
              <p className="text-[11px] text-slate-400 text-right">
                {form.headline.length}/150
              </p>
            </Field>

            <Field label="Bio" icon={FileText}>
              <textarea
                maxLength={1000}
                rows={4}
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell recruiters about yourself, your experience, and what you're looking for..."
                className={cn(inputClass, 'resize-none')}
              />
              <p className="text-[11px] text-slate-400 text-right">
                {form.bio.length}/1000
              </p>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Phone" icon={Phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  className={inputClass}
                />
              </Field>

              <Field label="Location" icon={MapPin}>
                <input
                  type="text"
                  maxLength={100}
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="San Francisco, CA"
                  className={inputClass}
                />
              </Field>
            </div>

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
                {mutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            {/* Read-only view */}
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Headline</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                {profile?.headline || <span className="text-slate-400 italic">Not provided</span>}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bio</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                {profile?.bio || <span className="text-slate-400 italic">Not provided</span>}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {profile?.phone || <span className="text-slate-400 italic">Not provided</span>}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Location
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                  {profile?.location || <span className="text-slate-400 italic">Not provided</span>}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
