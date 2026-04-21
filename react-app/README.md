# React SMART on FHIR demo

Modern rebuild of the tutorial's SMART app using Vite + React 19 + TypeScript + MUI, with `fhirclient` v2 and `@sentry/react`. Deploys to GitHub Pages alongside the original tutorial.

## Stack

| Concern | Package | Notes |
| --- | --- | --- |
| Build tool | Vite 8 | Multi-entry: `launch.html`, `index.html` |
| UI | React 19 + MUI 5 | Material components, `ThemeProvider`, `CssBaseline` |
| SMART flow | `fhirclient` v2 | Modern Promise API; replaces `fhir-client-v0.1.12.js` |
| Observability | `@sentry/react` | Reuses the `algodx` Sentry project DSN |
| Types | TypeScript 6 | Strict on |

## Local dev

```bash
cd react-app
npm install
npm run dev
```

The dev server runs at http://localhost:5173. SMART launch via the dev server requires adding `http://localhost:5173/launch.html` as a Launch URI in whichever sandbox you use.

## Production URLs

After deploy to `gh-pages`:

| URL | Purpose |
| --- | --- |
| `https://lekman.github.io/smart-on-fihr-tutorial/react-app/launch.html` | SMART **Launch URI** — entry for EHR launch |
| `https://lekman.github.io/smart-on-fihr-tutorial/react-app/` | **Redirect URI** — auth server redirects here with the code |

Both paths must be registered in Cerner's code console (or accepted by the SMART Health IT launcher, which does not validate).

## Launch via SMART Health IT

1. https://launch.smarthealthit.org
2. **Launch Type**: Provider EHR Launch
3. **FHIR Version**: either R2 or R4 — the code handles both
4. Pick a **Patient** and **Provider** (do not leave blank)
5. **App Launch URL**: `https://lekman.github.io/smart-on-fihr-tutorial/react-app/launch.html`
6. Click **Launch App!**

## Files of note

| Path | Role |
| --- | --- |
| [`launch.html`](launch.html) + [`src/launch.tsx`](src/launch.tsx) | Kicks off OAuth via `FHIR.oauth2.authorize` |
| [`index.html`](index.html) + [`src/main.tsx`](src/main.tsx) | Renders the app after OAuth redirect |
| [`src/App.tsx`](src/App.tsx) | MUI card-based patient + observation view |
| [`src/fhir.ts`](src/fhir.ts) | Wraps `client.patient.read()` + observation fetch; handles DSTU2/R4 name shape differences |
| [`src/sentry.ts`](src/sentry.ts) | `Sentry.init` with tracing + replay + logs; tags events with `smart.page` and `smart.variant=react` |
| [`vite.config.ts`](vite.config.ts) | Sets `base: '/smart-on-fihr-tutorial/react-app/'` + multi-entry rollup input |

## Why two HTML entry points?

SMART launch is a two-URL dance: the EHR posts you to `launch.html`, which redirects to the auth server; the auth server redirects to `index.html` with an authorization code. A single-page app with client-side routing can interfere with that code exchange, so we keep them as real static HTML files built by Vite.

## Deploying

`git push origin gh-pages` triggers [`.github/workflows/pages.yml`](../.github/workflows/pages.yml), which:

1. Checks out `gh-pages`
2. Runs `npm ci && npm run build` in `react-app/`
3. Stages the original tutorial at `/` and the built React app at `/react-app/`
4. Uploads the combined artifact and deploys to Pages

Pages source must be set to **GitHub Actions** (Settings → Pages).

## Sentry

Uses the same `algodx` DSN as the static tutorial. Events from the React variant are distinguishable via the `smart.variant=react` tag.
