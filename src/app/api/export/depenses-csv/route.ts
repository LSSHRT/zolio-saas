export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError } from "@/lib/http";

function esc(val: string | number | null | undefined): string {
  if (val == null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { searchParams } = new URL(request.url);
    const mois = searchParams.get("mois"); // YYYY-MM
    const annee = searchParams.get("annee");

    const where: Record<string, unknown> = { userId };

    if (mois) {
      const [y, m] = mois.split("-").map(Number);
      where.date = { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59) };
    } else if (annee) {
      const y = parseInt(annee);
      where.date = { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) };
    }

    const depenses = await prisma.depense.findMany({
      where,
      orderBy: { date: "desc" },
    });

    const headers = ["Date", "Description", "Catégorie", "Montant"];
    const rows = depenses.map((d) => [
      esc(d.date.toLocaleDateString("fr-FR")),
      esc(d.description),
      esc(d.categorie),
      esc(d.montant.toFixed(2)),
    ]);

    const BOM = "\uFEFF";
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(`${BOM}${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="depenses_export_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    return internalServerError("export-csv-depenses", error, "Impossible d'exporter les dépenses");
  }
}
