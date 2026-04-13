import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes publiques — tout le reste est protégé
const isPublicRoute = createRouteMatcher([
  // Authentification
  "/sign-in(.*)",
  "/sign-up(.*)",

  // Pages marketing & légal
  "/",
  "/cgu",
  "/cgv",
  "/changelog",
  "/contact",
  "/mentions-legales",
  "/politique-confidentialite",
  "/m(.*)",
  "/maintenance",

  // API publiques
  "/api/webhook(.*)",
  "/api/cron(.*)",
  "/api/(.*)/signer(.*)",
  "/api/stripe(.*)",

  // Pages publiques
  "/espace-client/(.*)",
  "/signer/(.*)",
  "/unsubscribe(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // Les routes publiques sont autorisées sans authentification
  if (isPublicRoute(request)) return;

  // Toutes les autres routes nécessitent une session valide
  await auth.protect();
});

export const config = {
  matcher: [
    // Ignorer les fichiers statiques et images Next.js
    "/((?!_next|[^?]*\\.(?:html?|css|js|jpe?g|png|gif|svg|ico|webp|woff2?|ttf|eot|otf|map|json|xml|txt)$).*)",
  ],
};
