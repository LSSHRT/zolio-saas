import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, rateLimitResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

const MAX_ROWS = 500;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60_000; // 1 minute

interface ImportError {
  row: number;
  message: string;
}

function parseCsv(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(";").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) =>
    line.split(";").map((v) => v.trim().replace(/^"|"$/g, ""))
  );

  return { headers, rows };
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    // Rate limit: 5 imports per minute
    const rl = rateLimit(`clients-import:${userId}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier CSV fourni" }, { status: 400 });
    }

    const content = await file.text();
    const { headers, rows } = parseCsv(content);

    if (headers.length === 0 || rows.length === 0) {
      return NextResponse.json({ error: "Le fichier CSV est vide" }, { status: 400 });
    }

    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Maximum ${MAX_ROWS} lignes par import (${rows.length} détectées)` },
        { status: 400 }
      );
    }

    // Map column indices
    const nomIdx = headers.findIndex((h) => h.toLowerCase() === "nom");
    const emailIdx = headers.findIndex((h) => h.toLowerCase() === "email");
    const telIdx = headers.findIndex((h) => h.toLowerCase() === "téléphone" || h.toLowerCase() === "telephone");
    const adresseIdx = headers.findIndex((h) => h.toLowerCase() === "adresse");

    if (nomIdx === -1) {
      return NextResponse.json(
        { error: "Colonne 'Nom' introuvable dans le CSV" },
        { status: 400 }
      );
    }

    const errors: ImportError[] = [];
    const validRows: { nom: string; email: string; telephone: string; adresse: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +1 for 0-index, +1 for header

      const nom = row[nomIdx]?.trim() || "";

      if (!nom) {
        errors.push({ row: rowNum, message: "Le nom est requis" });
        continue;
      }

      validRows.push({
        nom,
        email: emailIdx >= 0 ? (row[emailIdx]?.trim() || "") : "",
        telephone: telIdx >= 0 ? (row[telIdx]?.trim() || "") : "",
        adresse: adresseIdx >= 0 ? (row[adresseIdx]?.trim() || "") : "",
      });
    }

    let imported = 0;
    if (validRows.length > 0) {
      const result = await prisma.client.createMany({
        data: validRows.map((r) => ({ userId, ...r })),
        skipDuplicates: true,
      });
      imported = result.count;
    }

    return NextResponse.json({ imported, errors });
  } catch (error) {
    return internalServerError("clients-import", error, "Impossible d'importer les clients");
  }
}
