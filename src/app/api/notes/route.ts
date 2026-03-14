import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const formattedNotes = notes.map(note => ({
      id: note.id,
      titre: note.titre,
      contenu: note.contenu,
      date: note.date.toLocaleDateString("fr-FR"),
    }));

    return NextResponse.json(formattedNotes);
  } catch (error) {
    console.error("Erreur GET /api/notes:", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const data = await req.json();
    
    const newNote = await prisma.note.create({
      data: {
        userId,
        titre: data.titre,
        contenu: data.contenu,
      }
    });

    return NextResponse.json({ success: true, id: newNote.id });
  } catch (error) {
    console.error("Erreur POST /api/notes:", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}
