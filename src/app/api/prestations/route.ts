import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError } from "@/lib/http";
import { buildPrestationCreateData, mapPrestationForClient } from "@/lib/prestations";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const prestations = await prisma.prestation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(prestations.map(mapPrestationForClient));
  } catch (error) {
    return internalServerError("prestations-get", error, "Impossible de récupérer les prestations");
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const body = await request.json();

    if (Array.isArray(body)) {
      const data = body.map((item) => buildPrestationCreateData(userId, item));
      await prisma.prestation.createMany({ data });
      return NextResponse.json({ success: true, count: data.length });
    }

    const prestation = await prisma.prestation.create({
      data: buildPrestationCreateData(userId, body),
    });

    return NextResponse.json(mapPrestationForClient(prestation));
  } catch (error) {
    return internalServerError("prestations-post", error, "Impossible d'ajouter la prestation");
  }
}
