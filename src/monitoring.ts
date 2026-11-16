// Error monitoring. Does nothing unless VITE_SENTRY_DSN is set at build time.
// The Sentry library is loaded only when a DSN is configured, so it adds nothing to the
// bundle otherwise.

type SentryModule = typeof import('@sentry/react');

const dsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined)?.trim();
let sentry: SentryModule | null = null;
const pending: Array<{ error: unknown; extra?: Record<string, unknown> }> = [];

export function initMonitoring() {
  if (!dsn) return;
  import('@sentry/react')
    .then((module) => {
      module.init({
        dsn,
        environment: import.meta.env.MODE,
        // Error reports only: no tracing and no session replay.
        tracesSampleRate: 0,
      });
      sentry = module;
      pending.splice(0).forEach(({ error, extra }) => module.captureException(error, { extra }));
    })
    .catch(() => {
      /* monitoring must never break the app */
    });
}

export function reportError(error: unknown, extra?: Record<string, unknown>) {
  if (!dsn) return;
  if (sentry) sentry.captureException(error, { extra });
  else pending.push({ error, extra });
}
