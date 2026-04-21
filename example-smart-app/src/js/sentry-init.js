(function () {
  // Paste your Sentry DSN here. DSNs are public — safe to commit.
  // Settings → Projects → (project) → Client Keys (DSN).
  var DSN =
    "https://837c3103d0e963bc0a22cb9f76d57d49@o4509752039243776.ingest.de.sentry.io/4511258733445200";

  if (!window.Sentry || typeof window.Sentry.init !== "function") {
    // Sentry CDN bundle failed to load (network, ad-blocker, etc.). The app
    // still works; logging is just a no-op.
    return;
  }

  if (!DSN || DSN.indexOf("PASTE_") === 0) {
    // DSN not configured yet — skip init so we don't spam a fake endpoint.
    if (typeof console !== "undefined") {
      console.warn("[sentry-init] DSN not configured in src/js/sentry-init.js");
    }
    return;
  }

  window.Sentry.init({
    dsn: DSN,
    environment:
      window.location.hostname === "localhost" ? "development" : "production",
    release: "smart-on-fhir-tutorial@0.1.0",
    sendDefaultPii: false,
    integrations: [
      window.Sentry.browserTracingIntegration(),
      window.Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enableLogs: true,
  });

  // Tag every event with the page role so we can filter launch vs index vs patient.
  var path = window.location.pathname;
  var role = "unknown";
  if (path.indexOf("launch-patient") !== -1) role = "launch-patient";
  else if (path.indexOf("launch-smart-sandbox") !== -1)
    role = "launch-smart-sandbox";
  else if (path.indexOf("launch") !== -1) role = "launch";
  else if (path.indexOf("health") !== -1) role = "health";
  else role = "index";

  window.Sentry.setTag("smart.page", role);

  if (window.Sentry.logger && typeof window.Sentry.logger.info === "function") {
    window.Sentry.logger.info("Page loaded", {
      role: role,
      url: window.location.href,
    });
  }
})();
