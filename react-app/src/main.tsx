import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { initSentry, Sentry } from './sentry'
import { App } from './App'

initSentry()

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0b5fff' },
    background: { default: '#f6f8fb' },
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
})

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
