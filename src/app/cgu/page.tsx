import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";

export const metadata = {
  title: "Conditions Générales d'Utilisation",
  description:
    "Conditions générales d'utilisation de Zolio, le logiciel de devis et factures pour artisans.",
};

export default function CGU() {
  return (
    <LegalPageShell
      title="Conditions Générales d'Utilisation (CGU)"
      lastUpdated="Mai 2026"
      tone="emerald"
    >
      <LegalSection title="1. Objet">
        <p>
          Les présentes CGU définissent les règles d&apos;accès et d&apos;utilisation de
          Zolio. L&apos;accès au service implique l&apos;acceptation sans réserve de
          ces conditions.
        </p>
      </LegalSection>

      <LegalSection title="2. Accès au service">
        <p>
          Le service est accessible aux professionnels du bâtiment.
          L&apos;utilisateur s&apos;engage à fournir des informations exactes lors de
          son inscription.
        </p>
      </LegalSection>

      <LegalSection title="3. Propriété intellectuelle">
        <p>
          L&apos;ensemble des éléments constituant l&apos;application (code, design,
          textes) est la propriété exclusive de Zolio et ne peut être reproduit
          sans autorisation.
        </p>
      </LegalSection>

      <LegalSection title="4. Utilisation du service">
        <p>
          L&apos;utilisateur est seul responsable de l&apos;usage qu&apos;il fait de
          l&apos;application et des documents générés. Zolio ne vérifie pas
          l&apos;exactitude légale ou comptable des devis et factures édités par
          l&apos;utilisateur.
        </p>
      </LegalSection>

      <LegalSection title="5. Données personnelles">
        <p>
          Le traitement des données personnelles est détaillé dans notre{" "}
          <a
            href="/politique-confidentialite"
            className="text-emerald-300 underline decoration-emerald-300/40 underline-offset-4 hover:text-emerald-200"
          >
            politique de confidentialité
          </a>
          . Pour exercer vos droits RGPD : contact@zolio.site.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
