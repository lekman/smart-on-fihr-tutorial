import { initSentry, Sentry } from './sentry'
import FHIR from 'fhirclient'

initSentry()

// Client ID for the SMART Health IT launcher is not validated, so a
// placeholder is fine here. For Cerner, register an app in code.cerner.com
// and replace this value.
const CLIENT_ID = 'react-smart-tutorial'

Sentry.addBreadcrumb({ category: 'smart', message: 'launch.tsx starting FHIR.oauth2.authorize' })

try {
  FHIR.oauth2.authorize({
    clientId: CLIENT_ID,
    scope: 'patient/Patient.read patient/Observation.read launch online_access openid profile',
  })
} catch (err) {
  Sentry.captureException(err as Error)
  const p = document.createElement('p')
  p.textContent = 'Failed to start SMART launch. Check Sentry for details.'
  document.body.appendChild(p)
}
