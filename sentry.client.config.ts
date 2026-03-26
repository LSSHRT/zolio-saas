import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  environment: process.env.NODE_ENV || "development",
  
  // Performance monitoring (10% des requêtes)
  tracesSampleRate: 0.1,
  
  // Replay des sessions (5% des sessions)
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
  
  integrations: [
    Sentry.replayIntegration(),
    Sentry.captureConsoleIntegration({ levels: ["error"] }),
  ],
  
  ignoreErrors: [
    "NEXT_NOT_FOUND",
    "NEXT_REDIRECT",
  ],
});
