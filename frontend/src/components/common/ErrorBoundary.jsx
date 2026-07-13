// ─── components/common/ErrorBoundary.jsx ──────────────────────────────────────
// React class component intercepting client-side scripting crashes.

import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Under production, pipe events to remote error monitors (Sentry / PostHog)
    console.error('ErrorBoundary caught exception:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Reset pathing states
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div
          className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-5xl" aria-hidden="true">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Something went wrong
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm">
            This workspace page encountered a rendering error. Your local changes are preserved.
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors focus-ring"
            autoFocus
          >
            Refresh page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
