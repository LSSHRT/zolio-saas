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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Récupérer le sheetId de l'onglet Dépenses
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = meta.data.sheets?.find(s => s.properties?.title === "Dépenses");
    if (!sheet) {
      return NextResponse.json({ error: "Onglet introuvable" }, { status: 404 });
    }
    const sheetId = sheet.properties?.sheetId;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Dépenses!A:A",
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex((row) => row[0] === id);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Dépense non trouvée" }, { status: 404 });
    }

    // Supprimer la ligne physiquement
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              }
            }
          }
        ]
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/depenses/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la dépense" },
      { status: 500 }
    );
  }
}