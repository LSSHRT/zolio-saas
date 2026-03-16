import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return new NextResponse("Clé manquante", { status: 400 });
    }

    const setting = await prisma.adminSetting.findUnique({
      where: { key },
    });

    return NextResponse.json({ value: setting ? setting.value : null });
  } catch (error) {
    console.error("Erreur Settings GET:", error);
    return new NextResponse("Erreur serveur", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return new NextResponse("Clé ou valeur manquante", { status: 400 });
    }

    const setting = await prisma.adminSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error("Erreur Settings POST:", error);
    return new NextResponse("Erreur serveur", { status: 500 });
  }
}
