import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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
  '/api/public/devis(.*)',
  '/api/stripe/checkout(.*)',
  '/api/webhooks/stripe(.*)',
]);

const isMaintenanceBypassRoute = createRouteMatcher([
  '/admin(.*)',
  '/maintenance',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/cron/prospect(.*)',
  '/api/system/status(.*)',
  '/api/webhooks/stripe(.*)',
]);

async function getSystemStatus(req: Request) {
  try {
    const response = await fetch(new URL('/api/system/status', req.url), {
      headers: {
        cookie: req.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as {
      maintenanceEnabled?: boolean;
      canBypassMaintenance?: boolean;
    };
  } catch (error) {
    console.error('[maintenance-check]', error);
    return null;
  }
}

export default clerkMiddleware(async (auth, req) => {
  if (!isMaintenanceBypassRoute(req)) {
    const systemStatus = await getSystemStatus(req);

    if (systemStatus?.maintenanceEnabled && !systemStatus.canBypassMaintenance) {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Maintenance en cours' }, { status: 503 });
      }

      return NextResponse.redirect(new URL('/maintenance', req.url));
    }
  }

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
