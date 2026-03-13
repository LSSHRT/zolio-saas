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
      range: "Devis_Emis!A:O",
    });
    
    const devisRows = devisRes.data.values || [];
    const rowIndex = devisRows.findIndex((r) => r[1] === numero && (!userId || r[0] === userId));

    if (rowIndex === -1) {
      return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
    }

    const devisRow = devisRows[rowIndex];

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

    // Envoi de l'email avec le devis signé si l'email du client est présent
    const emailClient = devisRow[4];
    if (emailClient && userId) {
      try {
        // 1. Récupérer l'entreprise via Clerk
        let entreprise = { nom: "MON ENTREPRISE" } as any;
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const meta = user.unsafeMetadata || {};
        const pubMeta = user.publicMetadata || {};
        
        entreprise = {
          nom: (meta.companyName as string) || (pubMeta.companyName as string) || (user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "MON ENTREPRISE"),
          email: user.emailAddresses?.[0]?.emailAddress || "",
          telephone: (meta.companyPhone as string) || (pubMeta.companyPhone as string) || "",
          adresse: (meta.companyAddress as string) || (pubMeta.companyAddress as string) || "",
          siret: (meta.companySiret as string) || (pubMeta.companySiret as string) || "",
          color: (meta.companyColor as string) || (pubMeta.companyColor as string) || "#0ea5e9",
          logo: (meta.companyLogo as string) || (pubMeta.companyLogo as string) || "",
          iban: (meta.companyIban as string) || (pubMeta.companyIban as string) || "",
          bic: (meta.companyBic as string) || (pubMeta.companyBic as string) || "",
          legal: (meta.companyLegal as string) || (pubMeta.companyLegal as string) || "",
          cgv: (meta.companyCgv as string) || (pubMeta.companyCgv as string) || "",
          statut: (meta.companyStatut as string) || (pubMeta.companyStatut as string) || "",
          assurance: (meta.companyAssurance as string) || (pubMeta.companyAssurance as string) || "",
        };

        // 2. Récupérer les lignes du devis
        const lignesRes = await sheets.spreadsheets.values.get({
          spreadsheetId: process.env.GOOGLE_SHEET_ID,
          range: "Lignes_Devis!A:I",
        });
        const allLignes = lignesRes.data.values || [];
        const lignes = allLignes
          .filter((r) => r[0] === userId && r[1] === numero)
          .map((r) => ({
            nomPrestation: r[2] || "",
            quantite: parseFloat(r[3]) || 0,
            unite: r[4] || "",
            prixUnitaire: parseFloat(r[5]) || 0,
            totalLigne: parseFloat(r[6]) || 0,
            tva: r[7] || "20",
            isOptional: r[8] === "Oui",
          }));

        // 3. Récupérer les photos
        let photos = [];
        try {
          if (devisRow[14]) photos = JSON.parse(devisRow[14]);
        } catch(e) {}

        // 4. Générer le PDF
        const { generateDevisPDF } = await import("@/lib/generatePdf");
        const pdfBuffer = await generateDevisPDF({
          numeroDevis: numero,
          date: devisRow[2],
          client: {
            nom: devisRow[3],
            email: emailClient,
            telephone: "",
            adresse: "",
          },
          entreprise,
          lignes,
          totalHT: devisRow[5],
          tva: devisRow[6],
          totalTTC: devisRow[7],
          acompte: devisRow[10] || "",
          remise: devisRow[11] || "",
          statut: "Accepté",
          signatureBase64,
          photos,
        });

        // 5. Envoyer l'email
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
          const { sendDevisSignedEmail } = await import("@/lib/sendEmail");
          await sendDevisSignedEmail(
            emailClient,
            devisRow[3], // nom du client
            numero,
            devisRow[7], // TTC
            pdfBuffer
          );
        }
      } catch (emailError) {
        console.error("Erreur lors de la génération ou de l'envoi de l'email du devis signé:", emailError);
        // On ne bloque pas la réponse si l'email échoue
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur POST public devis:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
