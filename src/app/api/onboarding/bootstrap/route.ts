import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { buildPrestationCreateData } from "@/lib/prestations";
import { getStarterCatalogForTrade, getTradeDefinition } from "@/lib/trades";
import { internalServerError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const body = await request.json().catch(() => ({}));
    const trade = getTradeDefinition(body?.trade);
    if (!trade) {
      return NextResponse.json({ error: "Métier invalide" }, { status: 400 });
    }

    const existingPrestations = await prisma.prestation.findMany({
      where: { userId },
      select: { nom: true, unite: true },
    });

    const existingKeys = new Set(
      existingPrestations.map((item) => `${item.nom.toLowerCase()}::${(item.unite || "").toLowerCase()}`),
    );

    const starterCatalog = getStarterCatalogForTrade(trade.key);
    const data = starterCatalog
      .filter((item) => !existingKeys.has(`${item.nom.toLowerCase()}::${item.unite.toLowerCase()}`))
      .map((item) => buildPrestationCreateData(userId, item));

    if (data.length > 0) {
      await prisma.prestation.createMany({ data });
    }

    return NextResponse.json({
      success: true,
      imported: data.length,
      total: starterCatalog.length,
      trade: trade.key,
      tradeLabel: trade.label,
    });
  } catch (error) {
    return internalServerError(
      "onboarding-bootstrap-post",
      error,
      "Impossible d'importer le starter métier",
    );
  }
}
