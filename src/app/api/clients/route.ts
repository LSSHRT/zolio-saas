import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Clients!A:F",
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return NextResponse.json([]);

    const dataRows = rows.slice(1);
    const clients = dataRows.map((row) => ({
      id: row[0] || "",
      nom: row[1] || "",
      email: row[2] || "",
      telephone: row[3] || "",
      adresse: row[4] || "",
      dateAjout: row[5] || "",
    }));

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Erreur GET clients:", error);
    return NextResponse.json({ error: "Impossible de récupérer les clients" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nom, email, telephone, adresse } = body;

    const sheets = await getGoogleSheetsClient();

    // Générer un ID unique
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Clients!A:A",
    });
    const nextId = `CLI-${String((existing.data.values?.length || 1)).padStart(3, "0")}`;
    const dateAjout = new Date().toLocaleDateString("fr-FR");

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Clients!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[nextId, nom, email, telephone, adresse, dateAjout]],
      },
    });

    return NextResponse.json({ id: nextId, nom, email, telephone, adresse, dateAjout });
  } catch (error) {
    console.error("Erreur POST client:", error);
    return NextResponse.json({ error: "Impossible d'ajouter le client" }, { status: 500 });
  }
}
