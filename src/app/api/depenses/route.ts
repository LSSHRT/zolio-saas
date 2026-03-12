import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { google } from "googleapis";

// Configurer l'auth Google
const getGoogleSheetsClient = () => {
  const authClient = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth: authClient });
};

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Vérifier si l'onglet Dépenses existe
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const hasDepenses = meta.data.sheets?.some(s => s.properties?.title === "Dépenses");

    if (!hasDepenses) {
      // Créer l'onglet s'il n'existe pas
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: "Dépenses" }
              }
            }
          ]
        }
      });
      // Ajouter l'en-tête
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Dépenses!A1:G1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["ID", "ID_Utilisateur", "Date", "Description", "Montant_TTC", "TVA_Deductible", "Categorie"]]
        }
      });
      return NextResponse.json([]);
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Dépenses!A2:G",
    });

    const rows = response.data.values || [];
    
    // Filtrer par userId et formater
    const depenses = rows
      .filter((row) => row[1] === userId)
      .map((row) => ({
        id: row[0],
        date: row[2],
        description: row[3],
        montantTTC: parseFloat(row[4] || "0"),
        tvaDeductible: parseFloat(row[5] || "0"),
        categorie: row[6] || "Autre",
      }));

    return NextResponse.json(depenses);
  } catch (error) {
    console.error("Erreur GET /api/depenses:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des dépenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const data = await req.json();
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const id = "DEP-" + Date.now();
    
    // Assurer l'existence de l'onglet
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const hasDepenses = meta.data.sheets?.some(s => s.properties?.title === "Dépenses");
    if (!hasDepenses) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: "Dépenses" } } }]
        }
      });
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Dépenses!A1:G1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["ID", "ID_Utilisateur", "Date", "Description", "Montant_TTC", "TVA_Deductible", "Categorie"]]
        }
      });
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Dépenses!A:G",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          id,
          userId,
          data.date || new Date().toISOString().split('T')[0],
          data.description,
          data.montantTTC,
          data.tvaDeductible || 0,
          data.categorie || "Autre"
        ]],
      },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Erreur POST /api/depenses:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'ajout de la dépense" },
      { status: 500 }
    );
  }
}