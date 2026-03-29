import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { internalServerError, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { noteUpdateSchema, zodErrorResponse } from "@/lib/validations";

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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { id } = await params;
    if (!id) return jsonError("ID manquant", 400);

    const note = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!note) {
      return jsonError("Note introuvable ou non autorisée", 404);
    }

    await prisma.note.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return internalServerError("notes-delete", error, "Impossible de supprimer la note");
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { id } = await params;
    const json = await req.json();
    const parsed = noteUpdateSchema.safeParse(json);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    if (!id) {
      return jsonError("ID manquant", 400);
    }

    const note = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!note) {
      return jsonError("Note introuvable", 404);
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        titre: parsed.data.titre,
        contenu: parsed.data.contenu,
      }
    });

    return NextResponse.json({ success: true, data: mapNote(updatedNote) });
  } catch (error) {
    return internalServerError("notes-put", error, "Impossible de modifier la note");
  }
}
