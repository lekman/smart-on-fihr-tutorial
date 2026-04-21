import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// GitHub Pages serves this app at /smart-on-fihr-tutorial/react-app/.
// The base matters because Vite injects it into every asset URL and
// into the absolute paths for the rollup inputs below.
const base = '/smart-on-fihr-tutorial/react-app/'

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    rollupOptions: {
      // SMART on FHIR needs two real HTML entry points:
      //   launch.html — redirects to the authorization server
      //   index.html  — receives the redirect, exchanges code for token
      // A single-SPA-with-routes setup can mangle the authorization code
      // that arrives on the redirect URI, so keep them as separate pages.
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        launch: resolve(import.meta.dirname, 'launch.html'),
      },
    },
  },
})
