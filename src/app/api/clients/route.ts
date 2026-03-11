import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Clients!A:G", // Colonne A est maintenant userId, donc jusqu'à G
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return NextResponse.json([]);

    const dataRows = rows.slice(1);
    
    // On ne garde que les clients du user connecté
    const myClients = dataRows.filter((row) => row[0] === userId);

    const clients = myClients.map((row) => ({
      id: row[1] || "",
      nom: row[2] || "",
      email: row[3] || "",
      telephone: row[4] || "",
      adresse: row[5] || "",
      dateAjout: row[6] || "",
    }));

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Erreur GET clients:", error);
    return NextResponse.json({ error: "Impossible de récupérer les clients" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const body = await request.json();
    const { nom, email, telephone, adresse } = body;

    const sheets = await getGoogleSheetsClient();

    // Générer un ID unique (on regarde la colonne B car A = userId)
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Clients!B:B",
    });
    const nextId = `CLI-${String((existing.data.values?.length || 1)).padStart(3, "0")}`;
    const dateAjout = new Date().toLocaleDateString("fr-FR");

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Clients!A:G",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[userId, nextId, nom, email, telephone, adresse, dateAjout]],
      },
    });

    return NextResponse.json({ id: nextId, nom, email, telephone, adresse, dateAjout });
  } catch (error) {
    console.error("Erreur POST client:", error);
    return NextResponse.json({ error: "Impossible d'ajouter le client" }, { status: 500 });
  }
}
