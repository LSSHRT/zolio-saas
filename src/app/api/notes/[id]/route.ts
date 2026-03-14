import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { id } = await params;
    if (!id) return new NextResponse("ID manquant", { status: 400 });

    const note = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!note) {
      return new NextResponse("Note introuvable ou non autorisée", { status: 404 });
    }

    await prisma.note.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/notes/[id]:", error);
    return new NextResponse("Erreur interne", { status: 500 });
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
    const data = await req.json();

    const note = await prisma.note.findFirst({
      where: { id, userId }
    });

    if (!note) {
      return new NextResponse("Note introuvable", { status: 404 });
    }

    await prisma.note.update({
      where: { id },
      data: {
        titre: data.titre,
        contenu: data.contenu
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur PUT /api/notes/[id]:", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}
