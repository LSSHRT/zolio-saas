import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const p = await params;
    const prestationId = p.id;

    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === "Catalogue_Prestations");
    if (!sheet || sheet.properties?.sheetId === undefined) {
      return NextResponse.json({ error: "Onglet Catalogue_Prestations introuvable" }, { status: 404 });
    }
    const sheetId = sheet.properties.sheetId;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Catalogue_Prestations!A:G",
    });

    const rows = response.data.values || [];
    
    // Row 0 is header. Data starts at index 1.
    const rowIndex = rows.findIndex(row => row[0] === userId && row[1] === prestationId);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Prestation non trouvée ou non autorisée" }, { status: 404 });
    }

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
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE prestation:", error);
    return NextResponse.json({ error: "Impossible de supprimer la prestation" }, { status: 500 });
  }
}
