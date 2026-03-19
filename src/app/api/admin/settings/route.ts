import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAdminUser } from "@/lib/admin";
import { internalServerError, jsonError } from "@/lib/http";

const prisma = new PrismaClient();
const ALLOWED_ADMIN_SETTINGS = new Set(["cron_prospect_enabled"]);

export async function GET(req: Request) {
  try {
    await requireAdminUser();

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key || !ALLOWED_ADMIN_SETTINGS.has(key)) {
      return jsonError("Clé invalide", 400);
    }

    const setting = await prisma.adminSetting.findUnique({
      where: { key },
    });

    return NextResponse.json({ value: setting ? setting.value : null });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return jsonError("Non autorisé", 403);
    }
    return internalServerError("admin-settings-get", error);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminUser();

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined || !ALLOWED_ADMIN_SETTINGS.has(String(key))) {
      return jsonError("Clé ou valeur invalide", 400);
    }

    const setting = await prisma.adminSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return jsonError("Non autorisé", 403);
    }
    return internalServerError("admin-settings-post", error);
  }
}
