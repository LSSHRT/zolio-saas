import type { MetadataRoute } from "next";
import { TRADE_OPTIONS } from "@/lib/trades";

/**
 * Sitemap aligned on the canonical host `www.zolio.site` declared in
 * the root metadata + the robots policy. Mixing zolio.site and
 * www.zolio.site between robots / sitemap / canonical confuses Google
 * and dilutes ranking signals across two technically distinct hosts.
 */
const SITE_URL = "https://www.zolio.site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified, priority: 1, changeFrequency: "weekly" },
    { url: `${SITE_URL}/sign-up`, lastModified, priority: 0.9, changeFrequency: "monthly" },
    { url: `${SITE_URL}/sign-in`, lastModified, priority: 0.7, changeFrequency: "monthly" },
    { url: `${SITE_URL}/changelog`, lastModified, priority: 0.7, changeFrequency: "weekly" },
    { url: `${SITE_URL}/contact`, lastModified, priority: 0.6, changeFrequency: "yearly" },
    { url: `${SITE_URL}/cgu`, lastModified, priority: 0.4, changeFrequency: "yearly" },
    { url: `${SITE_URL}/cgv`, lastModified, priority: 0.4, changeFrequency: "yearly" },
    { url: `${SITE_URL}/mentions-legales`, lastModified, priority: 0.3, changeFrequency: "yearly" },
    { url: `${SITE_URL}/politique-confidentialite`, lastModified, priority: 0.3, changeFrequency: "yearly" },
  ];

  // Per-trade landing pages — each one is its own ranking surface,
  // generated statically via generateStaticParams in /m/[metier]/page.tsx.
  const tradeEntries: MetadataRoute.Sitemap = TRADE_OPTIONS.map((trade) => ({
    url: `${SITE_URL}/m/${trade.key}`,
    lastModified,
    priority: 0.8,
    changeFrequency: "monthly",
  }));

  return [...staticEntries, ...tradeEntries];
}
