import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const p = await params;
    const numero = p.numero;

    const existingFacture = await prisma.facture.findFirst({
      where: { numero, userId }
    });

    if (!existingFacture) {
      return NextResponse.json({ error: "Facture non trouvée ou non autorisée" }, { status: 404 });
    }

    await prisma.facture.delete({
      where: { id: existingFacture.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE facture:", error);
    return NextResponse.json({ error: "Impossible de supprimer la facture" }, { status: 500 });
  }
}
