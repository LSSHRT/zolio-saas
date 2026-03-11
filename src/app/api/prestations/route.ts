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
      range: "Catalogue_Prestations!A:G", // A est mnt userId
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return NextResponse.json([]);

    const dataRows = rows.slice(1);
    
    // On ne garde que les prestations du user connecté
    const myPrestations = dataRows.filter((row) => row[0] === userId);

    const prestations = myPrestations.map((row) => ({
      id: row[1] || "",
      categorie: row[2] || "",
      nom: row[3] || "",
      unite: row[4] || "",
      prixUnitaireHT: parseFloat(row[5]) || 0,
      coutMatiere: parseFloat(row[6]) || 0,
    }));

    return NextResponse.json(prestations);
  } catch (error) {
    console.error("Erreur GET prestations:", error);
    return NextResponse.json({ error: "Impossible de récupérer le catalogue" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const body = await request.json();
    const { categorie, nom, unite, prixUnitaireHT, coutMatiere } = body;

    const sheets = await getGoogleSheetsClient();

    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      // On regarde la colonne B pour compter les ID, car A est userId
      range: "Catalogue_Prestations!B:B",
    });
    const nextId = `PREST-${String((existing.data.values?.length || 1)).padStart(3, "0")}`;

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Catalogue_Prestations!A:G", // On ajoute en A:G
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[userId, nextId, categorie, nom, unite, prixUnitaireHT, coutMatiere || ""]],
      },
    });

    return NextResponse.json({ id: nextId, categorie, nom, unite, prixUnitaireHT, coutMatiere });
  } catch (error) {
    console.error("Erreur POST prestation:", error);
    return NextResponse.json({ error: "Impossible d'ajouter la prestation" }, { status: 500 });
  }
}
