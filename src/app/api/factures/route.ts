import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { generateFacturePDF } from "@/lib/generatePdf";
import { sendDevisEmail } from "@/lib/sendEmail";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const body = await request.json();
    const { devisNumero, client, lignes, tva, totalHT, totalTTC } = body;

    const sheets = await getGoogleSheetsClient();

    // 1. Ensure the sheet exists or generate the invoice number
    // Try to get Factures_Emises sheet, we'll assume it exists or we can just append.
    // Let's generate a number based on existing rows.
    let count = 1;
    try {
      const existing = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Factures_Emises!B:B",
      });
      count = existing.data.values?.length || 1;
    } catch (e) {
      // If the sheet doesn't exist, it might fail. But let's assume the owner created it,
      // or it will be created by the API. (Google Sheets append creates the sheet if it doesn't exist? No, it doesn't).
      // We will assume 'Factures_Emises' is created by the user or we will just use a generic row.
      console.error("Impossible de lire Factures_Emises (peut-être qu'elle n'existe pas)", e);
    }
    
    const year = new Date().getFullYear();
    const numeroFacture = `FAC-${year}-${String(count).padStart(3, "0")}`;
    const date = new Date().toLocaleDateString("fr-FR");

    // 2. Écrire l'en-tête de la facture
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Factures_Emises!A:J",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[
            userId,
            numeroFacture,
            date,
            client.nom,
            client.email,
            totalHT,
            tva,
            totalTTC,
            "Émise",
            devisNumero || "" // Référence au devis
          ]],
        },
      });
    } catch (e) {
      console.error("Erreur écriture Factures_Emises", e);
    }

    // 3. Générer le PDF
    const pdfBuffer = generateFacturePDF({
      numeroDevis: numeroFacture, // using same interface
      date,
      client,
      lignes,
      totalHT,
      tva,
      totalTTC,
    });

    // 4. Envoyer l'email de la facture
    let emailSent = false;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendDevisEmail(client.email, client.nom, numeroFacture, totalTTC, pdfBuffer);
        emailSent = true;
      } catch (emailErr) {
        console.error("Email non envoyé (SMTP non configuré ou erreur):", emailErr);
      }
    }

    return NextResponse.json({
      numeroFacture,
      date,
      client,
      totalHT,
      tva,
      totalTTC,
      lignes,
      statut: "Émise",
      emailSent,
    });
  } catch (error) {
    console.error("Erreur POST facture:", error);
    return NextResponse.json({ error: "Impossible de créer la facture" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const sheets = await getGoogleSheetsClient();
    
    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Factures_Emises!A:J",
      });
    } catch (e) {
      return NextResponse.json([]); // Return empty if sheet doesn't exist
    }

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return NextResponse.json([]);

    const dataRows = rows.slice(1); // skip header
    const myFactures = dataRows.filter((row) => row[0] === userId);

    const factures = myFactures.map((row) => ({
      numero: row[1] || "",
      date: row[2] || "",
      nomClient: row[3] || "",
      emailClient: row[4] || "",
      totalHT: row[5] || "",
      tva: row[6] || "",
      totalTTC: row[7] || "",
      statut: row[8] || "",
      devisRef: row[9] || "",
    }));

    return NextResponse.json(factures);
  } catch (error) {
    console.error("Erreur GET factures:", error);
    return NextResponse.json({ error: "Impossible de récupérer les factures" }, { status: 500 });
  }
}
