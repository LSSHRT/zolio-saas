import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Définir les routes publiques qui ne nécessitent pas d'être connecté
const isPublicRoute = createRouteMatcher([
  '/',
  '/manifest.json',
  '/icon.png',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/stripe/checkout(.*)' // Le webhook Stripe le cas échéant
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
