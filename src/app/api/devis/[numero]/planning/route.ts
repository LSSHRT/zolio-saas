import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { numero } = await params;
    const { dateDebut, dateFin } = await request.json();

    const sheets = await getGoogleSheetsClient();

    // 1. Trouver le devis
    const devisRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:Q",
    });
    const devisRows = devisRes.data.values || [];
    const rowIndex = devisRows.findIndex((r) => r[0] === userId && r[1] === numero);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Devis introuvable ou non autorisé" }, { status: 404 });
    }

    // 2. Mettre à jour les colonnes P (15) et Q (16)
    // On update P et Q
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Devis_Emis!P${rowIndex + 1}:Q${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[dateDebut || "", dateFin || ""]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur PUT planning devis:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
