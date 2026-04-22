import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { initSentry, Sentry } from './sentry'
import { theme } from './theme'
import { App } from './App'

initSentry()

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Sentry.ErrorBoundary fallback={<p>Something went wrong. This has been reported.</p>}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </Sentry.ErrorBoundary>
    </StrictMode>,
  )
}
