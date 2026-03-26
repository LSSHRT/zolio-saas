import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

type DomainPayload = {
  domain?: string;
  company?: string;
  trade?: string;
  city?: string;
};

function normalizeDomain(value: string): string {
  return value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim();
}

// GET — Liste les domaines
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const domains = await prisma.prospectDomain.findMany({
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      total: domains.length,
      unused: domains.filter((d) => !d.used).length,
      used: domains.filter((d) => d.used).length,
    };

    return NextResponse.json({ domains, stats });
  } catch (error) {
    return internalServerError("prospect-domains-get", error, "Impossible de récupérer les domaines");
  }
}

// POST — Ajoute un ou plusieurs domaines
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const body = await request.json();

    // Supporte un tableau ou un objet unique
    const items: DomainPayload[] = Array.isArray(body) ? body : [body];
    const results: { domain: string; status: string }[] = [];

    for (const item of items) {
      const domain = normalizeDomain(item.domain || "");

      if (!domain || !domain.includes(".")) {
        results.push({ domain: item.domain || "", status: "invalid" });
        continue;
      }

      try {
        await prisma.prospectDomain.create({
          data: {
            domain,
            company: item.company?.trim() || null,
            trade: item.trade?.trim() || null,
            city: item.city?.trim() || null,
            source: "Manual",
          },
        });
        results.push({ domain, status: "created" });
      } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("Unique constraint")) {
          results.push({ domain, status: "exists" });
        } else {
          results.push({ domain, status: "error" });
        }
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return internalServerError("prospect-domains-post", error, "Impossible d'ajouter le domaine");
  }
}

// DELETE — Supprime un domaine
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const { domain } = await request.json();

    if (!domain) return jsonError("Domaine requis", 400);

    await prisma.prospectDomain.deleteMany({
      where: { domain: normalizeDomain(domain) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("prospect-domains-delete", error, "Impossible de supprimer le domaine");
  }
}
