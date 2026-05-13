import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";

export const metadata = {
  title: "Conditions Générales de Vente",
  description:
    "Conditions générales de vente de Zolio, le logiciel de devis et factures pour artisans.",
};

export default function CGV() {
  return (
    <LegalPageShell
      title="Conditions Générales de Vente et d'Utilisation (CGV/CGU)"
      lastUpdated="Mai 2026"
      tone="orange"
    >
      <LegalSection title="1. Objet">
        <p>
          Les présentes Conditions Générales régissent l&apos;utilisation du
          logiciel en mode SaaS « Zolio » et les conditions d&apos;abonnement aux
          services payants par les professionnels du bâtiment (ci-après « le
          Client »).
        </p>
      </LegalSection>

      <LegalSection title="2. Description du service">
        <p>
          Zolio fournit une solution de gestion commerciale permettant la
          création de devis, factures, catalogues clients et suivi de chantier.
          Le service est accessible en ligne via le site zolio.site. Zolio
          propose une version d&apos;essai limitée (1 devis d&apos;essai) et un
          abonnement « Pro » illimité.
        </p>
      </LegalSection>

      <LegalSection title="3. Tarifs et conditions de paiement">
        <p>
          L&apos;abonnement « Zolio Pro » est proposé au tarif de 29€ HT / mois,
          sans engagement de durée. Le paiement s&apos;effectue mensuellement par
          prélèvement automatique ou carte bancaire. Les factures sont émises
          électroniquement et disponibles dans l&apos;espace client.
        </p>
      </LegalSection>

      <LegalSection title="4. Durée et résiliation">
        <p>
          L&apos;abonnement est souscrit pour une durée d&apos;un mois, renouvelable
          tacitement. Le Client peut résilier son abonnement à tout moment
          depuis son espace client, la résiliation prenant effet à la fin de la
          période de facturation en cours. Aucun remboursement au prorata ne
          sera effectué.
        </p>
      </LegalSection>

      <LegalSection title="5. Responsabilités">
        <p>
          Zolio s&apos;engage à fournir le service avec diligence et selon les
          règles de l&apos;art. Toutefois, la responsabilité de Zolio ne saurait
          être engagée en cas de perte de données accidentelle, de coupure de
          service liée à l&apos;hébergement, ou d&apos;utilisation non conforme du
          logiciel par le Client. Le Client reste seul responsable des
          documents fiscaux et comptables qu&apos;il émet via la plateforme.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
