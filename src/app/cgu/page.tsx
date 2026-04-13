export const metadata = {
  title: "Conditions Générales d'Utilisation",
  description: "Conditions générales d'utilisation de Zolio, le logiciel de devis et factures pour artisans.",
};

export default function CGU() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Conditions Générales d&apos;Utilisation (CGU)</h1>
      <p className="mb-4">Dernière mise à jour : {new Date().toLocaleDateString()}</p>
      
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Objet</h2>
      <p className="mb-4">Les présentes CGU définissent les règles d&apos;accès et d&apos;utilisation de Zolio. L&apos;accès au service implique l&apos;acceptation sans réserve de ces conditions.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Accès au service</h2>
      <p className="mb-4">Le service est accessible aux professionnels du bâtiment. L&apos;utilisateur s&apos;engage à fournir des informations exactes lors de son inscription.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Propriété intellectuelle</h2>
      <p className="mb-4">L&apos;ensemble des éléments constituant l&apos;application (code, design, textes) est la propriété exclusive de Zolio et ne peut être reproduit sans autorisation.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Utilisation du service</h2>
      <p className="mb-4">L&apos;utilisateur est seul responsable de l&apos;usage qu&apos;il fait de l&apos;application et des documents générés. Zolio ne vérifie pas l&apos;exactitude légale ou comptable des devis et factures édités par l&apos;utilisateur.</p>

      <div className="mt-8 pt-4 border-t">
        <a href="/dashboard" className="text-blue-600 hover:underline">← Retour à l&apos;accueil</a>
      </div>
    </div>
  );
}
