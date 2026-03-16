import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendProspectEmail } from "@/lib/sendEmail";

const prisma = new PrismaClient();
const HUNTER_API_KEY = process.env.HUNTER_API_KEY || "2663781be1b12bdd7aeefdd22d5103a094ceb6b7";

// Fonction pour extraire des emails via une recherche web (Bing)
async function findEmailViaSearch() {
  const metiers = ["Plombier", "Électricien", "Menuisier", "Peintre", "Maçon", "Carreleur", "Chauffagiste", "Serrurier", "Vitrier", "Couvreur", "Charpentier"];
  const villes = ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Montpellier", "Strasbourg", "Bordeaux", "Lille", "Rennes", "Reims", "Toulon", "Saint-Etienne", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne"];
  const providers = ["@gmail.com", "@orange.fr", "@hotmail.fr", "@yahoo.fr"];
  
  const metier = metiers[Math.floor(Math.random() * metiers.length)];
  const ville = villes[Math.floor(Math.random() * villes.length)];
  const provider = providers[Math.floor(Math.random() * providers.length)];
  
  const query = `${metier} ${ville} contact artisan "${provider}"`;
  
  try {
    const response = await fetch("https://www.bing.com/search?q=" + encodeURIComponent(query), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/gi;
    const emails = html.match(emailRegex);
    
    if (emails) {
      const uniqueEmails = [...new Set(emails.map(e => e.toLowerCase()))]
        .filter(e => e.includes(provider.replace("@", "")))
        .filter(e => !e.startsWith("22@") && !e.startsWith("27@") && !e.startsWith("u00") && e.length > 10);
        
      if (uniqueEmails.length > 0) {
        // Retourne un email au hasard parmi ceux trouvés
        return uniqueEmails[Math.floor(Math.random() * uniqueEmails.length)];
      }
    }
  } catch (e) {
    console.error("Erreur recherche web:", e);
  }
  return null;
}

// Fonction pour trouver des domaines via recherche, puis utiliser l'API Hunter
async function findEmailViaHunter() {
  const metiers = ["Plomberie", "Électricité", "Menuiserie", "Peinture bâtiment", "Maçonnerie", "Chauffagiste"];
  const villes = ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Nantes", "Lille"];
  
  const metier = metiers[Math.floor(Math.random() * metiers.length)];
  const ville = villes[Math.floor(Math.random() * villes.length)];
  
  const query = `${metier} ${ville} artisan site:fr`;
  
  try {
    const response = await fetch("https://www.bing.com/search?q=" + encodeURIComponent(query), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    // Extraction rudimentaire de domaines .fr dans les résultats
    const domainRegex = /https?:\/\/(www\.)?([a-zA-Z0-9-]+\.fr)/g;
    let match;
    const domains = new Set();
    while ((match = domainRegex.exec(html)) !== null) {
      if (!match[2].includes("bing") && !match[2].includes("pagesjaunes") && !match[2].includes("yelp") && !match[2].includes("travaux")) {
        domains.add(match[2]);
      }
    }
    
    const domainArray = Array.from(domains);
    
    // Essayer Hunter sur les premiers domaines
    for (let i = 0; i < Math.min(domainArray.length, 3); i++) {
      const domain = domainArray[i];
      const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`;
      
      const hunterRes = await fetch(hunterUrl);
      if (hunterRes.ok) {
        const data = await hunterRes.json();
        if (data.data && data.data.emails && data.data.emails.length > 0) {
          // On prend le premier email trouvé par Hunter
          return data.data.emails[0].value;
        }
      }
    }
  } catch (e) {
    console.error("Erreur Hunter:", e);
  }
  return null;
}

async function trouverEmailArtisanAleatoire() {
  // On essaie d'abord la méthode Hunter (plus qualitatif)
  let email = await findEmailViaHunter();
  
  // Si ça échoue, on fait la recherche web gratuite (Gmail, Orange, etc.)
  if (!email) {
    email = await findEmailViaSearch();
  }
  
  return email;
}

export async function GET(req: Request) {
  try {
    // Vérifier si le cron est activé dans les paramètres
    const cronSetting = await prisma.adminSetting.findUnique({
      where: { key: "cron_prospect_enabled" }
    });

    if (cronSetting && cronSetting.value === "false") {
      return NextResponse.json({ message: "Le robot de prospection est désactivé manuellement." });
    }

    // 1. Trouver un email d'artisan
    const email = await trouverEmailArtisanAleatoire();

    if (!email) {
      return NextResponse.json({ message: "Aucun email trouvé ce tour-ci, réessai plus tard." }, { status: 404 });
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
        source: "Cron (Hunter/Bot)",
      },
    });

    return NextResponse.json({ message: "Mail de prospection automatisé envoyé avec succès", email });

  } catch (error) {
    console.error("Erreur Cron Prospection:", error);
    return NextResponse.json({ message: "Erreur lors de l'envoi", error: String(error) }, { status: 500 });
  }
}
