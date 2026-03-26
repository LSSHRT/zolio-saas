/**
 * Seed de domaines d'artisans pour la prospection
 *
 * Usage : npx tsx scripts/seed-prospect-domains.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Domaines d'artisans français — liste initiale
// Ajoutez-en au fil du temps via l'API ou manuellement
const DOMAINS = [
  // Peintres
  { domain: "peinture-paris.fr", company: "Peinture Paris", trade: "peintre", city: "Paris" },
  { domain: "peintre-paris.fr", company: "Peintre Paris", trade: "peintre", city: "Paris" },
  { domain: "touati-batiment.fr", company: "Touati Bâtiment", trade: "peintre", city: "Paris" },
  { domain: "parispeintre.fr", company: "ABM Paris Peintre", trade: "peintre", city: "Paris" },
  { domain: "mon-peintre.fr", company: "Mon Peintre", trade: "peintre", city: "Paris" },

  // Plombiers
  { domain: "plombier-paris.fr", company: "Plombier Paris", trade: "plombier", city: "Paris" },
  { domain: "depannage-plomberie.fr", company: "Dépannage Plomberie", trade: "plombier", city: "Paris" },

  // Électriciens
  { domain: "electricien-paris.fr", company: "Électricien Paris", trade: "electricien", city: "Paris" },

  // Plaquistes
  { domain: "plaquiste-paris.fr", company: "Plaquiste Paris", trade: "plaquiste", city: "Paris" },

  // Multi-métiers BTP
  { domain: "btp-lyon.fr", company: "BTP Lyon", trade: "multi", city: "Lyon" },
  { domain: "artisans-batiment.fr", company: "Artisans Bâtiment", trade: "multi", city: "Marseille" },
  { domain: "renovation-bordeaux.fr", company: "Rénovation Bordeaux", trade: "multi", city: "Bordeaux" },
  { domain: "travaux-nantes.fr", company: "Travaux Nantes", trade: "multi", city: "Nantes" },
  { domain: "batiment-toulouse.fr", company: "Bâtiment Toulouse", trade: "multi", city: "Toulouse" },

  // Chauffagistes
  { domain: "chauffagiste-lyon.fr", company: "Chauffagiste Lyon", trade: "chauffagiste", city: "Lyon" },

  // Carreleurs
  { domain: "carreleur-marseille.fr", company: "Carreleur Marseille", trade: "carreleur", city: "Marseille" },

  // Menuisiers
  { domain: "menuisier-nantes.fr", company: "Menuisier Nantes", trade: "menuisier", city: "Nantes" },

  // Couvreurs
  { domain: "couvreur-lille.fr", company: "Couvreur Lille", trade: "couvreur", city: "Lille" },

  // Facadiers
  { domain: "facadier-strasbourg.fr", company: "Facadier Strasbourg", trade: "facadier", city: "Strasbourg" },
];

async function main() {
  console.log(`🏗️  Ajout de ${DOMAINS.length} domaines d'artisans...\n`);

  let added = 0;
  let skipped = 0;

  for (const item of DOMAINS) {
    try {
      await prisma.prospectDomain.create({
        data: {
          domain: item.domain.toLowerCase(),
          company: item.company,
          trade: item.trade,
          city: item.city,
          source: "Seed",
        },
      });
      added++;
      console.log(`  ✅ ${item.domain} (${item.trade} — ${item.city})`);
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        skipped++;
        console.log(`  ⏭️  ${item.domain} (déjà existant)`);
      } else {
        console.error(`  ❌ ${item.domain}:`, error);
      }
    }
  }

  console.log(`\n📊 Résumé : ${added} ajoutés, ${skipped} ignorés`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error("Erreur fatale :", error);
    process.exit(1);
  });
