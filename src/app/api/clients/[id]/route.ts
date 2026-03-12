import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const p = await params;
    const clientId = p.id;

    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === "Clients");
    if (!sheet || sheet.properties?.sheetId === undefined) {
      return NextResponse.json({ error: "Onglet Clients introuvable" }, { status: 404 });
    }
    const sheetId = sheet.properties.sheetId;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Clients!A:G",
    });

    const rows = response.data.values || [];
    
    // Row 0 is header. Data starts at index 1.
    const rowIndex = rows.findIndex(row => row[0] === userId && row[1] === clientId);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Client non trouvé ou non autorisé" }, { status: 404 });
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
    console.error("Erreur DELETE client:", error);
    return NextResponse.json({ error: "Impossible de supprimer le client" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const p = await params;
    const clientId = p.id;
    const body = await request.json();

    const sheets = await getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Clients!A:G",
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === userId && row[1] === clientId);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Client non trouvé ou non autorisé" }, { status: 404 });
    }

    const updatedRow = [
      userId,
      clientId,
      body.nom || rows[rowIndex][2],
      body.email || rows[rowIndex][3] || "",
      body.telephone || rows[rowIndex][4] || "",
      body.adresse || rows[rowIndex][5] || "",
      rows[rowIndex][6] || new Date().toLocaleDateString("fr-FR"),
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Clients!A${rowIndex + 1}:G${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [updatedRow],
      },
    });

    return NextResponse.json({
      id: clientId,
      nom: updatedRow[2],
      email: updatedRow[3],
      telephone: updatedRow[4],
      adresse: updatedRow[5],
      dateAjout: updatedRow[6]
    });
  } catch (error) {
    console.error("Erreur PUT client:", error);
    return NextResponse.json({ error: "Impossible de modifier le client" }, { status: 500 });
  }
}
