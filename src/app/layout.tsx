import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { ThemeProvider } from "@/components/theme-provider";
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
  title: "Zolio - Logiciel de Devis et Factures pour Artisans du Bâtiment",
  description: "Zolio est l'application tout-en-un pour les professionnels du bâtiment : créez des devis et factures en quelques secondes, faites signer vos clients électroniquement, et suivez vos chantiers avec intelligence artificielle.",
  keywords: ["devis", "factures", "artisan", "bâtiment", "logiciel", "signature électronique", "btp", "auto-entrepreneur"],
  openGraph: {
    title: "Zolio - Logiciel de Devis et Factures pour Artisans",
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
  children: React.ReactNode;
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
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
