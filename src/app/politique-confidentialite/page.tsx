import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-[#05050A] text-neutral-300 py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-fuchsia-900/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center text-fuchsia-400 hover:text-fuchsia-300 mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'accueil
        </Link>
        
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-12">Politique de Confidentialité</h1>
        
        <div className="space-y-12 text-lg leading-relaxed bg-neutral-900/50 backdrop-blur-md p-8 sm:p-12 rounded-3xl border border-white/5">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Collecte des données personnelles</h2>
            <p>
              Nous collectons les informations que vous nous fournissez directement lorsque vous vous inscrivez sur Zolio (Clerk), créez un devis ou une facture. Ces données incluent : nom, prénom, adresse e-mail, numéro de téléphone, adresse postale, et les informations de vos clients que vous saisissez dans l'application.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Utilisation des données</h2>
            <p>
              Les données collectées sont utilisées exclusivement pour :<br/>
              - Vous permettre d'utiliser les services de Zolio (création de devis, factures, catalogue).<br/>
              - Assurer la gestion de votre compte et le support client.<br/>
              - Vous envoyer des informations importantes concernant votre compte ou nos services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Protection et sécurité</h2>
            <p>
              Zolio met en œuvre toutes les mesures techniques et organisationnelles nécessaires pour protéger vos données personnelles contre l'accès non autorisé, la modification, la divulgation ou la destruction. Vos mots de passe et accès sont gérés de manière sécurisée via notre prestataire d'authentification (Clerk).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Partage des données</h2>
            <p>
              Vos données personnelles ne sont jamais vendues à des tiers. Elles peuvent être partagées uniquement avec nos prestataires de services (hébergement Vercel, base de données Neon/Prisma, authentification Clerk) dans le strict cadre de l'exécution de nos services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Vos droits (RGPD)</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données. Vous pouvez exercer ces droits à tout moment en nous contactant à : <strong>contact@zolio.site</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
