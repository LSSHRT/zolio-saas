import type { MetadataRoute } from "next";

/**
 * Single source of truth for crawler rules.
 *
 * Important: a static `public/robots.txt` would override this file
 * silently (Next serves /public files first), so we keep robots
 * configuration here only.
 *
 * The `disallow` list mirrors every authenticated/private route group
 * so Google does not waste its crawl budget on pages that 401-redirect
 * or expose private artefacts.
 */
const SITE_URL = "https://www.zolio.site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/sign-up",
          "/sign-in",
          "/abonnement",
          "/changelog",
          "/contact",
          "/cgu",
          "/cgv",
          "/mentions-legales",
          "/politique-confidentialite",
          "/m/",
          "/manifest.json",
        ],
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/devis",
          "/devis/",
          "/factures",
          "/factures/",
          "/clients",
          "/clients/",
          "/catalogue",
          "/catalogue/",
          "/depenses",
          "/depenses/",
          "/parametres",
          "/parametres/",
          "/planning",
          "/planning/",
          "/signer/",
          "/espace-client/",
          "/nouveau-devis",
          "/nouveau-devis/",
          "/nouvelle-facture",
          "/nouvelle-facture/",
          "/onboarding",
          "/notifications",
          "/calepin",
          "/modeles",
          "/recurrentes",
          "/rapports",
          "/tva",
          "/unsubscribe",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
