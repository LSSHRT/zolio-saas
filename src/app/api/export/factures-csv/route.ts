export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError } from "@/lib/http";

function escapeCsv(val: string | number | null | undefined): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { searchParams } = new URL(request.url);
    const statut = searchParams.get("statut");
    const mois = searchParams.get("mois"); // YYYY-MM
    const annee = searchParams.get("annee");

    const where: Record<string, unknown> = { userId };

    if (statut && statut !== "Toutes") {
      where.statut = statut;
    }

    if (mois) {
      const [y, m] = mois.split("-").map(Number);
      const debut = new Date(y, m - 1, 1);
      const fin = new Date(y, m, 0, 23, 59, 59);
      where.date = { gte: debut, lte: fin };
    } else if (annee) {
      const y = parseInt(annee);
      const debut = new Date(y, 0, 1);
      const fin = new Date(y + 1, 0, 1);
      where.date = { gte: debut, lt: fin };
    }

    const factures = await prisma.facture.findMany({
      where,
      orderBy: { date: "desc" },
      select: {
        numero: true,
        nomClient: true,
        emailClient: true,
        totalHT: true,
        tva: true,
        totalTTC: true,
        statut: true,
        date: true,
        dateEcheance: true,
        stripeSessionId: true,
        createdAt: true,
      },
    });

    const headers = [
      "Numéro",
      "Client",
      "Email",
      "Total HT",
      "TVA %",
      "Total TTC",
      "Statut",
      "Date création",
      "Date échéance",
      "Payé via Stripe",
    ];

    const rows = factures.map((f) => [
      escapeCsv(f.numero),
      escapeCsv(f.nomClient),
      escapeCsv(f.emailClient),
      escapeCsv(f.totalHT.toFixed(2)),
      escapeCsv(f.tva),
      escapeCsv(f.totalTTC.toFixed(2)),
      escapeCsv(f.statut),
      escapeCsv(f.date.toLocaleDateString("fr-FR")),
      escapeCsv(f.dateEcheance?.toLocaleDateString("fr-FR") ?? ""),
      escapeCsv(f.stripeSessionId ? "Oui" : "Non"),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const BOM = "\uFEFF";

    return new NextResponse(`${BOM}${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="factures_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    return internalServerError("export-csv-factures", error, "Impossible d'exporter les factures");
  }
}
