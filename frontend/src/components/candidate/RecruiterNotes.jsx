// ─── components/candidate/RecruiterNotes.jsx ───────────────────────────────────
// Reusable private recruiter notes section, with saving loader actions.

import React, { useState, useEffect } from 'react';
import { Clipboard, Save, Loader2 } from 'lucide-react';

export const RecruiterNotes = React.memo(function RecruiterNotes({
  notes = '',
  onSave,
  isPending = false,
}) {
  const [text, setText] = useState(notes);

  // Sync internal state when notes values resolve asynchronously from API queries
  useEffect(() => {
    setText(notes || '');
  }, [notes]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSave(text);
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm"
      noValidate
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <Clipboard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Private Recruiter Notes</span>
        </div>
        <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">
          Private to recruiters
        </span>
      </div>

      <div className="space-y-3">
        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Jot down notes about candidate background, communication quality, or HM feedback comments..."
          className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring"
          aria-label="Private Recruiter Notes description content"
        />

        <button
          type="submit"
          disabled={isPending || text === notes}
          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all focus-ring disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving Notes...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Private Notes</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
});
