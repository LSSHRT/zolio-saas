import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { internalServerError, jsonError } from "@/lib/http";

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

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(notes.map(mapNote));
  } catch (error) {
    return internalServerError("notes-get", error, "Impossible de récupérer les notes");
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const data = (await req.json()) as NotePayload;
    const titre = normalizeText(data.titre);
    const contenu = normalizeText(data.contenu);

    if (!titre && !contenu) {
      return jsonError("Titre ou contenu requis", 400);
    }
    
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
