export default function CGV() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Conditions Générales de Vente (CGV)</h1>
      <p className="mb-4">Dernière mise à jour : {new Date().toLocaleDateString()}</p>
      
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Objet</h2>
      <p className="mb-4">Les présentes Conditions Générales de Vente régissent l'utilisation du service Zolio. En souscrivant à nos services, vous acceptez ces conditions dans leur intégralité.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Services proposés</h2>
      <p className="mb-4">Zolio est un outil SaaS (Software as a Service) permettant aux professionnels du bâtiment de créer et gérer leurs devis, factures, et de suivre leur activité.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Tarifs et Paiement</h2>
      <p className="mb-4">Les prix de nos abonnements sont indiqués en euros, toutes taxes comprises. Le paiement s'effectue mensuellement ou annuellement via notre prestataire de paiement sécurisé (Stripe).</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Résiliation</h2>
      <p className="mb-4">Vous pouvez résilier votre abonnement à tout moment depuis les paramètres de votre compte. La résiliation prendra effet à la fin de la période de facturation en cours.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Responsabilité</h2>
      <p className="mb-4">Zolio s'engage à fournir ses services avec diligence, mais ne saurait être tenu responsable des pertes de données accidentelles ou des interruptions de service indépendantes de sa volonté.</p>

      <div className="mt-8 pt-4 border-t">
        <a href="/" className="text-blue-600 hover:underline">← Retour à l'accueil</a>
      </div>
    </div>
  );
}
