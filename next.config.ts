import type { NextConfig } from "next";

const ALLOWED_ORIGINS = [
  "https://www.zolio.site",
  "https://zolio.site",
];

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self' https://checkout.stripe.com",
      "img-src 'self' data: blob: https://clerk.zolio.site https://img.clerk.com https://images.clerk.dev https://i.pravatar.cc https://www.transparenttextures.com https://www.pichon-peinture.com",
      "script-src 'self' 'unsafe-inline' https://clerk.zolio.site https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "connect-src 'self' https://clerk.zolio.site https://api.stripe.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
      "worker-src 'self' blob:",
      "frame-src https://clerk.zolio.site https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HSTS — force HTTPS pendant 1 an, y compris les sous-domaines
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  // Cross-Origin protections (anti-Spectre)
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // CORS restreint — uniquement zolio.site
  { key: "Access-Control-Allow-Origin", value: ALLOWED_ORIGINS[0] },
  { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, PATCH, OPTIONS" },
  { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, Stripe-Signature" },
  { key: "Access-Control-Max-Age", value: "86400" },
  // Empêcher le sniffing MIME et les attaques de contenu
  { key: "X-Content-Type-Options", value: "nosniff" },
];

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  serverExternalPackages: ["jspdf", "@prisma/client", "prisma"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "www.transparenttextures.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
