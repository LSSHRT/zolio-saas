import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });
    
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    const body = await request.json();
    const { nom, description, unite, prix, cout, stock } = body;

    const prestation = await prisma.prestation.updateMany({
      where: { id, userId },
      data: {
        nom,
        description: description || "",
        unite: unite || "",
        prix: parseFloat(prix),
        cout: parseFloat(cout || 0),
        stock: parseInt(stock || 0)
      }
    });

    if (prestation.count === 0) {
       return new NextResponse("Prestation non trouvée", { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur PUT prestation:", error);
    return NextResponse.json({ error: "Impossible de modifier la prestation", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });
    
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    await prisma.prestation.deleteMany({
      where: { id, userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE prestation:", error);
    return NextResponse.json({ error: "Impossible de supprimer la prestation", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}