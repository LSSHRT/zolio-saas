import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Mentions Légales",
  description: "Mentions légales de Zolio, le logiciel de devis et factures pour artisans.",
};

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-[#05050A] text-neutral-300 py-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-900/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <Link href="/" className="inline-flex items-center text-violet-400 hover:text-violet-300 mb-12 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l&apos;accueil
        </Link>
        
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-12">Mentions Légales</h1>
        
        <div className="space-y-12 text-lg leading-relaxed bg-neutral-900/50 backdrop-blur-md p-8 sm:p-12 rounded-3xl border border-white/5">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Éditeur du site</h2>
            <p>
              Le site <strong>Zolio</strong> est édité par la société [Nom de votre entreprise/Statut (ex: Zolio SAS)], 
              au capital de [Montant] €, immatriculée au Registre du Commerce et des Sociétés de [Ville] sous le numéro [Numéro SIRET].
            </p>
            <p className="mt-4">
              <strong>Siège social :</strong> [Votre adresse complète]<br/>
              <strong>Directeur de la publication :</strong> [Votre Nom Prénom]<br/>
              <strong>Contact :</strong> contact@zolio.site<br/>
              <strong>Téléphone :</strong> [Votre numéro - Optionnel]
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Hébergement</h2>
            <p>
              Le site est hébergé par <strong>Vercel Inc.</strong><br/>
              340 S Lemon Ave #4133<br/>
              Walnut, CA 91789<br/>
              États-Unis<br/>
              Site web : <a href="https://vercel.com" className="text-violet-400 hover:underline" target="_blank" rel="noreferrer">https://vercel.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Propriété intellectuelle</h2>
            <p>
              L&apos;ensemble du contenu de ce site (structure, design, textes, images, animations, logos) est la propriété exclusive de Zolio. 
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Limitation de responsabilité</h2>
            <p>
              Zolio s&apos;efforce de fournir sur son site des informations aussi précises que possible. Toutefois, l&apos;entreprise ne pourra être tenue responsable des omissions, des inexactitudes et des carences dans la mise à jour, qu&apos;elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
