import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { id } = await params;
    if (!id) return new NextResponse("ID manquant", { status: 400 });

    const sheets = await getGoogleSheetsClient();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // Récupérer le spreadsheet pour trouver le sheetId de "Notes"
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    const sheet = spreadsheet.data.sheets?.find(
      (s) => s.properties?.title === "Notes"
    );
    if (!sheet || sheet.properties?.sheetId === undefined) {
      return new NextResponse("Onglet Notes introuvable", { status: 404 });
    }
    const notesSheetId = sheet.properties.sheetId;

    // Récupérer les données pour trouver la ligne
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Notes!A:B",
    });

    const rows = response.data.values;
    if (!rows) return new NextResponse("Aucune donnée", { status: 404 });

    // Chercher la ligne correspondante (userId en A, id en B)
    const rowIndex = rows.findIndex((row) => row[0] === userId && row[1] === id);
    if (rowIndex === -1) {
      return new NextResponse("Note introuvable ou non autorisée", { status: 404 });
    }

    // Supprimer la ligne (l'index de l'API batchUpdate commence à 0, et rowIndex correspond directement car l'en-tête est en 0)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: notesSheetId,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/notes/[id]:", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { id } = await params;
    const data = await req.json();

    const sheets = await getGoogleSheetsClient();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Notes!A:E",
    });

    const rows = response.data.values;
    if (!rows) return new NextResponse("Aucune donnée", { status: 404 });

    const rowIndex = rows.findIndex((row) => row[0] === userId && row[1] === id);
    if (rowIndex === -1) {
      return new NextResponse("Note introuvable", { status: 404 });
    }

    // Mettre à jour titre, contenu (colonnes C et D, ligne = rowIndex + 1)
    const rangeToUpdate = `Notes!C${rowIndex + 1}:D${rowIndex + 1}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: rangeToUpdate,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[data.titre, data.contenu]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur PUT /api/notes/[id]:", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}
