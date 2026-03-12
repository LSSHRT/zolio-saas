import { getGoogleSheetsClient } from "@/lib/googleSheets";
import { generateDevisPDF } from "@/lib/generatePdf";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function POST(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const meta = (user?.unsafeMetadata as any) || (user?.publicMetadata as any) || {};
    const entrepriseName = meta.companyName || (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Mon Entreprise");
    const entrepriseEmail = user?.emailAddresses?.[0]?.emailAddress || "";
    const entreprisePhone = meta.companyPhone || "";
    const entrepriseAddress = meta.companyAddress || "";
    const entrepriseSiret = meta.companySiret || "";
    const entrepriseColor = meta.companyColor || "";
    const entrepriseLogo = meta.companyLogo || "";
    const entrepriseIban = meta.companyIban || "";
    const entrepriseBic = meta.companyBic || "";
    const entrepriseLegal = meta.companyLegal || "";

    const { numero } = await params;
    const sheets = await getGoogleSheetsClient();

    // 1. Récupérer l'ancien devis
    const devisRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:K",
    });
    const devisRows = devisRes.data.values || [];
    const devisRow = devisRows.find((r) => r[0] === userId && r[1] === numero);

    if (!devisRow) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    // 2. Récupérer les lignes
    const lignesRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Lignes_Devis!A:H",
    });
    const allLignes = lignesRes.data.values || [];
    const oldLignes = allLignes.filter((r) => r[0] === userId && r[1] === numero);

    // 3. Générer le nouveau numéro
    const count = devisRows.length || 1;
    const year = new Date().getFullYear();
    const newNumeroDevis = `DEV-${year}-${String(count).padStart(3, "0")}`;
    const newDate = new Date().toLocaleDateString("fr-FR");

    const acompte = devisRow[10] || "";
    
    // 4. Écrire le nouveau devis
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Devis_Emis!A:K",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          userId,
          newNumeroDevis,
          newDate,
          devisRow[3], // nom
          devisRow[4], // email
          devisRow[5], // ht
          devisRow[6], // tva
          devisRow[7], // ttc
          "En attente",
          "", // lien pdf
          acompte
        ]],
      },
    });

    // 5. Écrire les nouvelles lignes
    const newLignesValues = oldLignes.map((l) => [
      userId,
      newNumeroDevis,
      l[2], // nomPrestation
      l[3], // quantite
      l[4], // unite
      l[5], // prixUnitaire
      l[6], // totalLigne
    ]);

    if (newLignesValues.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Lignes_Devis!A:H",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: newLignesValues,
        },
      });
    }

    // 6. Générer le PDF (en arrière-plan)
    const lignesData = oldLignes.map(l => ({
      nomPrestation: l[2] || "",
      quantite: parseFloat(l[3]) || 0,
      unite: l[4] || "",
      prixUnitaire: parseFloat(l[5]) || 0,
      totalLigne: parseFloat(l[6]) || 0,
      tva: l[7] || "20",
    }));

    const pdfBuffer = await generateDevisPDF({
      numeroDevis: newNumeroDevis,
      date: newDate,
      client: {
        nom: devisRow[3],
        email: devisRow[4],
        telephone: "",
        adresse: "",
      },
      isPro: user?.publicMetadata?.isPro === true,
      entreprise: { nom: entrepriseName, email: entrepriseEmail, telephone: entreprisePhone, adresse: entrepriseAddress, siret: entrepriseSiret, color: entrepriseColor, logo: entrepriseLogo, iban: entrepriseIban, bic: entrepriseBic, legal: entrepriseLegal },
      lignes: lignesData,
      totalHT: devisRow[5],
      tva: devisRow[6],
      totalTTC: devisRow[7],
      acompte: acompte,
    });

    return NextResponse.json({
      numero: newNumeroDevis,
      success: true,
    });
  } catch (error) {
    console.error("Erreur duplication devis:", error);
    return NextResponse.json({ error: "Impossible de dupliquer le devis" }, { status: 500 });
  }
}
