// ─── components/profile/ProfileResume.jsx ────────────────────────────────────
// Resume upload card. Handles two cases:
//   1. Candidate already has a resumeUrl → display download link (default).
//   2. No resume → require upload via POST /api/v1/users/resume (multipart/form-data).
// Doc reference: Document 5 — API Design §9 (POST /users/resume)

import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FileText, Upload, DownloadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

export function ProfileResume({ profile, onUpdate }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const resumeUrl = profile?.resumeUrl || '';

  const mutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('resume', file);
      return api.post('/users/resume', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (res) => {
      onUpdate({ ...profile, resumeUrl: res.data.data.resumeUrl });
      toast.success('Resume uploaded successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to upload resume');
    },
  });

  const handleFile = (file) => {
    if (!file) return;
    if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      toast.error('Only PDF, DOC, or DOCX files are accepted');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5 MB');
      return;
    }
    mutation.mutate(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    handleFile(e.target.files[0]);
    e.target.value = '';
  };

  // Derive a display filename from the path stored in DB (uploads/resumes/filename.pdf)
  const displayName = resumeUrl
    ? resumeUrl.split('/').pop()
    : null;

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
        <FileText className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Resume</h3>
      </div>

      <div className="p-6 space-y-4">
        {/* Existing resume */}
        {resumeUrl && (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                {displayName}
              </span>
            </div>
            <a
              href={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}/${resumeUrl}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 transition-colors"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              View
            </a>
          </div>
        )}

        {/* No resume warning */}
        {!resumeUrl && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
              No resume uploaded yet. Upload one to complete your profile and allow recruiters to download it.
            </p>
          </div>
        )}

        {/* Drop zone */}
        <div
          className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all cursor-pointer p-8
            ${dragging
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
              : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/20'}
            ${mutation.isPending ? 'pointer-events-none opacity-60' : ''}
          `}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="sr-only"
            onChange={handleChange}
          />
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center">
            <Upload className="w-4.5 h-4.5 text-indigo-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {mutation.isPending
                ? 'Uploading…'
                : resumeUrl
                ? 'Replace resume'
                : 'Upload your resume'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Drag &amp; drop or click to browse — PDF, DOC, DOCX (max 5 MB)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
