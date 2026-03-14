import { getGoogleSheetsClient } from "./src/lib/googleSheets";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const prisma = new PrismaClient();

async function migrate() {
  console.log("Starting migration...");
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Migrate Clients
    console.log("Migrating Clients...");
    const clientsRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Clients!A:F",
    });
    const clientRows = clientsRes.data.values || [];
    // A: id, B: userId, C: nom, D: email, E: telephone, F: adresse
    // Wait, let's verify old structure for clients
    // Actually old POST in clients was: [id, userId, nom, email, telephone, adresse, date]
    let clientMapping: Record<string, string> = {}; // sheet_id -> prisma_id
    
    for (let i = 1; i < clientRows.length; i++) {
      const row = clientRows[i];
      if (!row[0] || !row[1] || !row[2]) continue;
      
      const newClient = await prisma.client.upsert({
        where: { id: row[0] },
        update: {
          nom: row[2] || "",
          email: row[3] || "",
          telephone: row[4] || "",
          adresse: row[5] || "",
        },
        create: {
          id: row[0],
          userId: row[1],
          nom: row[2] || "",
          email: row[3] || "",
          telephone: row[4] || "",
          adresse: row[5] || "",
        }
      });
      clientMapping[row[0]] = newClient.id;
    }
    console.log(`Migrated ${Object.keys(clientMapping).length} clients.`);

    // Migrate Prestations
    console.log("Migrating Prestations...");
    try {
      const prestRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Catalogue_Prestations!A:H",
      });
      const prestRows = prestRes.data.values || [];
      // [userId, id, categorie, nom, unite, prixUnitaireHT, coutMatiere, stock]
      let prestCount = 0;
      for (let i = 1; i < prestRows.length; i++) {
        const row = prestRows[i];
        if (!row[0] || !row[1] || !row[3]) continue;
        await prisma.prestation.upsert({
          where: { id: row[1] },
          update: {
            nom: row[3],
            description: row[2] || "",
            unite: row[4] || "",
            prix: parseFloat(row[5]) || 0,
            cout: parseFloat(row[6]) || 0,
            stock: parseInt(row[7]) || 0,
          },
          create: {
            id: row[1],
            userId: row[0],
            nom: row[3],
            description: row[2] || "",
            unite: row[4] || "",
            prix: parseFloat(row[5]) || 0,
            cout: parseFloat(row[6]) || 0,
            stock: parseInt(row[7]) || 0,
          }
        });
        prestCount++;
      }
      console.log(`Migrated ${prestCount} prestations.`);
    } catch(e) { console.error("Error migrating prestations:", e); }

    // Migrate Depenses
    console.log("Migrating Depenses...");
    try {
      const depRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Dépenses!A:G",
      });
      const depRows = depRes.data.values || [];
      // [id, userId, date, description, montant, tva, categorie]
      let depCount = 0;
      for (let i = 1; i < depRows.length; i++) {
        const row = depRows[i];
        if (!row[0] || !row[1]) continue;
        await prisma.depense.upsert({
          where: { id: row[0] },
          update: {
            date: row[2] ? new Date(row[2].split('/').reverse().join('-')) : new Date(),
            description: row[3] || "",
            montant: parseFloat(row[4]?.toString().replace(',', '.')) || 0,
            categorie: row[6] || "",
          },
          create: {
            id: row[0],
            userId: row[1],
            date: row[2] ? new Date(row[2].split('/').reverse().join('-')) : new Date(),
            description: row[3] || "",
            montant: parseFloat(row[4]?.toString().replace(',', '.')) || 0,
            categorie: row[6] || "",
          }
        });
        depCount++;
      }
      console.log(`Migrated ${depCount} depenses.`);
    } catch(e) { console.error("Error migrating depenses:", e); }

    // Migrate Devis
    console.log("Migrating Devis...");
    try {
      const devisRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Devis_Emis!A:R",
      });
      const devisRows = devisRes.data.values || [];
      
      const lignesRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Lignes_Devis!A:I",
      });
      const allLignes = lignesRes.data.values || [];

      let devisCount = 0;
      for (let i = 1; i < devisRows.length; i++) {
        const row = devisRows[i];
        if (!row[0] || !row[1]) continue;

        let userId = row[0];
        let offset = 0;
        
        // If old format where userId is missing and row[0] is numero
        if (!userId.startsWith("user_")) {
          // Find fallback user
          const fallbackUser = await prisma.client.findFirst({});
          userId = fallbackUser?.userId || "user_2test";
          offset = -1; // row[0] is numero, row[1] is date
        }

        const numero = row[1 + offset];
        const dateStr = row[2 + offset];
        const clientNom = row[3 + offset];
        const clientEmail = row[4 + offset];
        
        let clientAssocie = Object.values(clientMapping).find(id => id === row[2]);
        // If not found by ID, maybe try to match by name
        if (!clientAssocie) {
           const existingClient = await prisma.client.findFirst({
             where: { userId, nom: clientNom }
           });
           if (existingClient) clientAssocie = existingClient.id;
        }
        if (!clientAssocie) {
           let fallbackClient = await prisma.client.findFirst({ where: { userId }});
           if (!fallbackClient) {
              fallbackClient = await prisma.client.create({
                 data: { userId, nom: clientNom || "Client Inconnu" }
              });
           }
           clientAssocie = fallbackClient.id;
        }

        const devisLignes = allLignes
          .filter((r) => r[0] === userId && r[1] === numero)
          .map((r) => ({
            nomPrestation: r[2] || "",
            quantite: parseFloat(r[3]) || 0,
            unite: r[4] || "",
            prixUnitaire: parseFloat(r[5]) || 0,
            totalLigne: parseFloat(r[6]) || 0,
            tva: r[7] || "20",
            isOptional: r[8] === "Oui",
          }));
        
        let photos = [];
        try { if (row[14 + offset]) photos = JSON.parse(row[14 + offset]); } catch (e) {}

        let dateDebut = null, dateFin = null;
        if (row[15 + offset]) { try { dateDebut = new Date(row[15 + offset]); } catch(e){} }
        if (row[16 + offset]) { try { dateFin = new Date(row[16 + offset]); } catch(e){} }

        const existingDevis = await prisma.devis.findFirst({
          where: { numero: numero, userId: userId }
        });
        if (!existingDevis) {
          await prisma.devis.create({
            data: {
              userId: userId,
              numero: numero,
              clientId: clientAssocie,
              date: dateStr ? new Date(dateStr.split('/').reverse().join('-')) : new Date(),
              statut: row[8 + offset] || "En attente",
              lignes: devisLignes as any,
              remise: parseFloat(row[11 + offset]) || 0,
              acompte: parseFloat(row[10 + offset]) || 0,
              tva: parseFloat(row[6 + offset]) || 0,
              photos: photos as any,
              signature: row[12 + offset] || null,
              dateDebut: dateDebut,
              dateFin: dateFin
            }
          });
        }
        devisCount++;
      }
      console.log(`Migrated ${devisCount} devis.`);
    } catch(e) { console.error("Error migrating devis:", e); }

    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
