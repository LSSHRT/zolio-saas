import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

// GET public devis info for signing
export async function GET(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("u");
    const sheets = await getGoogleSheetsClient();

    const devisRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:N",
    });
    
    const devisRows = devisRes.data.values || [];
    // Trouver le premier devis avec ce numéro (et ce userId si fourni)
    const rowIndex = devisRows.findIndex((r) => r[1] === numero && (!userId || r[0] === userId));

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    const devisRow = devisRows[rowIndex];

    // Marquer comme lu (Tracking) de manière asynchrone si pas déjà lu
    if (!devisRow[13]) {
      sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: `Devis_Emis!N${rowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [[new Date().toISOString()]] },
      }).catch(err => console.error("Erreur tracking lu:", err));
    }

    let entreprise = { nom: "MON ENTREPRISE", color: "#0ea5e9", logo: "" };
    if (userId) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const meta = user.unsafeMetadata || {};
        const pubMeta = user.publicMetadata || {};
        entreprise = {
          nom: (meta.companyName as string) || (pubMeta.companyName as string) || "MON ENTREPRISE",
          color: (meta.companyColor as string) || (pubMeta.companyColor as string) || "#0ea5e9",
          logo: (meta.companyLogo as string) || (pubMeta.companyLogo as string) || "",
        };
      } catch (err) {
        console.error("Erreur fetch user Clerk:", err);
      }
    }

    return NextResponse.json({
      numero: devisRow[1],
      date: devisRow[2],
      nomClient: devisRow[3],
      totalTTC: devisRow[7],
      statut: devisRow[8],
      signatureBase64: devisRow[12] || "",
      entreprise,
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("u");
    const body = await request.json();
    const { signatureBase64 } = body;

    if (!signatureBase64) {
      return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
    }

    const sheets = await getGoogleSheetsClient();

    const devisRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:N",
    });
    
    const devisRows = devisRes.data.values || [];
    const rowIndex = devisRows.findIndex((r) => r[1] === numero && (!userId || r[0] === userId));

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    const currentRow = devisRows[rowIndex];

    // Update statut et signature en une seule requête (BatchUpdate)
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      requestBody: {
        valueInputOption: "USER_ENTERED",
        data: [
          {
            range: `Devis_Emis!I${rowIndex + 1}`,
            values: [["Accepté"]],
          },
          {
            range: `Devis_Emis!M${rowIndex + 1}`,
            values: [[signatureBase64]],
          },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur POST public devis:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
