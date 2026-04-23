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
    <ClerkProvider
      localization={frFR}
      appearance={{
        variables: {
          colorPrimary: "#7c3aed",
          colorText: "#0f172a",
          colorTextSecondary: "#64748b",
          colorBackground: "#ffffff",
          colorInputText: "#0f172a",
          colorInputBackground: "#f8fafc",
          borderRadius: "1rem",
          fontFamily: "var(--font-outfit), ui-sans-serif, system-ui, sans-serif",
        },
        elements: {
          card: "shadow-xl shadow-violet-500/8 border border-slate-200/60 rounded-2xl",
          headerTitle: "text-slate-950",
          headerSubtitle: "text-slate-500",
          socialButtonsBlockButton: "rounded-xl border-slate-200 hover:border-violet-300 transition",
          formButtonPrimary: "rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 shadow-md shadow-violet-500/20",
          formFieldInput: "rounded-xl border-slate-200 focus:border-violet-400 focus:ring-violet-400/20",
          footerActionLink: "text-violet-600 hover:text-violet-700 font-medium",
          dividerLine: "bg-slate-200",
          dividerText: "text-slate-400 text-xs",
          formFieldLabel: "text-slate-700 font-medium text-sm",
          identityPreviewText: "text-slate-600",
          identityPreviewEditButton: "text-violet-600 hover:text-violet-700",
        },
      }}
    >
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
                offset={80}
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
