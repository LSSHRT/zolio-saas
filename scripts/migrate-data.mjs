#!/usr/bin/env node
/**
 * Script de migration Xata → Supabase (via Prisma)
 *
 * Usage:
 *   1. Crée un projet Supabase
 *   2. Copie l'URL de connexion (Settings > Database > Connection string)
 *   3. Ajoute SUPABASE_DATABASE_URL dans .env.local
 *   4. Lance: node scripts/migrate-data.mjs
 *
 * Ce script exporte les données de l'ancienne DB et les importe dans Supabase.
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync, readFileSync, existsSync } from "fs";

// Lire les URLs depuis .env.local
function loadEnv() {
  const envFile = ".env.local";
  if (!existsSync(envFile)) {
    console.error("❌ Fichier .env.local introuvable");
    process.exit(1);
  }

  const content = readFileSync(envFile, "utf-8");
  const get = (key) => {
    const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
    return match?.[1]?.replace(/^["']|["']$/g, "");
  };

  return {
    sourceUrl: get("XATA_DATABASE_URL") || get("DATABASE_URL"),
    targetUrl: get("SUPABASE_DATABASE_URL"),
  };
}

async function main() {
  const { sourceUrl, targetUrl } = loadEnv();

  if (!targetUrl) {
    console.error("❌ SUPABASE_DATABASE_URL non définie dans .env.local");
    console.log("   Ajoute: SUPABASE_DATABASE_URL='postgresql://...'");
    process.exit(1);
  }

  console.log("🔄 Migration de données vers Supabase\n");

  // Connexion à la source (Xata/ancienne DB)
  const source = new PrismaClient({
    datasources: { db: { url: sourceUrl } },
  });

  // Connexion à la cible (Supabase)
  const target = new PrismaClient({
    datasources: { db: { url: targetUrl } },
  });

  try {
    // Export/Import dans l'ordre des dépendances
    const tables = [
      { name: "Client", find: () => source.client.findMany(), create: (data) => target.client.create({ data }) },
      { name: "Prestation", find: () => source.prestation.findMany(), create: (data) => target.prestation.create({ data }) },
      { name: "Devis", find: () => source.devis.findMany(), create: (data) => target.devis.create({ data }) },
      { name: "Depense", find: () => source.depense.findMany(), create: (data) => target.depense.create({ data }) },
      { name: "Facture", find: () => source.facture.findMany(), create: (data) => target.facture.create({ data }) },
      { name: "Note", find: () => source.note.findMany(), create: (data) => target.note.create({ data }) },
      { name: "ProspectMail", find: () => source.prospectMail.findMany(), create: (data) => target.prospectMail.create({ data }) },
      { name: "ProspectDomain", find: () => source.prospectDomain.findMany(), create: (data) => target.prospectDomain.create({ data }) },
      { name: "AdminSetting", find: () => source.adminSetting.findMany(), create: (data) => target.adminSetting.create({ data }) },
      { name: "PushSubscription", find: () => source.pushSubscription.findMany(), create: (data) => target.pushSubscription.create({ data }) },
    ];

    let totalMigrated = 0;

    for (const table of tables) {
      process.stdout.write(`   → ${table.name}... `);
      try {
        const rows = await table.find();
        console.log(`${rows.length} lignes trouvées`);

        for (const row of rows) {
          try {
            await table.create(row);
            totalMigrated++;
          } catch (err) {
            // Ignorer les doublons
            if (!err.message?.includes("Unique constraint")) {
              console.log(`      ⚠️ ${err.message?.slice(0, 60)}`);
            }
          }
        }
      } catch (err) {
        console.log(`⚠️ ${err.message?.slice(0, 60)}`);
      }
    }

    console.log(`\n✅ ${totalMigrated} enregistrements migrés !`);

    // Sauvegarder aussi en JSON (backup)
    const backup = {};
    for (const table of tables) {
      try {
        backup[table.name] = await table.find();
      } catch {}
    }
    const backupFile = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`💾 Backup JSON: ${backupFile}`);

  } finally {
    await source.$disconnect();
    await target.$disconnect();
  }

  console.log("\n📋 Prochaines étapes:");
  console.log("   1. Vérifie les données dans le dashboard Supabase");
  console.log("   2. Mets à jour DATABASE_URL sur Vercel avec l'URL Supabase");
  console.log("   3. Redéploie sur Vercel");
}

main().catch(console.error);
