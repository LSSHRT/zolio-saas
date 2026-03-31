import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateDevisPDF } from "@/lib/generatePdf";
import { sendDevisEmail } from "@/lib/sendEmail";
import { getCompanyProfile } from "@/lib/company";
import { internalServerError, rateLimitResponse } from "@/lib/http";
import { createPublicDevisToken } from "@/lib/public-devis-token";
import { generateSequentialDocumentNumber } from "@/lib/document-number";
import {
  parseLignes,
  createLignesForDevis,
  normalizeLigneForOutput,
  computeTotals,
  type LignePayload,
} from "@/lib/devis-lignes";
import { rateLimit } from "@/lib/rate-limit";
import { uploadPhotos } from "@/lib/blob-photos";
import { sendPushNotification } from "@/lib/push-notifications";
import { logError } from "@/lib/logger";

type CreateDevisBody = {
  acompte?: number | string;
  client?: string | { nom?: string };
  clientId?: string;
  lignes?: unknown;
  photos?: unknown;
  remise?: number | string;
  sendNow?: boolean;
  tva?: number | string;
};

function parsePhotos(value: unknown): string[] {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as string[];
    } catch {
      return [];
    }
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    // Rate limit : 60 requêtes/min par utilisateur
    const rl = rateLimit(`devis-get:${userId}`, 60, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("q")?.trim() || "";
    const statusFilter = url.searchParams.get("statut")?.trim() || "";
    const tagFilter = url.searchParams.get("tag")?.trim() || "";
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "50", 10) || 50));
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = { userId };

    if (statusFilter) {
      where.statut = statusFilter;
    }

    if (searchQuery) {
      where.OR = [
        { numero: { contains: searchQuery, mode: "insensitive" } },
        { client: { nom: { contains: searchQuery, mode: "insensitive" } } },
      ];
    }

    if (tagFilter) {
      where.tags = { array_contains: tagFilter };
    }

    const totalCount = await prisma.devis.count({ where });

    const devis = await prisma.devis.findMany({
      where,
      include: { client: true, lignesNorm: { orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    const mapped = devis.map((d) => {
      // Utilise lignesNorm si disponible, sinon fallback sur JSON
      let lignes: LignePayload[];
      if (d.lignesNorm.length > 0) {
        lignes = d.lignesNorm.map((ligne) => ({
          isOptional: ligne.isOptional,
          nomPrestation: ligne.nomPrestation,
          prixUnitaire: ligne.prixUnitaire,
          quantite: ligne.quantite,
          totalLigne: ligne.totalLigne,
          tva: ligne.tva,
          unite: ligne.unite,
        }));
      } else {
        lignes = parseLignes(d.lignes);
      }

      const remiseGlobale = d.remise || 0;
      const tvaGlobale = d.tva || 0;
      const { totalHT, totalTTC } = computeTotals(lignes, tvaGlobale, remiseGlobale);

      return {
        numero: d.numero,
        client: d.client ? d.client.nom : "Inconnu",
        nomClient: d.client ? d.client.nom : "Inconnu",
        emailClient: d.client ? d.client.email : "",
        clientId: d.clientId,
        date: d.date.toLocaleDateString("fr-FR"),
        statut: d.statut,
        lignes: lignes.map(normalizeLigneForOutput),
        remise: remiseGlobale,
        acompte: d.acompte || 0,
        tva: `${tvaGlobale}%`,
        totalHT: totalHT.toFixed(2),
        totalTTC: totalTTC.toFixed(2),
        signature: d.signature || "",
        signingToken: createPublicDevisToken(d.numero, userId),
        photos: parsePhotos(d.photos),
        dateDebut: d.dateDebut ? d.dateDebut.toISOString().split("T")[0] : "",
        dateFin: d.dateFin ? d.dateFin.toISOString().split("T")[0] : "",
      };
    });

    return NextResponse.json({
      data: mapped,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: offset + limit < totalCount,
      },
    }, {
      headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' },
    });
  } catch (error) {
    return internalServerError("devis-get", error, "Impossible de récupérer les devis");
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    // Rate limit : 30 créations/min par utilisateur
    const rl = rateLimit(`devis-post:${userId}`, 30, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const body = (await request.json()) as CreateDevisBody;
    const { client, clientId, lignes, remise, acompte, tva, photos, sendNow } = body;

    let finalClientId = clientId;
    const clientName = typeof client === "string" ? client : client?.nom || "";

    if (!finalClientId && clientName) {
      const existingClient = await prisma.client.findFirst({
        where: { userId, nom: clientName },
      });

      if (existingClient) {
        finalClientId = existingClient.id;
      } else {
        const newClient = await prisma.client.create({
          data: { userId, nom: clientName },
        });
        finalClientId = newClient.id;
      }
    }

    if (!finalClientId) {
      return NextResponse.json({ error: "Client requis pour créer le devis" }, { status: 400 });
    }

    const parsedLignes = parseLignes(lignes);
    const tvaGlobale = Number.parseFloat(String(tva || 0));
    const remiseGlobale = Number.parseFloat(String(remise || 0));
    const { totalTTC } = computeTotals(parsedLignes, tvaGlobale, remiseGlobale);

    let devis;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const numero = await generateSequentialDocumentNumber({
        prefix: "DEV",
        userId,
        findLatest: (basePrefix) =>
          prisma.devis.findFirst({
            where: { userId, numero: { startsWith: basePrefix } },
            orderBy: { numero: "desc" },
            select: { numero: true },
          }),
      });

      try {
        // Upload des photos vers Vercel Blob (au lieu de base64)
        const parsedPhotos = parsePhotos(photos);
        const photoUrls = parsedPhotos.length > 0
          ? await uploadPhotos(parsedPhotos, numero)
          : [];

        devis = await prisma.devis.create({
          data: {
            userId,
            numero,
            client: { connect: { id: finalClientId } },
            remise: remiseGlobale,
            acompte: Number.parseFloat(String(acompte || 0)),
            tva: tvaGlobale,
            photos: photoUrls,
            statut: "En attente",
          },
          include: { client: true },
        });

        // Créer les lignes normalisées
        await createLignesForDevis(devis.id, parsedLignes);
        break;
      } catch (error) {
        const isUniqueConflict =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

        if (!isUniqueConflict || attempt === 4) {
          throw error;
        }
      }
    }

    if (!devis) {
      throw new Error("Impossible de créer le devis");
    }

    const shouldAttemptSend = sendNow !== false;
    let emailSent = false;
    let emailSkippedReason: string | undefined = shouldAttemptSend ? undefined : "creation_only";

    if (shouldAttemptSend) {
      try {
        const user = await currentUser();

        if (!user) {
          emailSkippedReason = "user_unavailable";
        } else if (!devis.client?.email) {
          emailSkippedReason = "missing_client_email";
        } else if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
          emailSkippedReason = "smtp_not_configured";
        } else {
          const entreprise = getCompanyProfile(user);
          const { totalHT } = computeTotals(parsedLignes, tvaGlobale, remiseGlobale);
          const normalizedLignes = parsedLignes.map(normalizeLigneForOutput);

          const pdfBuffer = await generateDevisPDF({
            numeroDevis: devis.numero,
            date: devis.date.toLocaleDateString("fr-FR"),
            client: {
              nom: devis.client.nom,
              email: devis.client.email,
              telephone: devis.client.telephone || "",
              adresse: devis.client.adresse || "",
            },
            entreprise: {
              nom: entreprise.nom,
              email: entreprise.email,
              telephone: entreprise.telephone,
              adresse: entreprise.adresse,
              siret: entreprise.siret,
              color: entreprise.color,
              logo: entreprise.logo,
              iban: entreprise.iban,
              bic: entreprise.bic,
              legal: entreprise.legal,
              statut: entreprise.statut,
              assurance: entreprise.assurance,
              cgv: entreprise.cgv,
            },
            lignes: normalizedLignes,
            totalHT: totalHT.toFixed(2),
            tva: tvaGlobale.toString(),
            totalTTC: totalTTC.toFixed(2),
            acompte: devis.acompte?.toString() || "",
            remise: remiseGlobale.toString(),
            statut: "En attente",
            signatureBase64: "",
            photos: parsePhotos(devis.photos),
          });

          await sendDevisEmail(
            devis.client.email,
            devis.client.nom,
            devis.numero,
            totalTTC.toFixed(2),
            pdfBuffer,
          );

          emailSent = true;
        }
      } catch (emailErr) {
        logError("devis-email", emailErr, "Email non envoyé (erreur):");
        emailSkippedReason = "send_failed";
      }
    }

    // Notification push à l'artisan
    sendPushNotification(userId, {
      title: "📝 Devis créé",
      body: `Devis ${devis.numero} pour ${devis.client ? devis.client.nom : "un client"} — ${totalTTC.toFixed(2)}€`,
      url: `/devis/${devis.numero}`,
      tag: `devis-created-${devis.numero}`,
    }).catch(() => {});

    return NextResponse.json({
      numero: devis.numero,
      client: devis.client ? devis.client.nom : "",
      date: devis.date.toLocaleDateString("fr-FR"),
      statut: devis.statut,
      totalTTC: totalTTC.toFixed(2),
      signingToken: createPublicDevisToken(devis.numero, userId),
      emailSent,
      emailSkippedReason,
    });
  } catch (error) {
    return internalServerError("devis-post", error, "Impossible de créer le devis");
  }
}
