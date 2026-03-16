export default function MentionsLegales() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mentions Légales</h1>
      
      <h2 className="text-xl font-semibold mt-6 mb-2">Éditeur du site</h2>
      <p className="mb-2">Le site Zolio est édité par :</p>
      <p className="mb-4">
        [Nom de la société / Nom Prénom]<br/>
        [Statut juridique (ex: SAS, Auto-entrepreneur)]<br/>
        [Capital social (si applicable)]<br/>
        [Adresse du siège social]<br/>
        [Numéro de téléphone]<br/>
        [Adresse email de contact]
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Directeur de la publication</h2>
      <p className="mb-4">Le directeur de la publication est [Nom du directeur de la publication].</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Hébergement</h2>
      <p className="mb-4">
        Le site Zolio est hébergé par :<br/>
        Vercel Inc.<br/>
        340 S Lemon Ave #4133<br/>
        Walnut, CA 91789<br/>
        États-Unis
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Propriété intellectuelle</h2>
      <p className="mb-4">L'ensemble du contenu de ce site est soumis à la législation française et internationale sur les droits d'auteur et la propriété intellectuelle. Toute reproduction est interdite sans l'autorisation expresse de l'éditeur.</p>

      <div className="mt-8 pt-4 border-t">
        <a href="/dashboard" className="text-blue-600 hover:underline">← Retour à l'accueil</a>
      </div>
    </div>
  );
}
