export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { internalServerError, jsonError } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [], query: q });
    }

    const where = { userId };
    const ilike = `%${q}%`;

    const [devis, factures, clients, depenses] = await Promise.all([
      prisma.devis.findMany({
        where: {
          ...where,
          OR: [
            { client: { nom: { contains: q, mode: Prisma.QueryMode.insensitive } } },
            { numero: { contains: q, mode: Prisma.QueryMode.insensitive } },
          ],
        },
        select: { id: true, numero: true, clientId: true, statut: true, date: true, client: { select: { nom: true } } },
        take: 5,
      }),
      prisma.facture.findMany({
        where: {
          ...where,
          OR: [
            { nomClient: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { numero: { contains: q, mode: Prisma.QueryMode.insensitive } },
          ],
        },
        select: { id: true, numero: true, nomClient: true, statut: true, totalTTC: true, date: true },
        take: 5,
      }),
      prisma.client.findMany({
        where: {
          ...where,
          OR: [
            { nom: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
          ],
        },
        select: { id: true, nom: true, email: true },
        take: 5,
      }),
      prisma.depense.findMany({
        where: {
          ...where,
          OR: [
            { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { categorie: { contains: q, mode: Prisma.QueryMode.insensitive } },
          ],
        },
        select: { id: true, description: true, categorie: true, montant: true, date: true },
        take: 5,
      }),
    ]);

    const results = [
      ...devis.map((d) => ({
        type: "devis" as const,
        id: d.id,
        title: d.numero,
        subtitle: d.client?.nom || "",
        href: `/devis/${d.numero}`,
        amount: null,
        badge: d.statut,
        date: d.date.toISOString().split("T")[0],
      })),
      ...factures.map((f) => ({
        type: "facture" as const,
        id: f.id,
        title: f.numero,
        subtitle: f.nomClient,
        href: `/factures/${f.numero}`,
        amount: Number(f.totalTTC),
        badge: f.statut,
        date: f.date.toISOString().split("T")[0],
      })),
      ...clients.map((c) => ({
        type: "client" as const,
        id: c.id,
        title: c.nom,
        subtitle: c.email || "",
        href: `/clients/${c.id}`,
        amount: null,
        badge: "Client",
        date: null,
      })),
      ...depenses.map((d) => ({
        type: "depense" as const,
        id: d.id,
        title: d.description,
        subtitle: d.categorie || "",
        href: `/depenses`,
        amount: Number(d.montant),
        badge: d.categorie || "Dépense",
        date: d.date.toISOString().split("T")[0],
      })),
    ].sort((a, b) => {
      const da = a.date || "";
      const db = b.date || "";
      return db.localeCompare(da);
    });

    return NextResponse.json({ results, query: q });
  } catch (error) {
    return internalServerError("global-search", error, "Impossible de rechercher");
  }
}
