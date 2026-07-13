// ─── components/candidate/ResumeViewer.jsx ─────────────────────────────────────
// Reusable component that displays candidate resumes and initiates authorized blob downloads.

import React, { useState } from 'react';
import { FileText, Download, Loader2 } from 'lucide-react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';

export const ResumeViewer = React.memo(function ResumeViewer({ applicationId, resumeUrl }) {
  const [isDownloading, setIsDownloading] = useState(false);

  // Extract filename from URL/path
  const resumeFilename = resumeUrl ? resumeUrl.split(/[/\\]/).pop() : 'resume.pdf';

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Axios request with blob response type to pass authorization headers automatically
      const response = await api.get(`/applications/${applicationId}/resume`, {
        responseType: 'blob',
      });

      // Map blob data to local link download
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resumeFilename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up DOM references
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
      toast.success('Resume download completed');
    } catch (err) {
      toast.error('Could not download resume file. Check authorization levels.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!resumeUrl) {
    return (
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-6 text-center space-y-2 shadow-sm">
        <FileText className="w-8 h-8 text-slate-350 mx-auto" />
        <h4 className="text-xs font-bold text-slate-705 dark:text-slate-200">
          No Resume Attached
        </h4>
        <p className="text-[11px] text-slate-400 dark:text-slate-450 leading-relaxed">
          The candidate did not upload any PDF resumes for this application.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm flex flex-col justify-between">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">
            {resumeFilename}
          </h4>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
            PDF Document
          </span>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-250 font-semibold text-xs shadow-sm transition-colors focus-ring disabled:opacity-50"
        type="button"
      >
        {isDownloading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Downloading...</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5" />
            <span>Download Resume</span>
          </>
        )}
      </button>
    </div>
  );
});
