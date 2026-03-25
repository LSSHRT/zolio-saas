import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateDevisPDF } from "@/lib/generatePdf";
import { sendDevisEmail } from "@/lib/sendEmail";
import { getCompanyProfile } from "@/lib/company";
import { internalServerError } from "@/lib/http";
import { createPublicDevisToken } from "@/lib/public-devis-token";
import { generateSequentialDocumentNumber } from "@/lib/document-number";

type LignePayload = {
  isOptional?: boolean;
  nomPrestation?: string;
  prixUnitaire?: number;
  quantite?: number;
  totalLigne?: number;
  tva?: string;
  unite?: string;
};

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

function parseLignes(value: unknown): LignePayload[] {
  if (typeof value === "string") {
    return JSON.parse(value) as LignePayload[];
  }

  if (Array.isArray(value)) {
    return value as LignePayload[];
  }

  return [];
}

function parsePhotos(value: unknown): string[] {
  if (typeof value === "string") {
    return JSON.parse(value) as string[];
  }

  if (Array.isArray(value)) {
    return value as string[];
  }

  return [];
}

function getLineTotal(line: LignePayload) {
  return Number(line.totalLigne ?? Number(line.quantite ?? 0) * Number(line.prixUnitaire ?? 0));
}

function normalizeLignes(lines: LignePayload[]) {
  return lines.map((line) => ({
    isOptional: Boolean(line.isOptional),
    nomPrestation: line.nomPrestation || "Prestation",
    prixUnitaire: Number(line.prixUnitaire ?? 0),
    quantite: Number(line.quantite ?? 1),
    totalLigne: getLineTotal(line),
    tva: line.tva,
    unite: line.unite || "U",
  }));
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    // Parse query parameters for search, pagination, and filtering
    const url = new URL(request.url);
    const searchQuery = url.searchParams.get("q")?.trim() || "";
    const statusFilter = url.searchParams.get("statut")?.trim() || "";
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get("limit") || "50", 10) || 50));
    const offset = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { userId };

    // Status filter
    if (statusFilter) {
      where.statut = statusFilter;
    }

    // Search filter (by client name or devis number)
    if (searchQuery) {
      where.OR = [
        { numero: { contains: searchQuery, mode: "insensitive" } },
        { client: { nom: { contains: searchQuery, mode: "insensitive" } } },
      ];
    }

    // Get total count for pagination metadata
    const totalCount = await prisma.devis.count({ where });

    // Fetch paginated results
    const devis = await prisma.devis.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    });

    const mapped = devis.map((d) => {
      const parsedLignes = parseLignes(d.lignes);
      const remiseGlobale = d.remise || 0;
      const tvaGlobale = d.tva || 0;

      const totalHTBase = parsedLignes
        .filter((line) => !line.isOptional)
        .reduce((sum, line) => sum + getLineTotal(line), 0);
      const totalHT = totalHTBase * (1 - remiseGlobale / 100);

      const totalTTC = parsedLignes
        .filter((line) => !line.isOptional)
        .reduce((sum, line) => {
          const ligneTva = Number.parseFloat(line.tva || tvaGlobale.toString()) || 0;
          const ligneTotal = getLineTotal(line);
          return sum + ligneTotal * (1 + ligneTva / 100);
        }, 0) * (1 - remiseGlobale / 100);

      return {
        numero: d.numero,
        client: d.client ? d.client.nom : "Inconnu",
        nomClient: d.client ? d.client.nom : "Inconnu",
        emailClient: d.client ? d.client.email : "",
        clientId: d.clientId,
        date: d.date.toLocaleDateString("fr-FR"),
        statut: d.statut,
        lignes: parsedLignes,
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
    });
  } catch (error) {
    return internalServerError("devis-get", error, "Impossible de récupérer les devis");
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

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

    const finalTotalTTC = parsedLignes
      .filter((line) => !line.isOptional)
      .reduce((sum, line) => {
        const ligneTva = Number.parseFloat(line.tva || tvaGlobale.toString()) || 0;
        const ligneTotal = getLineTotal(line);
        return sum + ligneTotal * (1 + ligneTva / 100);
      }, 0) * (1 - remiseGlobale / 100);

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
        devis = await prisma.devis.create({
          data: {
            userId,
            numero,
            client: { connect: { id: finalClientId } },
            lignes: parsedLignes,
            remise: remiseGlobale,
            acompte: Number.parseFloat(String(acompte || 0)),
            tva: tvaGlobale,
            photos: parsePhotos(photos),
            statut: "En attente",
          },
          include: { client: true },
        });
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
          const totalHTBase = parsedLignes
            .filter((line) => !line.isOptional)
            .reduce((sum, line) => sum + getLineTotal(line), 0);
          const montantRemise = totalHTBase * remiseGlobale / 100;
          const totalHT = totalHTBase - montantRemise;
          const normalizedLignes = normalizeLignes(parsedLignes);

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
            totalTTC: finalTotalTTC.toFixed(2),
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
            finalTotalTTC.toFixed(2),
            pdfBuffer,
          );

          emailSent = true;
        }
      } catch (emailErr) {
        console.error("Email non envoyé (erreur):", emailErr);
        emailSkippedReason = "send_failed";
      }
    }

    return NextResponse.json({
      numero: devis.numero,
      client: devis.client ? devis.client.nom : "",
      date: devis.date.toLocaleDateString("fr-FR"),
      statut: devis.statut,
      totalTTC: finalTotalTTC.toFixed(2),
      signingToken: createPublicDevisToken(devis.numero, userId),
      emailSent,
      emailSkippedReason,
    });
  } catch (error) {
    return internalServerError("devis-post", error, "Impossible de créer le devis");
  }
}
