import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendProspectEmail } from "@/lib/sendEmail";

const prisma = new PrismaClient();

// Fonction utilitaire pour "trouver" ou simuler la découverte d'artisans.
// En production, il faudrait appeler une API (Google Places, Apollo, Hunter, etc.) 
// pour récupérer de vrais e-mails. Ici, on propose une structure évolutive.
async function trouverEmailArtisanAleatoire() {
  // TODO: Remplacer par un véritable appel API de scraping ou d'annuaire.
  // Exemple de liste d'artisans fictifs pour tester l'automatisation:
  const listeTest = [
    "contact@peinture-dupont.fr",
    "info@plomberie-express.com",
    "devis@menuiserie-martin.fr",
    "contact@electricite-generale.fr"
  ];
  return listeTest[Math.floor(Math.random() * listeTest.length)];
}

export async function GET(req: Request) {
  try {
    // 1. Trouver un email d'artisan
    const email = await trouverEmailArtisanAleatoire();

    if (!email) {
      return NextResponse.json({ message: "Aucun email trouvé" }, { status: 404 });
    }

    // 2. Vérifier si on a déjà envoyé un mail à cet artisan (pour éviter le spam)
    const envoiPrecedent = await prisma.prospectMail.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" }
    });

    if (envoiPrecedent) {
      // Si un envoi a eu lieu il y a moins de 60 jours (2 mois), on ignore.
      const deuxMoisEnMs = 60 * 24 * 60 * 60 * 1000;
      const dateLimite = new Date(Date.now() - deuxMoisEnMs);
      
      if (new Date(envoiPrecedent.createdAt) > dateLimite) {
        return NextResponse.json({ message: `L'artisan ${email} a déjà été contacté récemment (moins de 2 mois). Envoi annulé.` });
      }
    }

    // 3. Envoyer le mail de prospection
    await sendProspectEmail(email);

    // 4. Enregistrer l'envoi dans la base de données
    await prisma.prospectMail.create({
      data: {
        email,
        status: "Sent",
        source: "Cron (Automatisé)",
      },
    });

    return NextResponse.json({ message: "Mail de prospection automatisé envoyé avec succès", email });

  } catch (error) {
    console.error("Erreur Cron Prospection:", error);
    return NextResponse.json({ message: "Erreur lors de l'envoi", error: String(error) }, { status: 500 });
  }
}