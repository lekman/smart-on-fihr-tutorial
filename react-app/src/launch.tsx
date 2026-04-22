import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import FHIR from 'fhirclient'
import { initSentry, Sentry } from './sentry'
import { theme } from './theme'
import { Unauthorized, type UnauthorizedReason } from './Unauthorized'

initSentry()

// Client ID for the SMART Health IT launcher is not validated, so a
// placeholder is fine here. For Cerner, register an app in code.cerner.com
// and replace this value.
const CLIENT_ID = 'react-smart-tutorial'

function renderGuard(reason: UnauthorizedReason, detail?: string): void {
  const root = document.getElementById('root')
  if (!root) return
  createRoot(root).render(
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Unauthorized reason={reason} detail={detail} />
      </ThemeProvider>
    </StrictMode>,
  )
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  try {
    return JSON.stringify(err)
  } catch {
    return 'Unknown error'
  }
}

const params = new URLSearchParams(window.location.search)
const iss = params.get('iss')

if (!iss) {
  // Direct hit without SMART context. Expected user error, not a crash.
  Sentry.addBreadcrumb({ category: 'smart', message: 'launch.tsx guard: missing iss param' })
  renderGuard('launch-missing-iss')
} else {
  Sentry.addBreadcrumb({ category: 'smart', message: 'launch.tsx starting FHIR.oauth2.authorize' })
  try {
    await FHIR.oauth2.authorize({
      clientId: CLIENT_ID,
      scope: 'patient/Patient.read patient/Observation.read launch online_access openid profile',
    })
  } catch (err: unknown) {
    const message = describeError(err)
    Sentry.captureException(err instanceof Error ? err : new Error(message))
    renderGuard('launch-failed', message)
  }
}
