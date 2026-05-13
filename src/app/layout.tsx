import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Outfit } from "next/font/google";
import { ClerkThemedProvider } from "@/components/clerk-themed-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { SWRProvider } from "@/components/SWRProvider";
import { SystemRuntimeLayer } from "@/components/SystemRuntimeLayer";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { CmdKWrapper } from "@/components/cmdk-wrapper";
import { I18nProvider } from "@/lib/i18n/context";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.zolio.site"),
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Zolio",
  },
  title: {
    default: "Zolio — Gérez vos chantiers, pas la paperasse",
    template: "%s | Zolio",
  },
  description: "Le logiciel de devis et factures conçu pour les artisans du bâtiment. Devis en 3 min, signature digitale, facturation automatique. 1 devis offert, sans carte bancaire.",
  keywords: ["devis artisan", "facture BTP", "logiciel devis", "signature électronique", "artisan bâtiment", "devis painting", "facture electricien", "logiciel plombier", "devis smartphone"],
  openGraph: {
    title: "Zolio — Gérez vos chantiers, pas la paperasse",
    description: "Devis, signature et factures depuis votre téléphone. Conçu pour les artisans du bâtiment. 1 devis gratuit.",
    url: "https://www.zolio.site",
    siteName: "Zolio",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zolio — Devis & Factures pour Artisans",
    description: "Devis en 3 min depuis le chantier. Signature digitale, facturation en 1 clic. Essayez gratuitement.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ClerkThemedProvider>
              <I18nProvider>
                <SWRProvider>
                  <SystemRuntimeLayer />
                  <NotificationPrompt />
                  {children}
                  <CmdKWrapper />
                  <Toaster
                    position="bottom-center"
                    offset={80}
                    theme="system"
                    toastOptions={{
                      classNames: {
                        toast: "font-sans",
                      },
                    }}
                  />
                </SWRProvider>
              </I18nProvider>
            </ClerkThemedProvider>
          </ThemeProvider>
          <Analytics />
          {process.env.NODE_ENV === "production" && (
            <Script id="sw-register" strategy="afterInteractive">{`
              if ("serviceWorker" in navigator) {
                navigator.serviceWorker.register("/sw.js");
              }
            `}</Script>
          )}
      </body>
    </html>
  );
}
