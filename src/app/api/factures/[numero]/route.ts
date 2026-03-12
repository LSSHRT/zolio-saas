import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const p = await params;
    const numero = p.numero;

    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // 1. Get the sheet ID for "Factures_Emises"
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === "Factures_Emises");
    if (!sheet || sheet.properties?.sheetId === undefined) {
      return NextResponse.json({ error: "Onglet Factures_Emises introuvable" }, { status: 404 });
    }
    const sheetId = sheet.properties.sheetId;

    // 2. Fetch all rows
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Factures_Emises!A:J",
    });

    const rows = response.data.values || [];
    
    // 3. Find the row index to delete (0-indexed based on sheet data, +1 for actual row if needed, but we iterate)
    const rowIndex = rows.findIndex(row => row[0] === userId && row[1] === numero);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Facture non trouvée ou non autorisée" }, { status: 404 });
    }

    // 4. Delete the row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: "ROWS",
                startIndex: rowIndex, // 0-based index of row to delete
                endIndex: rowIndex + 1, // exclusive end index
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE facture:", error);
    return NextResponse.json({ error: "Impossible de supprimer la facture" }, { status: 500 });
  }
}
