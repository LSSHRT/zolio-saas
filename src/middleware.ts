import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Définir les routes publiques qui ne nécessitent pas d'être connecté
const isPublicRoute = createRouteMatcher([
  '/',
  '/abonnement',
  '/abonnement/success',
  '/cgu',
  '/cgv',
  '/manifest.json',
  '/icon.png',
  '/maintenance',
  '/mentions-legales',
  '/politique-confidentialite',
  '/sitemap.xml',
  '/robots.txt',
  '/sign-in(.*)',
  '/signer(.*)',
  '/sign-up(.*)',
  '/api/system/status(.*)',
  '/api/cron/prospect(.*)',
  '/api/prospect-domains/track(.*)',
  '/api/public/devis(.*)',
  '/api/stripe/checkout(.*)',
  '/api/webhooks/stripe(.*)',
]);

// NOTE: maintenance check removed from middleware (was hitting /api/system/status
// on every navigation, blocking each page load with a server fetch). Maintenance
// status is now checked at the layout/page level if needed.
export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
