import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const prestations = await prisma.prestation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = prestations.map((p: any) => ({
      id: p.id,
      nom: p.nom,
      description: p.description || "",
      unite: p.unite || "",
      prix: p.prix,
      cout: p.cout || 0,
      stock: p.stock || 0
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Erreur GET prestations:", error);
    return NextResponse.json({ error: "Impossible de récupérer les prestations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const body = await request.json();

    if (Array.isArray(body)) {
      const data = body.map(item => ({
        userId,
        nom: item.nom,
        description: item.description || "",
        unite: item.unite || "",
        prix: parseFloat(item.prix),
        cout: parseFloat(item.cout || 0),
        stock: parseInt(item.stock || 0)
      }));
      await prisma.prestation.createMany({ data });
      return NextResponse.json({ success: true, count: data.length });
    }

    const { nom, description, unite, prix, cout, stock } = body;
    const prestation = await prisma.prestation.create({
      data: {
        userId,
        nom,
        description: description || "",
        unite: unite || "",
        prix: parseFloat(prix),
        cout: parseFloat(cout || 0),
        stock: parseInt(stock || 0)
      }
    });

    return NextResponse.json({
      id: prestation.id,
      nom: prestation.nom,
      description: prestation.description || "",
      unite: prestation.unite || "",
      prix: prestation.prix,
      cout: prestation.cout || 0,
      stock: prestation.stock || 0
    });
  } catch (error) {
    console.error("Erreur POST prestation:", error);
    return NextResponse.json({ error: "Impossible d'ajouter la prestation" }, { status: 500 });
  }
}