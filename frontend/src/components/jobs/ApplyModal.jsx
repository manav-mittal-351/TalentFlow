// ─── components/jobs/ApplyModal.jsx ──────────────────────────────────────────
// Candidate application submission modal supporting cover letter and optional
// or required resume file uploads.

import React, { useState } from 'react';
import { X, Upload, FileText, AlertTriangle, Loader2 } from 'lucide-react';

export const ApplyModal = React.memo(function ApplyModal({
  job,
  user,
  onClose,
  onSubmit,
  isPending = false,
}) {
  const [coverNote, setCoverNote] = useState('');
  const [resumeMode, setResumeMode] = useState(
    user?.profile?.resumeUrl ? 'profile' : 'upload'
  );
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');

  const hasProfileResume = !!user?.profile?.resumeUrl;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFileError('');
    if (!selected) {
      setFile(null);
      return;
    }

    // Limit to PDF or Word documents
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(selected.type)) {
      setFileError('Please select a valid PDF, DOC, or DOCX document.');
      setFile(null);
      return;
    }

    // 5MB max file size
    if (selected.size > 5 * 1024 * 1024) {
      setFileError('File size must be under 5MB.');
      setFile(null);
      return;
    }

    setFile(selected);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (resumeMode === 'upload' && !file) {
      setFileError('A resume document is required to submit your application.');
      return;
    }

    // Prepare FormData payload for multipart upload
    const formData = new FormData();
    formData.append('coverNote', coverNote.trim());
    if (resumeMode === 'upload' && file) {
      formData.append('resume', file);
    }

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 space-y-5 shadow-xl animate-in scale-in duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              <h3 id="modal-title" className="text-sm font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400">
                Submit Application
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Apply to <span className="font-bold text-slate-700 dark:text-slate-250">{job.title}</span> at {job.company?.name || 'TalentFlow'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 p-1 rounded-lg focus-ring"
              aria-label="Close modal"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs" noValidate>
            
            {/* Resume Selection */}
            <div className="space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                Resume Document *
              </span>

              {hasProfileResume ? (
                <div className="space-y-3">
                  {/* Select profile resume */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    resumeMode === 'profile'
                      ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10'
                      : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}>
                    <input
                      type="radio"
                      name="resumeMode"
                      value="profile"
                      checked={resumeMode === 'profile'}
                      onChange={() => setResumeMode('profile')}
                      className="mt-0.5 text-indigo-650 border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        Use profile resume
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {user.profile.resumeUrl.split('/').pop()}
                      </p>
                    </div>
                  </label>

                  {/* Upload new option */}
                  <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    resumeMode === 'upload'
                      ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10'
                      : 'border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}>
                    <input
                      type="radio"
                      name="resumeMode"
                      value="upload"
                      checked={resumeMode === 'upload'}
                      onChange={() => setResumeMode('upload')}
                      className="mt-0.5 text-indigo-650 border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20"
                    />
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        Upload a new resume
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Supported: PDF, DOC, DOCX up to 5MB
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3 flex gap-2.5 items-start text-amber-800 dark:text-amber-400 mb-2 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <span className="font-bold block">No resume on profile</span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-500 font-medium mt-0.5">
                      Please upload a resume file to complete this application. You can also save a resume permanently on your profile.
                    </span>
                  </div>
                </div>
              )}

              {/* Upload Input Area */}
              {resumeMode === 'upload' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-350 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-slate-400 mb-2 animate-pulse" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {file ? file.name : 'Select resume file'}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          PDF, DOC, or DOCX (Max. 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {fileError && (
                    <p className="text-[11px] font-semibold text-rose-550 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{fileError}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Cover Note */}
            <div className="space-y-1.5">
              <label htmlFor="coverNote" className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Cover Letter / Message to Recruiter (Optional)</span>
              </label>
              <textarea
                id="coverNote"
                rows={5}
                maxLength={2000}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Describe why you are a great fit for this role..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring leading-relaxed"
              />
              <div className="flex justify-end text-[10px] font-medium text-slate-400">
                {coverNote.length}/2000 characters
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-250 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors focus-ring"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition-transform hover:scale-[1.01] focus-ring disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Application</span>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
});
