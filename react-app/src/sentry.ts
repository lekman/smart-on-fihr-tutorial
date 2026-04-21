import * as Sentry from '@sentry/react'

// DSNs are public — safe to commit. Rotate in Sentry if needed.
const DSN =
  'https://837c3103d0e963bc0a22cb9f76d57d49@o4509752039243776.ingest.de.sentry.io/4511258733445200'

const pathRole = (): string => {
  const p = window.location.pathname
  if (p.endsWith('launch.html') || p.endsWith('/launch')) return 'launch'
  return 'index'
}

export function initSentry(): void {
  if (!DSN) return

  Sentry.init({
    dsn: DSN,
    environment: window.location.hostname === 'localhost' ? 'development' : 'production',
    release: 'smart-on-fhir-tutorial-react@0.1.0',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enableLogs: true,
  })

  Sentry.setTag('smart.page', pathRole())
  Sentry.setTag('smart.variant', 'react')

  Sentry.logger.info('Page loaded', { role: pathRole(), url: window.location.href })
}

export { Sentry }
