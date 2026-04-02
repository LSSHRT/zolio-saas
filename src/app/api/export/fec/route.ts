/**
 * Export comptable FEC (Fichier des Écritures Comptables)
 *
 * Norme : article A47 A-1 du Livre Procédures Fiscales
 * Format : texte avec séparateur `|`, encodage UTF-8, BOM
 *
 * Colonnes (13) :
 * 0  JournalCode
 * 1  JournalLib
 * 2  EcritureDate
 * 3  CompteNum         (numéro de compte comptable)
 * 4  CompteLib
 * 5  EcritureLib       (libellé de l'écriture)
 * 6  EcritureRef       (référence, ici n° facture)
 * 7  Debit
 * 8  Credit
 * 9  EcritureLet       (lettrage — vide)
 * 10 DateLet           (date de lettrage — vide)
 * 11 ValidDate
 * 12 Montantdevise     (vide si même devise)
 * 13 Idevise            (vide si même devise)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/http";

function padNumber(n: number, decimals = 2): string {
  return n.toFixed(decimals).replace(".", ",");
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10).split("-").reverse().join(""); // YYYYMMDD
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return jsonError("Non autorisé", 401);

  const url = new URL(req.url);
  const yearParam = url.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  const from = new Date(year, 0, 1);
  const to = new Date(year, 11, 31, 23, 59, 59);

  // Factures payées dans l'année (recettes)
  const invoices = await prisma.facture.findMany({
    where: {
      userId,
      statut: "Payée",
      date: { gte: from, lte: to },
    },
    orderBy: { date: "asc" },
  });

  // Avoir : lignes de dépenses aussi (si le modèle existe)
  // Pour l'instant on exporte uniquement les factures payées = recettes

  const lines: string[] = [];

  // En-tête FEC (optionnel mais recommandé)
  lines.push(
    [
      "JournalCode",
      "JournalLib",
      "EcritureDate",
      "CompteNum",
      "CompteLib",
      "EcritureLib",
      "EcritureRef",
      "Debit",
      "Credit",
      "EcritureLet",
      "DateLet",
      "ValidDate",
      "Montantdevise",
      "Idevise",
    ].join("|")
  );

  // Chaque facture payée génère 2 lignes :
  // 1. Débit — compte client (4111) = montant TTC
  // 2. Crédit — compte vente (707) = montant HT
  // + TVA collectée (44571)

  // Regroupement par mois pour éviter trop de lignes (écriture globale mensuelle)
  const byMonth: Record<string, { ht: number; tva: number; ttc: number; invoices: string[] }> = {};

  for (const inv of invoices) {
    const monthKey = `${inv.date.getFullYear()}-${String(inv.date.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = { ht: 0, tva: 0, ttc: 0, invoices: [] };
    }
    byMonth[monthKey].ht += inv.totalHT;
    byMonth[monthKey].tva += inv.tva;
    byMonth[monthKey].ttc += inv.totalTTC;
    byMonth[monthKey].invoices.push(inv.numero);
  }

  const validDate = new Date().toISOString().slice(0, 10).split("-").reverse().join("");

  for (const [month, data] of Object.entries(byMonth)) {
    const [y, m] = month.split("-");
    const ecritureDate = `${y}${m.padStart(2, "0")}31`; // dernier jour du mois
    const ref = `V-${y}-${m}`;

    // Ligne débit : compte 4111 Clients
    lines.push(
      [
        "VT",
        "Ventes",
        ecritureDate,
        "411100",
        "Clients",
        `Ventes factures ${month}`,
        ref,
        padNumber(data.ttc),
        "",
        "",
        "",
        validDate,
        "",
        "",
      ].join("|")
    );

    // Ligne crédit : compte 707 Ventes
    if (data.ht > 0) {
      lines.push(
        [
          "VT",
          "Ventes",
          ecritureDate,
          "707000",
          "Ventes de biens et services",
          `Ventes factures ${month}`,
          ref,
          "",
          padNumber(data.ht),
          "",
          "",
          validDate,
          "",
          "",
        ].join("|")
      );
    }

    // Ligne crédit : compte 44571 TVA collectée
    if (data.tva > 0) {
      lines.push(
        [
          "VT",
          "Ventes",
          ecritureDate,
          "445710",
          "TVA collectée sur ventes",
          `TVA factures ${month}`,
          ref,
          "",
          padNumber(data.tva),
          "",
          "",
          validDate,
          "",
          "",
        ].join("|")
      );
    }
  }

  // Ligne de contrôle : total debit = total credit
  const totalDebit = Object.values(byMonth).reduce((s, d) => s + d.ttc, 0);
  const totalCredit = Object.values(byMonth).reduce((s, d) => s + d.ht + d.tva, 0);

  const header = [
    `FEC généré par Zolio`,
    `Année : ${year}`,
    `Factures payées : ${invoices.length}`,
    `Périodes : ${Object.keys(byMonth).join(", ") || "aucune"}`,
    `Total débit : ${padNumber(totalDebit)} €`,
    `Total crédit : ${padNumber(totalCredit)} €`,
    `Écart : ${padNumber(totalDebit - totalCredit)} €`,
    ``,
  ].join("\n");

  const content = header + lines.join("\n") + "\n";

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="Zolio_FEC_${year}.txt"`,
    },
  });
}
