import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { NextResponse } from "next/server";

// GET public devis info for signing
export async function GET(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params;
    const sheets = await getGoogleSheetsClient();

    const devisRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:M",
    });
    
    const devisRows = devisRes.data.values || [];
    // Trouver le premier devis avec ce numéro
    const devisRow = devisRows.find((r) => r[1] === numero);

    if (!devisRow) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      numero: devisRow[1],
      date: devisRow[2],
      nomClient: devisRow[3],
      totalTTC: devisRow[7],
      statut: devisRow[8],
      signatureBase64: devisRow[12] || "",
    });
  } catch (error) {
    console.error("Erreur GET public devis:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST signature public
export async function POST(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params;
    const body = await request.json();
    const { signatureBase64 } = body;

    if (!signatureBase64) {
      return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
    }

    const sheets = await getGoogleSheetsClient();

    const devisRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:M",
    });
    
    const devisRows = devisRes.data.values || [];
    const rowIndex = devisRows.findIndex((r) => r[1] === numero);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    const currentRow = devisRows[rowIndex];

    // Ensure array has enough elements up to index 12 (M)
    while (currentRow.length <= 12) {
      currentRow.push("");
    }

    // Update statut (index 8) and signature (index 12)
    currentRow[8] = "Accepté";
    currentRow[12] = signatureBase64;

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Devis_Emis!A${rowIndex + 1}:M${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [currentRow],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur POST public devis:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
