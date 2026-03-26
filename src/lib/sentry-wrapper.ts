import { withSentry } from "@sentry/nextjs";

// Wrapper Sentry pour les routes API
// Utilisez comme: export const GET = withSentry(yourHandler);
export { withSentry };
