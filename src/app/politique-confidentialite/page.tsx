export default function PolitiqueConfidentialite() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Politique de Confidentialité</h1>
      <p className="mb-4">Dernière mise à jour : {new Date().toLocaleDateString()}</p>
      
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Collecte des données</h2>
      <p className="mb-4">Nous collectons les données suivantes : nom, prénom, adresse e-mail, numéro de téléphone, informations professionnelles, et les données relatives à l'utilisation de l'application.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. Utilisation des données</h2>
      <p className="mb-4">Ces données sont utilisées pour : la création de votre compte, la fourniture du service (création de devis/factures), le support client et l'amélioration de notre application.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Partage des données</h2>
      <p className="mb-4">Vos données ne sont jamais vendues à des tiers. Elles peuvent être partagées avec nos sous-traitants techniques (ex: Stripe pour les paiements, Vercel pour l'hébergement) dans le seul but de fournir le service.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Sécurité</h2>
      <p className="mb-4">Nous mettons en œuvre toutes les mesures techniques et organisationnelles nécessaires pour garantir la sécurité et la confidentialité de vos données.</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Vos droits</h2>
      <p className="mb-4">Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. Vous pouvez exercer ces droits en nous contactant via les coordonnées indiquées dans nos mentions légales.</p>

      <div className="mt-8 pt-4 border-t">
        <a href="/" className="text-blue-600 hover:underline">← Retour à l'accueil</a>
      </div>
    </div>
  );
}
