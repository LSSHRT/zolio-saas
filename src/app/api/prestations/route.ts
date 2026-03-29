import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { buildPrestationCreateData, mapPrestationForClient } from "@/lib/prestations";
import { prestationCreateSchema, prestationBulkSchema, zodErrorResponse } from "@/lib/validations";

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

    const json = await request.json();

    if (Array.isArray(json)) {
      const parsed = prestationBulkSchema.safeParse(json);
      if (!parsed.success) return zodErrorResponse(parsed.error);
      const data = parsed.data.map((item) => buildPrestationCreateData(userId, item));
      await prisma.prestation.createMany({ data });
      return NextResponse.json({ success: true, count: data.length });
    }

    const parsed = prestationCreateSchema.safeParse(json);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    const prestation = await prisma.prestation.create({
      data: buildPrestationCreateData(userId, parsed.data),
    });

    return NextResponse.json(mapPrestationForClient(prestation));
  } catch (error) {
    return internalServerError("prestations-post", error, "Impossible d'ajouter la prestation");
  }
}
