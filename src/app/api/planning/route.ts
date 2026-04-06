export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, jsonError } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const url = new URL(request.url);
    const month = Number.parseInt(url.searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = Number.parseInt(url.searchParams.get("year") || String(new Date().getFullYear()));

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    // Factures avec date d'échéance dans le mois
    const factures = await prisma.facture.findMany({
      where: {
        userId,
        dateEcheance: { gte: startOfMonth, lte: endOfMonth },
      },
      select: {
        id: true,
        numero: true,
        nomClient: true,
        totalTTC: true,
        statut: true,
        dateEcheance: true,
      },
      orderBy: { dateEcheance: "asc" },
    });

    // Devis avec dateFin dans le mois
    const devis = await prisma.devis.findMany({
      where: {
        userId,
        dateFin: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { client: true },
      orderBy: { dateFin: "asc" },
    });

    // Factures récurrentes actives
    const recurrentes = await prisma.factureRecurrente.findMany({
      where: {
        userId,
        actif: true,
        prochaineDate: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { client: true },
      orderBy: { prochaineDate: "asc" },
    });

    const events = [
      ...factures.map((f) => ({
        id: `facture-${f.id}`,
        type: "facture" as const,
        date: f.dateEcheance!.toISOString(),
        title: `Échéance ${f.numero}`,
        subtitle: f.nomClient,
        amount: f.totalTTC,
        statut: f.statut,
        href: `/factures/${f.numero}`,
        tone: f.statut === "Payée" ? "emerald" : f.statut === "En retard" ? "rose" : "amber",
      })),
      ...devis.map((d) => ({
        id: `devis-${d.id}`,
        type: "devis" as const,
        date: d.dateFin!.toISOString(),
        title: `Fin devis ${d.numero}`,
        subtitle: d.client?.nom || "",
        amount: null,
        statut: d.statut,
        href: `/devis/${d.numero}`,
        tone: d.statut === "Accepté" || d.statut === "Signé" ? "emerald" : "slate",
      })),
      ...recurrentes.map((r) => ({
        id: `recurrente-${r.id}`,
        type: "recurrente" as const,
        date: r.prochaineDate.toISOString(),
        title: `Facture récurrente — ${r.nom}`,
        subtitle: r.client?.nom || "",
        amount: r.montantTTC,
        statut: "active",
        href: `/recurrentes`,
        tone: "violet",
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ events, month, year });
  } catch (error) {
    return internalServerError("planning-get", error, "Impossible de charger le planning");
  }
}
