import { getGoogleSheetsClient } from "./googleSheets";

async function initializeSheets() {
  console.log("🚀 Lancement du script d'initialisation de la base de données Zolio...");
  
  try {
    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // 1. Récupérer les feuilles existantes
    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    const existingSheets = spreadsheetInfo.data.sheets?.map(s => s.properties?.title) || [];
    console.log(`📋 Feuilles existantes: ${existingSheets.join(", ")}`);

    const requiredSheets = [
      {
        title: "Clients",
        headers: ["userId", "ID_Client", "Nom", "Email", "Telephone", "Adresse", "Date_Ajout"]
      },
      {
        title: "Catalogue_Prestations",
        headers: ["userId", "ID_Prestation", "Categorie", "Nom_Prestation", "Unite", "Prix_Unitaire_HT", "Cout_Matiere_Estime"]
      },
      {
        title: "Devis_Emis",
        headers: ["userId", "Numero_Devis", "Date", "Nom_Client", "Email_Client", "Total_HT", "TVA", "Total_TTC", "Statut", "Lien_PDF"]
      },
      {
        title: "Lignes_Devis",
        headers: ["userId", "Numero_Devis", "Nom_Prestation", "Quantite", "Unite", "Prix_Unitaire", "Total_Ligne"]
      }
    ];

    // 2. Créer les onglets manquants
    const requests = [];
    for (const sheet of requiredSheets) {
      if (!existingSheets.includes(sheet.title)) {
        console.log(`➕ Création de l'onglet: ${sheet.title}`);
        requests.push({
          addSheet: {
            properties: { title: sheet.title }
          }
        });
      }
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests }
      });
      console.log("✅ Nouveaux onglets créés !");
    } else {
      console.log("✅ Tous les onglets existent déjà.");
    }

    // 3. Injecter les en-têtes (colonnes) dans chaque onglet
    console.log("✍️ Écriture des en-têtes de colonnes...");
    for (const sheet of requiredSheets) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheet.title}!A1:J1`, // Maj de la première ligne
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [sheet.headers]
        }
      });
      
      // En profiter pour formater la première ligne en gras + fond gris (optionnel mais propre)
      // On simplifie ici pour garantir que les données soient justes.
    }

    console.log("🎉 INITIALISATION TERMINÉE AVEC SUCCÈS !");
    console.log("👉 Allez voir votre fichier Google Sheets, tout est prêt !");

  } catch (error) {
    console.error("❌ Erreur critique lors de l'initialisation:");
    console.error(error);
  }
}

// Pour exécuter ce fichier directement avec ts-node
initializeSheets();
