import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });
    
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    await prisma.depense.deleteMany({
      where: { id, userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE depense:", error);
    return NextResponse.json({ error: "Impossible de supprimer la dépense", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}