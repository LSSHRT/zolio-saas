import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendProspectEmail } from "@/lib/sendEmail";

const prisma = new PrismaClient();
const HUNTER_API_KEY = process.env.HUNTER_API_KEY || "2663781be1b12bdd7aeefdd22d5103a094ceb6b7";

export const maxDuration = 60; // Autorise la fonction à tourner jusqu'à 60 secondes sur Vercel
export const dynamic = 'force-dynamic';

// Fonction pour extraire des emails via une recherche web (Bing)
async function findEmailViaSearch() {
  const metiers = ["Plombier", "Électricien", "Menuisier", "Peintre", "Maçon", "Carreleur", "Chauffagiste", "Serrurier", "Vitrier", "Couvreur", "Charpentier", "Plaquiste", "Façadier"];
  const villes = ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Montpellier", "Strasbourg", "Bordeaux", "Lille", "Rennes", "Reims", "Toulon", "Saint-Etienne", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne", "Clermont-Ferrand", "Le Mans", "Aix-en-Provence", "Brest", "Tours", "Amiens"];
  const providers = ["@gmail.com", "@orange.fr", "@hotmail.fr", "@yahoo.fr", "@wanadoo.fr", "@sfr.fr"];
  
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
    
    if (response.ok) {
      const html = await response.text();
      const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+.[a-zA-Z0-9_-]+/gi;
      const emails = html.match(emailRegex);
      
      if (emails) {
        const uniqueEmails = [...new Set(emails.map(e => e.toLowerCase()))]
          .filter(e => e.includes(provider.replace("@", "")))
          .filter(e => !e.startsWith("22@") && !e.startsWith("27@") && !e.startsWith("u00") && e.length > 10);
          
        if (uniqueEmails.length > 0) {
          return uniqueEmails; // On retourne tous les emails trouvés
        }
      }
    }
  } catch (e) {
    console.error("Erreur recherche web:", e);
  }
  
  return [];
}

// Fonction pour trouver des domaines via recherche, puis utiliser l'API Hunter
async function findEmailsViaHunter() {
  const metiers = ["Plomberie", "Électricité", "Menuiserie", "Peinture bâtiment", "Maçonnerie", "Chauffagiste"];
  const villes = ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Nantes", "Lille"];
  
  const metier = metiers[Math.floor(Math.random() * metiers.length)];
  const ville = villes[Math.floor(Math.random() * villes.length)];
  
  const query = `${metier} ${ville} artisan site:fr`;
  const foundEmails: string[] = [];
  
  try {
    const response = await fetch("https://www.bing.com/search?q=" + encodeURIComponent(query), {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    
    if (!response.ok) return [];
    
    const html = await response.text();
    const domainRegex = /https?:\/\/(www\.)?([a-zA-Z0-9-]+\.fr)/g;
    let match;
    const domains = new Set();
    while ((match = domainRegex.exec(html)) !== null) {
      if (!match[2].includes("bing") && !match[2].includes("pagesjaunes") && !match[2].includes("yelp") && !match[2].includes("travaux")) {
        domains.add(match[2]);
      }
    }
    
    const domainArray = Array.from(domains);
    
    for (let i = 0; i < Math.min(domainArray.length, 2); i++) {
      const domain = domainArray[i];
      const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}`;
      
      const hunterRes = await fetch(hunterUrl);
      if (hunterRes.ok) {
        const data = await hunterRes.json();
        if (data.data && data.data.emails && data.data.emails.length > 0) {
          foundEmails.push(data.data.emails[0].value);
        }
      }
    }
  } catch (e) {
    console.error("Erreur Hunter:", e);
  }
  return foundEmails;
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

    const emailsEnvoyes: string[] = [];
    const maxEmailsToSend = 3; // On envoie jusqu'à 3 emails par exécution pour être plus rapide et utile
    
    // On boucle pour chercher activement des emails (limite de 8 tentatives de recherche max)
    for (let searchAttempt = 0; searchAttempt < 8; searchAttempt++) {
      if (emailsEnvoyes.length >= maxEmailsToSend) break;
      
      // On alterne entre Hunter et Recherche Web
      let emailsTrouves = [];
      let source = "";
      
      if (searchAttempt % 2 === 0) {
        emailsTrouves = await findEmailsViaHunter();
        source = "Cron (Hunter)";
      } else {
        emailsTrouves = await findEmailViaSearch();
        source = "Cron (Bot)";
      }
      
      for (const email of emailsTrouves) {
        if (emailsEnvoyes.length >= maxEmailsToSend) break;
        
        // Vérifier si on a déjà envoyé un mail à cet artisan
        const envoiPrecedent = await prisma.prospectMail.findFirst({
          where: { email },
          orderBy: { createdAt: "desc" }
        });

        let peutEnvoyer = true;
        if (envoiPrecedent) {
          const deuxMoisEnMs = 60 * 24 * 60 * 60 * 1000;
          const dateLimite = new Date(Date.now() - deuxMoisEnMs);
          if (new Date(envoiPrecedent.createdAt) > dateLimite) {
            peutEnvoyer = false;
          }
        }

        if (peutEnvoyer && !emailsEnvoyes.includes(email)) {
          try {
            // Envoyer le mail
            await sendProspectEmail(email);
            
            // Enregistrer dans la base
            await prisma.prospectMail.create({
              data: {
                email,
                status: "Sent",
                source: source,
              },
            });
            
            emailsEnvoyes.push(email);
          } catch (emailErr) {
            console.error(`Erreur d'envoi pour l'email ${email}:`, emailErr);
            // On enregistre l'échec pour ne pas réessayer cet email défectueux en boucle
            await prisma.prospectMail.create({
              data: {
                email,
                status: "Failed",
                source: source,
              },
            });
          }
        }
      }
    }

    if (emailsEnvoyes.length === 0) {
      return NextResponse.json({ message: "Aucun nouvel email valide trouvé ce tour-ci, réessai plus tard." }, { status: 200 });
    }

    return NextResponse.json({ 
      message: `Robot exécuté avec succès : ${emailsEnvoyes.length} email(s) envoyé(s) !`, 
      emails: emailsEnvoyes 
    });

  } catch (error) {
    console.error("Erreur Cron Prospection:", error);
    return NextResponse.json({ message: "Erreur lors de l'envoi", error: String(error) }, { status: 500 });
  }
}
