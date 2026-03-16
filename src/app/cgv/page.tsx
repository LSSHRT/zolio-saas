import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CGV() {
  return (
    <div className="min-h-screen bg-[#05050A] text-neutral-300 py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-orange-900/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center text-orange-400 hover:text-orange-300 mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'accueil
        </Link>
        
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-12">Conditions Générales de Vente et d'Utilisation (CGV/CGU)</h1>
        
        <div className="space-y-12 text-lg leading-relaxed bg-neutral-900/50 backdrop-blur-md p-8 sm:p-12 rounded-3xl border border-white/5">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Objet</h2>
            <p>
              Les présentes Conditions Générales régissent l'utilisation du logiciel en mode SaaS "Zolio" et les conditions d'abonnement aux services payants par les professionnels du bâtiment (ci-après "le Client").
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description du service</h2>
            <p>
              Zolio fournit une solution de gestion commerciale permettant la création de devis, factures, catalogues clients et suivi de chantier. Le service est accessible en ligne via le site zolio.site. Zolio propose une version d'essai limitée (1 devis d'essai) et un abonnement "Pro" illimité.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Tarifs et conditions de paiement</h2>
            <p>
              L'abonnement "Zolio Pro" est proposé au tarif de 29€ HT / mois, sans engagement de durée. Le paiement s'effectue mensuellement par prélèvement automatique ou carte bancaire. Les factures sont émises électroniquement et disponibles dans l'espace client.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Durée et Résiliation</h2>
            <p>
              L'abonnement est souscrit pour une durée d'un mois, renouvelable tacitement. Le Client peut résilier son abonnement à tout moment depuis son espace client, la résiliation prenant effet à la fin de la période de facturation en cours. Aucun remboursement au prorata ne sera effectué.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Responsabilités</h2>
            <p>
              Zolio s'engage à fournir le service avec diligence et selon les règles de l'art. Toutefois, la responsabilité de Zolio ne saurait être engagée en cas de perte de données accidentelle, de coupure de service liée à l'hébergement, ou d'utilisation non conforme du logiciel par le Client. Le Client reste seul responsable des documents fiscaux et comptables qu'il émet via la plateforme.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
