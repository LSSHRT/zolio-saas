import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self' https://checkout.stripe.com",
      "img-src 'self' data: blob: https://clerk.zolio.site https://img.clerk.com https://i.pravatar.cc https://www.transparenttextures.com",
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
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["jspdf"],
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
