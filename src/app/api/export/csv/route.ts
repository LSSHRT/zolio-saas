import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/http";

export const dynamic = "force-dynamic";

// GET — Exporter les devis en CSV
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const devis = await prisma.devis.findMany({
      where: { userId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });

    // En-têtes CSV
    const headers = [
      "Numéro",
      "Date",
      "Client",
      "Email client",
      "Statut",
      "Remise (%)",
      "Acompte (%)",
      "TVA (%)",
      "Date début",
      "Date fin",
    ];

    // Lignes CSV
    const rows = devis.map((d) => [
      d.numero,
      d.date.toLocaleDateString("fr-FR"),
      d.client?.nom || "",
      d.client?.email || "",
      d.statut,
      String(d.remise || 0),
      String(d.acompte || 0),
      String(d.tva || 0),
      d.dateDebut?.toLocaleDateString("fr-FR") || "",
      d.dateFin?.toLocaleDateString("fr-FR") || "",
    ]);

    // Générer le CSV
    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(";")),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="zolio-devis-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("export-csv-error", error);
    return jsonError("Erreur lors de l'export CSV", 500);
  }
}
