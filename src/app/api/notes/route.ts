import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const sheets = await getGoogleSheetsClient();
    
    // Create sheet if it doesn't exist
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Notes!A1",
      });
    } catch (e) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: "Notes" },
              },
            },
          ],
        },
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Notes!A1:E1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["userId", "id", "titre", "contenu", "date"]],
        },
      });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Notes!A:E",
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return NextResponse.json([]);

    const dataRows = rows.slice(1);
    const myNotes = dataRows.filter((row) => row[0] === userId);

    const notes = myNotes.map((row) => ({
      id: row[1] || "",
      titre: row[2] || "",
      contenu: row[3] || "",
      date: row[4] || "",
    })).reverse(); // Afficher les plus récentes en premier

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Erreur GET /api/notes:", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const data = await req.json();
    const sheets = await getGoogleSheetsClient();
    const uniqueId = `NOTE-${Date.now()}`;
    const date = new Date().toLocaleDateString("fr-FR");

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Notes!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[userId, uniqueId, data.titre, data.contenu, date]],
      },
    });

    return NextResponse.json({ success: true, id: uniqueId });
  } catch (error) {
    console.error("Erreur POST /api/notes:", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}
