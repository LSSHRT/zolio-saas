import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyClientPortalToken } from "@/lib/client-portal";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Token requis" }, { status: 400 });

    const payload = verifyClientPortalToken(token);

    const [devis, factures] = await Promise.all([
      prisma.devis.findMany({
        where: {
          userId: payload.userId,
          client: { email: payload.email },
        },
        include: {
          client: { select: { nom: true, email: true, telephone: true, adresse: true } },
          lignesNorm: { orderBy: { position: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.facture.findMany({
        where: {
          userId: payload.userId,
          emailClient: payload.email,
        },
        include: {
          devis: {
            include: {
              lignesNorm: { orderBy: { position: "asc" } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      clientEmail: payload.email,
      devis: devis.map((d) => ({
        numero: d.numero,
        date: d.date.toISOString(),
        statut: d.statut,
        totalTTC: d.lignesNorm.reduce((s, l) => s + Number(l.totalLigne), 0),
        optionLabel: d.optionLabel,
      })),
      factures: factures.map((f) => ({
        numero: f.numero,
        date: f.date.toISOString(),
        statut: f.statut,
        totalTTC: Number(f.totalTTC),
        totalHT: Number(f.totalHT),
        tva: Number(f.tva),
        dateEcheance: f.dateEcheance?.toISOString(),
        lignes: f.devis?.lignesNorm?.map((l) => ({
          nomPrestation: l.nomPrestation,
          quantite: l.quantite,
          unite: l.unite,
          prixUnitaire: l.prixUnitaire,
          totalLigne: l.totalLigne,
        })) ?? [],
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur interne" }, { status: 401 });
  }
}
