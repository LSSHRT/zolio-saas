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
  '/mentions-legales',
  '/politique-confidentialite',
  '/sitemap.xml',
  '/robots.txt',
  '/sign-in(.*)',
  '/signer(.*)',
  '/sign-up(.*)',
  '/api/system/status(.*)',
  '/api/cron/prospect(.*)',
  '/api/public/devis(.*)',
  '/api/stripe/checkout(.*)',
  '/api/webhooks/stripe(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Optionnel : protéger toutes les autres routes
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
