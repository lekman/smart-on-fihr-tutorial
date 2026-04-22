import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

export type UnauthorizedReason =
  | 'launch-missing-iss'
  | 'index-missing-auth-code'
  | 'launch-failed'

const LAUNCH_URL =
  'https://lekman.github.io/smart-on-fihr-tutorial/react-app/launch.html'

const messages: Record<UnauthorizedReason, { title: string; body: string }> = {
  'launch-missing-iss': {
    title: 'This page needs to be launched from an EHR',
    body: 'The launch URL was opened directly without a SMART launch context. The EHR (or a SMART launcher) is expected to provide an `iss` query parameter pointing at the FHIR server.',
  },
  'index-missing-auth-code': {
    title: 'This page needs an authorization redirect',
    body: 'The app landing page was opened directly. It is only supposed to be reached by the authorization server redirecting back with `code` and `state` query parameters after a successful SMART login.',
  },
  'launch-failed': {
    title: 'SMART launch failed to start',
    body: 'The launch was initiated but the SMART client threw an error before redirecting. The detail is captured in Sentry.',
  },
}

export function Unauthorized({
  reason,
  detail,
}: {
  reason: UnauthorizedReason
  detail?: string
}) {
  const { title, body } = messages[reason]

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Card elevation={1}>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'flex-start' }}>
            <InfoOutlinedIcon color="info" fontSize="large" />
            <Box>
              <Typography variant="h5" component="h1">
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                SMART on FHIR — React demo
              </Typography>
            </Box>
          </Stack>

          <Typography variant="body1" sx={{ mb: 2 }}>
            {body}
          </Typography>

          {detail && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Detail</AlertTitle>
              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                {detail}
              </Typography>
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            To test this app
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Use the SMART Health IT launcher and paste this URL as the App Launch URL:
          </Typography>
          <Box
            component="pre"
            sx={{
              p: 1.5,
              bgcolor: 'grey.100',
              borderRadius: 1,
              fontSize: '0.8rem',
              overflowX: 'auto',
              m: 0,
              mb: 2,
            }}
          >
            {LAUNCH_URL}
          </Box>

          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              href="https://launch.smarthealthit.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open SMART launcher
            </Button>
            <Button
              variant="outlined"
              component={MuiLink}
              href="https://github.com/lekman/smart-on-fihr-tutorial#readme"
              target="_blank"
              rel="noopener noreferrer"
            >
              View README
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}
