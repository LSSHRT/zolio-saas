import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Capture les erreurs en production uniquement
  environment: process.env.NODE_ENV || "development",
  
  // Performance monitoring (10% des requêtes)
  tracesSampleRate: 0.1,
  
  // Capture les erreurs console
  integrations: [
    Sentry.captureConsoleIntegration({ levels: ["error", "warn"] }),
  ],
  
  // Ignorer les erreurs communes
  ignoreErrors: [
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
    "Non autorisé",
  ],
});
