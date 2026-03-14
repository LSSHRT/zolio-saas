import { PrismaClient } from "@prisma/client";
import { getGoogleSheetsClient } from "./src/lib/googleSheets";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function fixMigration() {
  console.log("=== Wiping existing corrupted data in Xata ===");
  await prisma.prestation.deleteMany();
  await prisma.devis.deleteMany();
  await prisma.client.deleteMany();
  await prisma.depense.deleteMany();
  console.log("Database wiped.");

  console.log("=== Fetching from Google Sheets ===");
  const sheets = await getGoogleSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  // 1. Clients
  const clientsRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Clients!A:G" });
  const clientRows = clientsRes.data.values?.slice(1) || []; // Skip header
  console.log(`Migrating ${clientRows.length} clients...`);

  // Map to store mapping from client name -> clientId so we can link Devis
  const clientMap: Record<string, string> = {};

  for (const row of clientRows) {
    if (!row || row.length === 0) continue;

    let id, userId, nom, email, telephone, adresse;
    
    if (row[0] && row[0].startsWith("user_")) {
      // New format: [userId, id, nom, email, telephone, adresse, date]
      userId = row[0];
      id = row[1];
      nom = row[2];
      email = row[3];
      telephone = row[4];
      adresse = row[5];
    } else {
      // Old format: [id, nom, email, telephone, adresse, date]
      userId = "DELAUNAY VALENTIN"; // Fallback to an admin or something? 
      // Actually wait, let's see if we can deduce userId from devis or just set a default for old records
      // The user Valentin has ID "user_3Aqodo6V8U2pmAQDw46JdXvwhrH". Let's use this for old ones.
      userId = "user_3Aqodo6V8U2pmAQDw46JdXvwhrH";
      id = row[0];
      nom = row[1];
      email = row[2];
      telephone = row[3];
      adresse = row[4];
    }

    if (!nom) continue; // Skip invalid

    const created = await prisma.client.create({
      data: {
        userId,
        nom,
        email: email || "",
        telephone: telephone || "",
        adresse: adresse || "",
      },
    });
    clientMap[nom.toLowerCase()] = created.id;
  }
  console.log("Clients migrated!");

  // 2. Prestations
  const prestaRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Catalogue_Prestations!A:I" });
  const prestaRows = prestaRes.data.values?.slice(1) || [];
  console.log(`Migrating ${prestaRows.length} prestations...`);

  for (const row of prestaRows) {
    if (!row || row.length === 0) continue;
    let userId, id, nom, desc, unite, prix, cout, stock;
    
    if (row[0] && row[0].startsWith("user_")) {
      // New format
      userId = row[0];
      id = row[1];
      nom = row[3]; // C was categorie(2), D was nom(3)
      desc = row[4];
      unite = row[5];
      prix = row[6];
      cout = row[7];
      stock = row[8];
    } else {
      // Old format
      userId = "user_3Aqodo6V8U2pmAQDw46JdXvwhrH";
      id = row[0];
      nom = row[2]; // B was categorie(1), C was nom(2)
      desc = row[3];
      unite = row[4];
      prix = row[5];
    }

    if (!nom) continue;

    await prisma.prestation.create({
      data: {
        userId,
        nom,
        description: desc || "",
        unite: unite || "u",
        prix: parseFloat(prix?.replace(',', '.') || "0"),
        cout: parseFloat(cout?.replace(',', '.') || "0"),
        stock: parseInt(stock || "0", 10),
      }
    });
  }
  console.log("Prestations migrated!");

  // 3. Devis
  const devisRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Devis_Emis!A:Q" });
  const devisRows = devisRes.data.values?.slice(1) || [];
  console.log(`Migrating ${devisRows.length} devis...`);

  const lignesRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Lignes_Devis!A:I" });
  const lignesRows = lignesRes.data.values?.slice(1) || [];

  for (const row of devisRows) {
    if (!row || row.length === 0) continue;

    let userId, numero, dateStr, clientNom, tva, statut, acompte, remise, signature, photos, dateDebut, dateFin;

    if (row[0] && row[0].startsWith('DEV-')) {
      userId = "user_3Aqodo6V8U2pmAQDw46JdXvwhrH"; // Default to valentin
      numero = row[0];
      dateStr = row[1];
      clientNom = row[2];
      tva = row[5];
      statut = row[7];
      acompte = row[9];
      remise = row[10];
      signature = row[11];
      photos = row[13];
      dateDebut = row[14];
      dateFin = row[15];
    } else {
      userId = row[0];
      numero = row[1];
      dateStr = row[2];
      clientNom = row[3];
      tva = row[6];
      statut = row[8];
      acompte = row[10];
      remise = row[11];
      signature = row[12];
      photos = row[14];
      dateDebut = row[15];
      dateFin = row[16];
    }

    // Find client ID
    const clientId = clientNom ? clientMap[clientNom.toLowerCase()] : null;
    if (!clientId) {
        console.warn(`Client not found for devis ${numero} (${clientNom})`);
    }

    // Find lignes for this devis
    const currentLignes = lignesRows
      .filter((l) => l[0] === userId && l[1] === numero)
      .map((l) => ({
        nomPrestation: l[2],
        description: l[3] || "",
        quantite: parseFloat(l[4]?.replace(',', '.') || "0"),
        unite: l[5],
        prixUnitaire: parseFloat(l[6]?.replace(',', '.') || "0"),
        totalLigne: parseFloat(l[7]?.replace(',', '.') || "0"),
        isOptional: l[8] === "true"
      }));

    let dateObj = new Date();
    if (dateStr) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }

    await prisma.devis.create({
      data: {
        userId,
        numero,
        date: dateObj,
        clientId: clientId || "UNKNOWN",
        statut: statut || "En attente",
        tva: parseFloat(tva?.replace(',', '.') || "0"),
        acompte: parseFloat(acompte?.replace(',', '.') || "0"),
        remise: parseFloat(remise?.replace(',', '.') || "0"),
        signature: signature || "",
        photos: photos || "[]",
        lignes: JSON.stringify(currentLignes),
        dateDebut: dateDebut ? new Date(dateDebut.split('/').reverse().join('-')) : null,
        dateFin: dateFin ? new Date(dateFin.split('/').reverse().join('-')) : null,
      }
    });
  }
  console.log("Devis migrated!");

  // 4. Depenses
  try {
    const depRes = await sheets.spreadsheets.values.get({ spreadsheetId, range: "Dépenses!A:G" });
    const depRows = depRes.data.values?.slice(1) || [];
    console.log(`Migrating ${depRows.length} depenses...`);
    for (const row of depRows) {
      if (!row || row.length === 0) continue;
      const userId = row[0];
      const id = row[1];
      const dateStr = row[2];
      const desc = row[3];
      const ttc = row[4];
      const tva = row[5];
      const cat = row[6];

      let dateObj = new Date();
      if (dateStr) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
      }

      await prisma.depense.create({
        data: {
          userId,
          description: desc || "",
          categorie: cat || "Autre",
          montant: parseFloat(ttc?.replace(',', '.') || "0"),
          date: dateObj,
        }
      });
    }
    console.log("Depenses migrated!");
  } catch(e: any) {
    console.warn("Could not migrate Depenses sheet:", e.message);
  }

  console.log("=== Migration completed ===");
}

fixMigration().catch(console.error).finally(() => prisma.$disconnect());
