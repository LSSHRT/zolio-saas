import { google } from "googleapis";

/**
 * Initialise et retourne le client Google Sheets authentifié
 */
export async function getGoogleSheetsClient() {
  // Vérification de la présence des variables d'environnement
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error("Clés API Google manquantes dans le fichier .env.local");
  }

  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!privateKey) {
     throw new Error("Clé API Google manquante");
  }

  // Nettoyage absolu pour OpenSSL: 
  // 1. Remplacer les littéraux \n par de vrais sauts de ligne
  // 2. Supprimer les guillemets résiduels de début/fin si l'utilisateur en a mis dans le .env
  privateKey = privateKey.replace(/\\n/g, '\n').replace(/^"|"$/g, '').trim();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const authClient = await auth.getClient();
  // @ts-ignore - Problème de typage googleapis temporaire
  const sheets = google.sheets({ version: "v4", auth: authClient });

  return sheets;
}

/**
 * Récupère la liste des clients depuis l'onglet "Clients" 
 */
export async function getClients() {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Clients!A:F", // Lit de la colonne A à F
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    // On retire la première ligne si c'est l'en-tête (ID_Client, Nom, Email...)
    const headers = rows[0];
    const dataRows = rows.slice(1);

    return dataRows.map((row) => ({
      id: row[0] || "",
      nom: row[1] || "",
      email: row[2] || "",
      telephone: row[3] || "",
      adresse: row[4] || "",
      dateAjout: row[5] || "",
    }));

  } catch (error) {
    console.error("Erreur lors de la lecture des clients Google Sheets:", error);
    return [];
  }
}
