import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { internalServerError, jsonError } from "@/lib/http";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const body = await request.json();
    const { numeros }: { numeros: string[] } = body;

    if (!numeros?.length || numeros.length > 50) {
      return jsonError("Fournissez entre 1 et 50 numéros de factures", 400);
    }

    const factures = await prisma.facture.findMany({
      where: { userId, numero: { in: numeros } },
      orderBy: { date: "asc" },
    });

    if (!factures.length) return jsonError("Aucune facture trouvée", 404);

    const user = await currentUser();
    if (!user) return jsonError("Utilisateur non trouvé", 401);

    const entreprise = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Mon Entreprise";

    const doc = new jsPDF({ unit: "mm", format: "a4" });
    let y = 15;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(124, 58, 237);
    doc.text("Zolio", 105, y, { align: "center" });
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 116);
    doc.text("Export de factures", 105, y, { align: "center" });
    y += 6;
    doc.setFontSize(9);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} — ${factures.length} facture(s)`, 105, y, { align: "center" });
    y += 4;
    doc.text(entreprise, 105, y, { align: "center" });
    y += 12;

    // Ligne séparatrice
    doc.setDrawColor(226, 226, 235);
    doc.setLineWidth(0.5);
    doc.line(15, y, 195, y);
    y += 8;

    let totalGlobal = 0;
    let totalPaye = 0;

    for (const facture of factures) {
      if (y > 250) {
        doc.addPage();
        y = 15;
        // En-tête page suivante
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 165);
        doc.text("Zolio — Suite", 105, y, { align: "center" });
        y += 8;
      }

      totalGlobal += facture.totalTTC;
      if (facture.statut === "Payée") totalPaye += facture.totalTTC;

      // Couleur selon statut
      let statutColor: [number, number, number] = [100, 100, 116];
      if (facture.statut === "Payée") statutColor = [16, 185, 129];
      else if (facture.statut === "En retard") statutColor = [244, 63, 94];
      else if (facture.statut === "Émise") statutColor = [245, 158, 11];

      // Numéro de facture
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(124, 58, 237);
      doc.text(facture.numero, 15, y);

      // Statut badge
      doc.setFontSize(8);
      doc.setTextColor(...statutColor);
      doc.text(facture.statut.toUpperCase(), 15, y + 5);

      // Montant
      doc.setFontSize(14);
      doc.setTextColor(30, 30, 40);
      doc.text(`${Number(facture.totalTTC).toFixed(2)} €`, 195, y, { align: "right" });

      // Info client
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 116);
      doc.text(`Client : ${facture.nomClient}`, 15, y);
      doc.text(`Date : ${new Date(facture.date).toLocaleDateString("fr-FR")}`, 15, y + 5);
      doc.text(`TVA : ${facture.tva}%`, 15, y + 10);

      if (facture.dateEcheance) {
        doc.text(`Échéance : ${new Date(facture.dateEcheance).toLocaleDateString("fr-FR")}`, 110, y + 10);
      }

      y += 16;

      // Ligne séparatrice
      doc.setDrawColor(226, 226, 235);
      doc.setLineWidth(0.3);
      doc.line(15, y, 195, y);
      y += 6;
    }

    // Résumé final
    y += 4;
    doc.setDrawColor(124, 58, 237);
    doc.setLineWidth(0.8);
    doc.line(15, y, 195, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 40);
    doc.text("Résumé", 15, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Total facturé : ${totalGlobal.toFixed(2)} €`, 15, y);
    y += 6;
    doc.text(`Total encaissé : ${totalPaye.toFixed(2)} €`, 15, y);
    y += 6;
    doc.text(`Reste à encaisser : ${(totalGlobal - totalPaye).toFixed(2)} €`, 15, y);

    if (totalGlobal > 0) {
      const tauxEncaissement = Math.round((totalPaye / totalGlobal) * 100);
      y += 6;
      doc.setFont("helvetica", "bold");
      doc.text(`Taux d'encaissement : ${tauxEncaissement}%`, 15, y);
    }

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 165);
    doc.text("Document généré par Zolio — www.zolio.site", 105, 285, { align: "center" });

    const pdfBuffer = doc.output("arraybuffer");

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="factures_zolio_${new Date().toISOString().slice(0, 10)}.pdf"`,
      },
    });
  } catch (error: unknown) {
    console.error("[FACTURES_BATCH_PDF]", error);
    return internalServerError("batch-pdf", error, "Erreur lors de la génération du PDF");
  }
}
