/**
 * Script de migration : lignes JSON → table LigneDevis
 *
 * Ce script :
 * 1. Lit tous les devis avec des lignes JSON
 * 2. Pour chaque devis, crée les LigneDevis correspondantes
 * 3. Vérifie que tout est OK
 *
 * Usage : npx tsx scripts/migrate-lignes.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type LigneJson = {
  isOptional?: boolean;
  nomPrestation?: string;
  prixUnitaire?: number | string;
  quantite?: number | string;
  totalLigne?: number | string;
  tva?: string | number;
  unite?: string;
};

function parseNumber(value: unknown, fallback = 0): number {
  const parsed = Number.parseFloat(String(value ?? fallback));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeLine(line: LigneJson, position: number) {
  const quantite = parseNumber(line.quantite, 1);
  const prixUnitaire = parseNumber(line.prixUnitaire);
  const totalLigne = line.totalLigne != null
    ? parseNumber(line.totalLigne)
    : quantite * prixUnitaire;

  return {
    nomPrestation: typeof line.nomPrestation === "string" && line.nomPrestation.trim()
      ? line.nomPrestation.trim()
      : "Prestation",
    unite: typeof line.unite === "string" && line.unite.trim() ? line.unite.trim() : "U",
    quantite,
    prixUnitaire,
    totalLigne,
    tva: String(parseNumber(line.tva, 20)),
    isOptional: Boolean(line.isOptional),
    position,
  };
}

async function main() {
  console.log("🔍 Recherche des devis avec lignes JSON...\n");

  const devis = await prisma.devis.findMany({
    where: {
      lignes: { not: null as unknown as undefined },
    },
    select: {
      id: true,
      numero: true,
      lignes: true,
      _count: { select: { lignesNorm: true } },
    },
  });

  console.log(`📋 ${devis.length} devis trouvés avec des lignes JSON\n`);

  let totalLignes = 0;
  let devisMigres = 0;
  let devisDejaMigres = 0;
  let erreurs = 0;

  for (const d of devis) {
    // Skip si déjà migré
    if (d._count.lignesNorm > 0) {
      devisDejaMigres++;
      continue;
    }

    try {
      const lignes = d.lignes as unknown as LigneJson[];
      if (!Array.isArray(lignes) || lignes.length === 0) {
        continue;
      }

      const lignesNormalisees = lignes.map((ligne, index) => normalizeLine(ligne, index));

      await prisma.ligneDevis.createMany({
        data: lignesNormalisees.map((ligne) => ({
          devisId: d.id,
          ...ligne,
        })),
      });

      totalLignes += lignesNormalisees.length;
      devisMigres++;
      console.log(`  ✅ ${d.numero} : ${lignesNormalisees.length} lignes migrées`);
    } catch (error) {
      erreurs++;
      console.error(`  ❌ ${d.numero} : erreur`, error);
    }
  }

  console.log("\n📊 Résumé :");
  console.log(`  - Devis migrés : ${devisMigres}`);
  console.log(`  - Déjà migrés : ${devisDejaMigres}`);
  console.log(`  - Lignes créées : ${totalLignes}`);
  console.log(`  - Erreurs : ${erreurs}`);

  if (erreurs === 0) {
    console.log("\n✅ Migration terminée avec succès !");
    console.log("\n⚠️  Pour finaliser :");
    console.log("  1. Vérifiez les données migrées");
    console.log("  2. Mettez à jour les routes API pour utiliser lignesNorm");
    console.log("  3. Une fois tout OK, vous pouvez rendre le champ 'lignes' nullable");
  } else {
    console.log("\n⚠️  Migration terminée avec des erreurs. Vérifiez les logs.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error("Erreur fatale :", error);
    process.exit(1);
  });
