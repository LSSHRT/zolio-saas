import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { ThemeProvider } from "@/components/theme-provider";
import { SWRProvider } from "@/components/SWRProvider";
import { SystemRuntimeLayer } from "@/components/SystemRuntimeLayer";
import { NotificationPrompt } from "@/components/NotificationPrompt";
import { I18nProvider } from "@/lib/i18n/context";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
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
    <ClerkProvider localization={frFR}>
      <html lang="fr" suppressHydrationWarning>
        <body
          className={`${outfit.variable} font-sans antialiased`}
        >
          {/* Anti-zoom iOS : force 16px inline sur chaque input + bloque pinch-zoom */}
          <Script id="anti-zoom-nuclear" strategy="afterInteractive">{`
            (function(){
              function fixInputs(){
                document.querySelectorAll('input,textarea,select').forEach(function(el){
                  el.style.fontSize='16px';
                });
              }
              fixInputs();
              new MutationObserver(fixInputs).observe(document.body,{childList:true,subtree:true});
              document.addEventListener('focusin',function(e){
                if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT'){
                  e.target.style.fontSize='16px';
                }
              },true);
              document.addEventListener('gesturestart',function(e){e.preventDefault();},{passive:false});
              document.addEventListener('gesturechange',function(e){e.preventDefault();},{passive:false});
              document.addEventListener('gestureend',function(e){e.preventDefault();},{passive:false});
              document.addEventListener('touchstart',function(e){
                if(e.touches.length>1)e.preventDefault();
              },{passive:false});
            })();
          `}</Script>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <I18nProvider>
              <SWRProvider>
              <SystemRuntimeLayer />
              <NotificationPrompt />
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
            </I18nProvider>
          </ThemeProvider>
          <Analytics />
          <Script id="sw-register" strategy="afterInteractive">{`
            if ("serviceWorker" in navigator) {
              navigator.serviceWorker.register("/sw.js");
            }
          `}</Script>
        </body>
      </html>
    </ClerkProvider>
  );
}
