import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitResponse, internalServerError } from "@/lib/http";
import { getTradeBundlesForTrade, getTradeDefinition, type TradeKey } from "@/lib/trades";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const rl = rateLimit(`templates-install:${userId}`, 5, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const body = await req.json().catch(() => ({}));
    const tradeKey = (body?.trade as TradeKey) || "peintre";
    const trade = getTradeDefinition(tradeKey);
    if (!trade) {
      return NextResponse.json({ error: "Métier invalide" }, { status: 400 });
    }

    // Check existing templates to avoid duplicates
    const existing = await prisma.devisTemplate.findMany({
      where: { userId },
      select: { nom: true },
    });
    const existingNames = new Set(existing.map((t) => t.nom.toLowerCase()));

    const bundles = getTradeBundlesForTrade(tradeKey);

    let installed = 0;
    const installedNames: string[] = [];

    for (const bundle of bundles) {
      if (existingNames.has(bundle.nom.toLowerCase())) continue;

      await prisma.devisTemplate.create({
        data: {
          userId,
          nom: bundle.nom,
          description: bundle.description,
          tva: 20,
          remise: 0,
          lignes: {
            create: bundle.lignes.map((ligne, i) => ({
              nomPrestation: ligne.nomPrestation,
              unite: ligne.unite,
              quantite: ligne.quantite,
              prixUnitaire: ligne.prixUnitaire,
              tva: "20",
              isOptional: false,
              position: i,
            })),
          },
        },
      });
      installed++;
      installedNames.push(bundle.nom);
    }

    return NextResponse.json({
      success: true,
      installed,
      total: bundles.length,
      trade: trade.label,
      installedNames,
    });
  } catch (error) {
    return internalServerError("templates-install-defaults", error);
  }
}
