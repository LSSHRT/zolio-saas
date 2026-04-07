export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, jsonError } from "@/lib/http";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const { id } = await params;

    const parent = await prisma.devis.findFirst({
      where: { id, userId },
      include: {
        client: true,
        devisOptions: {
          include: {
            client: true,
            lignesNorm: { orderBy: { position: "asc" } },
          },
        },
      },
    });

    if (!parent) {
      return jsonError("Devis parent introuvable", 404);
    }

    const options = parent.devisOptions.map((d) => {
      const totalHT = d.lignesNorm?.reduce((s, l) => s + Number(l.prixUnitaire) * Number(l.quantite), 0) ?? 0;
      const tvaPct = Number(d.tva ?? 0);
      const totalTTC = +(totalHT * (1 + tvaPct / 100)).toFixed(2);

      return {
        id: d.id,
        numero: d.numero,
        nomClient: d.client?.nom ?? "",
        optionLabel: d.optionLabel,
        totalTTC: String(totalTTC),
        totalHT: String(totalHT),
        tva: String(tvaPct),
        statut: d.statut,
        lignes: d.lignesNorm?.map((l) => ({
          nomPrestation: l.nomPrestation,
          quantite: l.quantite,
          prixUnitaire: l.prixUnitaire,
          totalLigne: l.totalLigne,
        })) ?? [],
      };
    });

    return NextResponse.json({ devisOptions: options });
  } catch (error) {
    return internalServerError("devis-parent-get", error, "Impossible de charger les options");
  }
}
