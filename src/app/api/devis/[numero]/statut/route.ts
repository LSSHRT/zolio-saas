import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Mettre à jour le statut d'un devis (Accepté, Refusé, En attente)
export async function PATCH(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { numero } = await params;
    const body = await request.json();
    const { statut } = body;

    // Validation du statut
    const statutsValides = ["Accepté", "En attente", "Refusé"];
    if (!statutsValides.includes(statut)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const sheets = await getGoogleSheetsClient();

    // Trouver la ligne du devis
    const devisRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:J",
    });
    const devisRows = devisRes.data.values || [];
    const rowIndex = devisRows.findIndex((r) => r[0] === userId && r[1] === numero);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Devis introuvable ou non autorisé" }, { status: 404 });
    }

    // Mettre à jour uniquement la colonne I (statut = colonne 9, index 8)
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Devis_Emis!I${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[statut]],
      },
    });

    return NextResponse.json({ success: true, numero, statut });
  } catch (error) {
    console.error("Erreur PATCH statut devis:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
