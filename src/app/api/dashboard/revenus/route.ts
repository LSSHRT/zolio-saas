import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const now = new Date();
    const months: { month: string; revenue: number; expenses: number }[] = [];

    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;

      const [factures, depenses] = await Promise.all([
        prisma.facture.aggregate({
          where: {
            userId,
            statut: "Payée",
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { totalTTC: true },
        }),
        prisma.depense.aggregate({
          where: {
            userId,
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { montant: true },
        }),
      ]);

      months.push({
        month: monthLabel,
        revenue: factures._sum.totalTTC || 0,
        expenses: depenses._sum.montant || 0,
      });
    }

    return NextResponse.json({ months });
  } catch (error) {
    return internalServerError("dashboard-revenus", error);
  }
}
