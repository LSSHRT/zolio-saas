import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { internalServerError, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { noteCreateSchema, zodErrorResponse } from "@/lib/validations";

type NotePayload = {
  titre?: string;
  contenu?: string;
};

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapNote(note: { id: string; titre: string; contenu: string; date: Date }) {
  return {
    id: note.id,
    titre: note.titre,
    contenu: note.contenu,
    date: note.date.toLocaleDateString("fr-FR"),
  };
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where: { userId },
        orderBy: [{ epingle: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.note.count({ where: { userId } }),
    ]);

    return NextResponse.json({
      data: notes.map(mapNote),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return internalServerError("notes-get", error, "Impossible de récupérer les notes");
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const json = await req.json();
    const parsed = noteCreateSchema.safeParse(json);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const { titre, contenu } = parsed.data;

    const newNote = await prisma.note.create({
      data: {
        userId,
        titre,
        contenu,
      }
    });

    return NextResponse.json({ success: true, data: mapNote(newNote) });
  } catch (error) {
    return internalServerError("notes-post", error, "Impossible d'ajouter la note");
  }
}
