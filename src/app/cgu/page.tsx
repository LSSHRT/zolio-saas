export default function CGU() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Conditions Générales d'Utilisation (CGU)</h1>
      <p className="mb-4">Dernière mise à jour : {new Date().toLocaleDateString()}</p>
      
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Objet</h2>
      <p className="mb-4">Les présentes CGU définissent les règles d'accès et d'utilisation de Zolio. L'accès au service implique l'acceptation sans réserve de ces conditions.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Accès au service</h2>
      <p className="mb-4">Le service est accessible aux professionnels du bâtiment. L'utilisateur s'engage à fournir des informations exactes lors de son inscription.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Propriété intellectuelle</h2>
      <p className="mb-4">L'ensemble des éléments constituant l'application (code, design, textes) est la propriété exclusive de Zolio et ne peut être reproduit sans autorisation.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Utilisation du service</h2>
      <p className="mb-4">L'utilisateur est seul responsable de l'usage qu'il fait de l'application et des documents générés. Zolio ne vérifie pas l'exactitude légale ou comptable des devis et factures édités par l'utilisateur.</p>

      <div className="mt-8 pt-4 border-t">
        <a href="/dashboard" className="text-blue-600 hover:underline">← Retour à l'accueil</a>
      </div>
    </div>
  );
}
