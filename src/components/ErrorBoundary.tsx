import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from '../monitoring';

interface Props {
  children: ReactNode;
  /** When this value changes (e.g. the current path) a shown error is cleared. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

// A new deploy replaces the page bundles, so a tab opened before it can fail to load a page.
const isStaleBundleError = (error: Error) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError/i.test(
    error.message || ''
  );

/**
 * Catches a crash in any page so the user sees a recovery screen instead of a blank page.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { componentStack: info.componentStack });
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    const stale = isStaleBundleError(error);

    const title = offline
      ? "You're offline"
      : stale
        ? 'A new version is available'
        : 'Something went wrong';
    const message = offline
      ? 'This page could not load because there is no internet connection. Reconnect and try again.'
      : stale
        ? 'HafiConnect was updated since you opened this page. Reload to get the latest version.'
        : 'This page ran into a problem. Your account and data are safe. Try again, or go back to the home page.';

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-sm">
          <h1 className="text-lg font-bold uppercase tracking-tight text-[#151515] dark:text-white mb-2">{title}</h1>
          <p className="text-sm text-[#666666] dark:text-zinc-400 mb-6">{message}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-lg bg-[#E5252A] hover:bg-[#c91d22] text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Reload page
            </button>
            <a
              href="/"
              className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-[#151515] dark:text-white text-xs font-bold uppercase tracking-wider hover:border-[#E5252A] transition-colors"
            >
              Go to home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
