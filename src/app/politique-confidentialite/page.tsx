import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";

export const metadata = {
  title: "Politique de Confidentialité",
  description: "Politique de confidentialité et protection des données de Zolio.",
};

export default function PolitiqueConfidentialite() {
  return (
    <LegalPageShell
      title="Politique de Confidentialité"
      lastUpdated="Mai 2026"
      tone="fuchsia"
    >
      <LegalSection title="1. Collecte des données personnelles">
        <p>
          Nous collectons les informations que vous nous fournissez directement
          lorsque vous vous inscrivez sur Zolio (Clerk), créez un devis ou une
          facture. Ces données incluent : nom, prénom, adresse e-mail, numéro
          de téléphone, adresse postale, et les informations de vos clients que
          vous saisissez dans l&apos;application.
        </p>
      </LegalSection>

      <LegalSection title="2. Utilisation des données">
        <p>Les données collectées sont utilisées exclusivement pour :</p>
        <ul className="ml-6 list-disc space-y-1 text-neutral-300">
          <li>Vous permettre d&apos;utiliser les services de Zolio (création de devis, factures, catalogue).</li>
          <li>Assurer la gestion de votre compte et le support client.</li>
          <li>Vous envoyer des informations importantes concernant votre compte ou nos services.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Protection et sécurité">
        <p>
          Zolio met en œuvre toutes les mesures techniques et organisationnelles
          nécessaires pour protéger vos données personnelles contre l&apos;accès
          non autorisé, la modification, la divulgation ou la destruction. Vos
          mots de passe et accès sont gérés de manière sécurisée via notre
          prestataire d&apos;authentification (Clerk).
        </p>
      </LegalSection>

      <LegalSection title="4. Partage des données">
        <p>
          Vos données personnelles ne sont jamais vendues à des tiers. Elles
          peuvent être partagées uniquement avec nos prestataires de services
          (hébergement Vercel, base de données Neon/Prisma, authentification
          Clerk) dans le strict cadre de l&apos;exécution de nos services.
        </p>
      </LegalSection>

      <LegalSection title="5. Vos droits (RGPD)">
        <p>
          Conformément au Règlement Général sur la Protection des Données
          (RGPD), vous disposez d&apos;un droit d&apos;accès, de rectification,
          de suppression et de portabilité de vos données. Vous pouvez exercer
          ces droits à tout moment en nous contactant à :{" "}
          <strong className="text-white">contact@zolio.site</strong>.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
