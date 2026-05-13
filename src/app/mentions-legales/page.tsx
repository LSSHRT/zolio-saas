import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";

export const metadata = {
  title: "Mentions Légales",
  description:
    "Mentions légales de Zolio, le logiciel de devis et factures pour artisans.",
};

export default function MentionsLegales() {
  return (
    <LegalPageShell title="Mentions Légales" lastUpdated="Mai 2026" tone="violet">
      <LegalSection title="1. Éditeur du site">
        <p>
          Le site <strong className="text-white">Zolio</strong> est édité par la
          société [Nom de votre entreprise/Statut (ex: Zolio SAS)], au capital
          de [Montant] €, immatriculée au Registre du Commerce et des Sociétés
          de [Ville] sous le numéro [Numéro SIRET].
        </p>
        <p>
          <strong className="text-white">Siège social :</strong> [Votre adresse
          complète]
          <br />
          <strong className="text-white">Directeur de la publication :</strong>{" "}
          [Votre Nom Prénom]
          <br />
          <strong className="text-white">Contact :</strong> contact@zolio.site
          <br />
          <strong className="text-white">Téléphone :</strong> [Votre numéro -
          Optionnel]
        </p>
      </LegalSection>

      <LegalSection title="2. Hébergement">
        <p>
          Le site est hébergé par <strong className="text-white">Vercel Inc.</strong>
          <br />
          340 S Lemon Ave #4133
          <br />
          Walnut, CA 91789
          <br />
          États-Unis
          <br />
          Site web :{" "}
          <a
            href="https://vercel.com"
            className="text-violet-400 underline decoration-violet-400/40 underline-offset-4 hover:text-violet-300"
            target="_blank"
            rel="noreferrer"
          >
            https://vercel.com
          </a>
        </p>
      </LegalSection>

      <LegalSection title="3. Propriété intellectuelle">
        <p>
          L&apos;ensemble du contenu de ce site (structure, design, textes,
          images, animations, logos) est la propriété exclusive de Zolio. Toute
          reproduction, représentation, modification, publication, adaptation
          de tout ou partie des éléments du site, quel que soit le moyen ou le
          procédé utilisé, est interdite, sauf autorisation écrite préalable.
        </p>
      </LegalSection>

      <LegalSection title="4. Limitation de responsabilité">
        <p>
          Zolio s&apos;efforce de fournir sur son site des informations aussi
          précises que possible. Toutefois, l&apos;entreprise ne pourra être
          tenue responsable des omissions, des inexactitudes et des carences
          dans la mise à jour, qu&apos;elles soient de son fait ou du fait des
          tiers partenaires qui lui fournissent ces informations.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
