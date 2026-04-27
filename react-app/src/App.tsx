import { useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import FHIR from 'fhirclient'
import { Sentry } from './sentry'
import {
  MOCK_PATIENT_SUMMARY,
  isDemoClient,
  loadPatientSummary,
  type PatientSummary,
} from './fhir'
import { Unauthorized } from './Unauthorized'

type AppState =
  | { status: 'loading' }
  | { status: 'unauthorized' }
  | { status: 'ready'; summary: PatientSummary }
  | { status: 'error'; message: string }

// Guard: index.html is only reachable after the auth server redirects back
// with ?code=...&state=... Direct hits are expected user errors, not bugs —
// compute this at mount time so the effect doesn't need to short-circuit.
function hasAuthCallback(): boolean {
  const params = new URLSearchParams(window.location.search)
  return Boolean(params.get('code') && params.get('state'))
}

export function App() {
  const [state, setState] = useState<AppState>(() =>
    hasAuthCallback() ? { status: 'loading' } : { status: 'unauthorized' },
  )

  useEffect(() => {
    if (!hasAuthCallback()) {
      Sentry.addBreadcrumb({
        category: 'smart',
        message: 'App guard: missing code/state query params',
      })
      return
    }

    Sentry.addBreadcrumb({ category: 'smart', message: 'App mounted, awaiting FHIR.oauth2.ready' })

    FHIR.oauth2
      .ready()
      .then((client) => {
        if (isDemoClient(client)) {
          Sentry.addBreadcrumb({
            category: 'fhir',
            message: 'demo client detected — using mock summary',
          })
          return MOCK_PATIENT_SUMMARY
        }
        return loadPatientSummary(client)
      })
      .then((summary) => setState({ status: 'ready', summary }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load patient data'
        Sentry.captureException(err instanceof Error ? err : new Error(message))
        setState({ status: 'error', message })
      })
  }, [])

  if (state.status === 'unauthorized') {
    return <Unauthorized reason="index-missing-auth-code" />
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          SMART on FHIR — React demo
        </Typography>
        <Chip label="algodx" color="primary" size="small" />
      </Stack>

      {state.status === 'loading' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <Typography>Loading patient data…</Typography>
        </Box>
      )}

      {state.status === 'error' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.message} — details captured in Sentry.
        </Alert>
      )}

      {state.status === 'ready' && <PatientView summary={state.summary} />}
    </Container>
  )
}

function PatientView({ summary }: { summary: PatientSummary }) {
  const fullName =
    [summary.firstName, summary.lastName].filter(Boolean).join(' ') || 'Unnamed patient'

  return (
    <Stack spacing={3}>
      <Card elevation={1}>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{fullName}</Typography>
              <Typography variant="body2" color="text.secondary">
                Patient demographics
              </Typography>
            </Box>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <DemographicCell label="Gender" value={summary.gender} />
            <DemographicCell label="Date of birth" value={summary.birthDate} />
          </Grid>
        </CardContent>
      </Card>

      <Card elevation={1}>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              <MonitorHeartIcon />
            </Avatar>
            <Typography variant="h6">Observations</Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <DemographicCell label="Height" value={summary.height} />
            <DemographicCell label="Systolic BP" value={summary.systolicBP} />
            <DemographicCell label="Diastolic BP" value={summary.diastolicBP} />
            <DemographicCell label="HDL" value={summary.hdl} />
            <DemographicCell label="LDL" value={summary.ldl} />
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  )
}

function DemographicCell({ label, value }: { label: string; value?: string }) {
  return (
    <Grid size={{ xs: 12, sm: 6 }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 500 }}>
        {value || '—'}
      </Typography>
    </Grid>
  )
}
