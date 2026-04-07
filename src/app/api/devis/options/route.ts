import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitResponse, internalServerError, jsonError } from "@/lib/http";
import {
  normalizeLigneForOutput,
  computeTotals,
} from "@/lib/devis-lignes";
import { z } from "zod";

const optionSchema = z.object({
  label: z.enum(["basique", "standard", "premium"]),
  clientId: z.string(),
  lignes: z.array(
    z.object({
      nomPrestation: z.string(),
      unite: z.string().default("U"),
      quantite: z.number().default(1),
      prixUnitaire: z.number().default(0),
      tva: z.string().default("20"),
      isOptional: z.boolean().default(false),
    })
  ),
  remise: z.number().default(0),
  tva: z.number().default(20),
  notes: z.string().optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  signature: z.string().optional(),
  tags: z.array(z.string()).optional(),
  photos: z.array(z.any()).optional(),
});

const optionsCreateSchema = z.object({
  options: z.array(optionSchema).min(1).max(3),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const rl = rateLimit(`devis-options-post:${userId}`, 10, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const body = await request.json();
    const parsed = optionsCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0].message, 400);
    }

    const { options } = parsed.data;

    const lastDevis = await prisma.devis.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { numero: true },
    });

    const nextNum = lastDevis
      ? parseInt(lastDevis.numero.replace(/^D-/, ""), 10) + 1
      : 1;

    const parentLignes = options[0].lignes.map((l, i) => ({
      ...l,
      position: i,
    }));

    const parent = await prisma.devis.create({
      data: {
        userId,
        numero: `D-${String(nextNum).padStart(4, "0")}`,
        clientId: options[0].clientId,
        statut: "En attente",
        optionLabel: options[0].label,
        remise: options[0].remise,
        tva: options[0].tva,
        notes: options[0].notes,
        dateDebut: options[0].dateDebut ? new Date(options[0].dateDebut) : null,
        dateFin: options[0].dateFin ? new Date(options[0].dateFin) : null,
        signature: options[0].signature,
        tags: options[0].tags || [],
        photos: options[0].photos || [],
        lignesNorm: {
          create: parentLignes.map((l) => ({
            nomPrestation: l.nomPrestation,
            unite: l.unite,
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            totalLigne: Number(l.quantite) * Number(l.prixUnitaire),
            tva: l.tva,
            isOptional: l.isOptional,
            position: l.position,
          })),
        },
      },
      include: {
        client: true,
        lignesNorm: { orderBy: { position: "asc" } },
      },
    });

    const suffixes = ["", "-B", "-C", "-D", "-E"];
    for (let i = 1; i < options.length; i++) {
      const opt = options[i];
      const optLignes = opt.lignes.map((l, j) => ({ ...l, position: j }));

      await prisma.devis.create({
        data: {
          userId,
          numero: `D-${String(nextNum).padStart(4, "0")}${suffixes[i]}`,
          clientId: opt.clientId,
          statut: "En attente",
          optionLabel: opt.label,
          devisParentId: parent.id,
          remise: opt.remise,
          tva: opt.tva,
          notes: opt.notes,
          dateDebut: opt.dateDebut ? new Date(opt.dateDebut) : null,
          dateFin: opt.dateFin ? new Date(opt.dateFin) : null,
          signature: opt.signature,
          tags: opt.tags || [],
          photos: opt.photos || [],
          lignesNorm: {
            create: optLignes.map((l) => ({
              nomPrestation: l.nomPrestation,
              unite: l.unite,
              quantite: l.quantite,
              prixUnitaire: l.prixUnitaire,
              totalLigne: Number(l.quantite) * Number(l.prixUnitaire),
              tva: l.tva,
              isOptional: l.isOptional,
              position: l.position,
            })),
          },
        },
      });
    }

    const allOptions = await prisma.devis.findMany({
      where: { OR: [{ id: parent.id }, { devisParentId: parent.id }] },
      include: { client: true, lignesNorm: { orderBy: { position: "asc" } } },
      orderBy: { optionLabel: "asc" },
    });

    return NextResponse.json({
      success: true,
      devis: allOptions.map((d) => ({
        id: d.id,
        numero: d.numero,
        optionLabel: d.optionLabel,
        statut: d.statut,
        client: d.client,
        remise: d.remise,
        tva: d.tva,
        totalHT: d.lignesNorm.reduce((s, l) => s + Number(l.totalLigne), 0),
        totalTTC: computeTotals(d.lignesNorm as any, Number(d.remise) ?? 0, Number(d.tva) ?? 20).totalTTC,
        createdAt: d.createdAt.toISOString(),
        lignes: d.lignesNorm.map((l) => normalizeLigneForOutput(l)),
      })),
    });
  } catch (error) {
    return internalServerError("devis-options-post", error);
  }
}
