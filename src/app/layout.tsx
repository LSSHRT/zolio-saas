import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { ThemeProvider } from "@/components/theme-provider";
import { SWRProvider } from "@/components/SWRProvider";
import { Toaster } from "sonner";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Zolio",
  },
  title: "Zolio - Votre Partenaire Chantier Nouvelle Génération",
  description: "Zolio est l'application tout-en-un pour les professionnels du bâtiment : créez des devis et factures en quelques secondes, faites signer vos clients électroniquement, et suivez vos chantiers avec intelligence artificielle.",
  keywords: ["devis", "factures", "artisan", "bâtiment", "logiciel", "signature électronique", "btp", "auto-entrepreneur"],
  openGraph: {
    title: "Zolio - Votre Partenaire Chantier Nouvelle Génération",
    description: "L'application tout-en-un pour les pros du bâtiment. Créez vos devis avec l'IA et faites-les signer instantanément.",
    url: "https://www.zolio.site",
    siteName: "Zolio",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zolio - Devis et Factures pour Artisans",
    description: "L'application tout-en-un pour les pros du bâtiment. Créez vos devis avec l'IA et faites-les signer instantanément.",
  }
};

export const viewport = {
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ClerkProvider localization={frFR}>
      <html lang="fr" suppressHydrationWarning>
        <body
          className={`${outfit.variable} font-sans antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <SWRProvider>
              {children}
              <Toaster
                position="bottom-center"
                toastOptions={{
                  classNames: {
                    toast: "font-sans",
                  },
                }}
              />
            </SWRProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
