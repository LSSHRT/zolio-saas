import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { NextResponse } from "next/server";

// Récupérer les lignes de détail d'un devis spécifique
export async function GET(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params;
    const sheets = await getGoogleSheetsClient();

    // Récupérer l'en-tête du devis
    const devisRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:I",
    });
    const devisRows = devisRes.data.values || [];
    const devisRow = devisRows.find((r) => r[0] === numero);

    if (!devisRow) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    // Récupérer les lignes de détail
    const lignesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Lignes_Devis!A:F",
    });
    const allLignes = lignesRes.data.values || [];
    const lignes = allLignes
      .filter((r) => r[0] === numero)
      .map((r) => ({
        nomPrestation: r[1] || "",
        quantite: parseFloat(r[2]) || 0,
        unite: r[3] || "",
        prixUnitaire: parseFloat(r[4]) || 0,
        totalLigne: parseFloat(r[5]) || 0,
      }));

    return NextResponse.json({
      numero: devisRow[0],
      date: devisRow[1],
      nomClient: devisRow[2],
      emailClient: devisRow[3],
      totalHT: devisRow[4],
      tva: devisRow[5],
      totalTTC: devisRow[6],
      statut: devisRow[7],
      lignes,
    });
  } catch (error) {
    console.error("Erreur GET devis detail:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Mettre à jour un devis existant (modifier les lignes et renvoyer)
export async function PUT(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params;
    const body = await request.json();
    const { lignes, tva } = body;

    const sheets = await getGoogleSheetsClient();

    // Recalculer les totaux
    const totalHT = lignes.reduce((s: number, l: any) => s + l.totalLigne, 0);
    const tauxTVA = parseFloat(tva) || 10;
    const totalTTC = totalHT * (1 + tauxTVA / 100);
    const date = new Date().toLocaleDateString("fr-FR");

    // 1. Trouver et mettre à jour la ligne dans Devis_Emis
    const devisRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:I",
    });
    const devisRows = devisRes.data.values || [];
    const rowIndex = devisRows.findIndex((r) => r[0] === numero);

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    // Mettre à jour la ligne d'en-tête du devis
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Devis_Emis!A${rowIndex + 1}:I${rowIndex + 1}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          numero,
          date,
          devisRows[rowIndex][2], // nom client
          devisRows[rowIndex][3], // email client
          totalHT.toFixed(2),
          `${tauxTVA}%`,
          totalTTC.toFixed(2),
          "En attente (Modifié)",
          "",
        ]],
      },
    });

    // 2. Supprimer les anciennes lignes de détail et réécrire
    const lignesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Lignes_Devis!A:F",
    });
    const allLignes = lignesRes.data.values || [];

    // Garder les lignes qui ne sont PAS liées à ce devis
    const otherLignes = allLignes.filter((r, i) => i === 0 || r[0] !== numero);

    // Ajouter les nouvelles lignes
    const newLignes = lignes.map((l: any) => [
      numero,
      l.nomPrestation,
      l.quantite,
      l.unite,
      l.prixUnitaire,
      l.totalLigne.toFixed(2),
    ]);

    const updatedLignes = [...otherLignes, ...newLignes];

    // Effacer tout puis réécrire
    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Lignes_Devis!A:F",
    });

    if (updatedLignes.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Lignes_Devis!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: updatedLignes },
      });
    }

    // 3. Générer nouveau PDF et renvoyer email si SMTP configuré
    const { generateDevisPDF } = await import("@/lib/generatePdf");
    const { sendDevisEmail } = await import("@/lib/sendEmail");

    const pdfBuffer = generateDevisPDF({
      numeroDevis: numero,
      date,
      client: {
        nom: devisRows[rowIndex][2],
        email: devisRows[rowIndex][3],
        telephone: "",
        adresse: "",
      },
      lignes,
      totalHT: totalHT.toFixed(2),
      tva: `${tauxTVA}%`,
      totalTTC: totalTTC.toFixed(2),
    });

    let emailSent = false;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendDevisEmail(
          devisRows[rowIndex][3], // email client
          devisRows[rowIndex][2], // nom client
          numero,
          totalTTC.toFixed(2),
          pdfBuffer
        );
        emailSent = true;
      } catch (e) {
        console.error("Email non envoyé:", e);
      }
    }

    return NextResponse.json({
      numero,
      date,
      totalHT: totalHT.toFixed(2),
      tva: `${tauxTVA}%`,
      totalTTC: totalTTC.toFixed(2),
      emailSent,
    });
  } catch (error) {
    console.error("Erreur PUT devis:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Supprimer un devis
export async function DELETE(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params;
    const sheets = await getGoogleSheetsClient();

    // 1. Supprimer la ligne dans Devis_Emis
    const devisRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:I",
    });
    const devisRows = devisRes.data.values || [];
    const otherDevis = devisRows.filter((r, i) => i === 0 || r[0] !== numero);

    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:I",
    });
    if (otherDevis.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Devis_Emis!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: otherDevis },
      });
    }

    // 2. Supprimer les lignes de détail associées
    const lignesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Lignes_Devis!A:F",
    });
    const allLignes = lignesRes.data.values || [];
    const otherLignes = allLignes.filter((r, i) => i === 0 || r[0] !== numero);

    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Lignes_Devis!A:F",
    });
    if (otherLignes.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Lignes_Devis!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: otherLignes },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE devis:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
