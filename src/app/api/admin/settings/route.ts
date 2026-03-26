import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin";
import { internalServerError, jsonError } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import {
  ADMIN_SETTING_KEYS,
  appendAdminAuditLog,
  getAdminSettingValue,
  setAdminSettingValue,
} from "@/lib/admin-settings";

const ALLOWED_ADMIN_SETTINGS = new Set<string>([ADMIN_SETTING_KEYS.cronProspectEnabled]);

export async function GET(req: Request) {
  try {
    await requireAdminUser();

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key || !ALLOWED_ADMIN_SETTINGS.has(key)) {
      return jsonError("Clé invalide", 400);
    }

    const value = await getAdminSettingValue(key);
    return NextResponse.json({ value });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return jsonError("Non autorisé", 403);
    }
    return internalServerError("admin-settings-get", error);
  }
}

export async function POST(req: Request) {
  try {
    const adminUser = await requireAdminUser();

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined || !ALLOWED_ADMIN_SETTINGS.has(String(key))) {
      return jsonError("Clé ou valeur invalide", 400);
    }

    const setting = await setAdminSettingValue(String(key), String(value));

    if (String(key) === ADMIN_SETTING_KEYS.cronProspectEnabled) {
      await appendAdminAuditLog({
        level: String(value) === "true" ? "success" : "warning",
        scope: "acquisition",
        action: String(value) === "true" ? "cron.enabled" : "cron.disabled",
        actor: adminUser.emailAddresses[0]?.emailAddress || adminUser.id,
        message:
          String(value) === "true"
            ? "Le robot de prospection a été activé."
            : "Le robot de prospection a été désactivé.",
      });
    }

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return jsonError("Non autorisé", 403);
    }
    return internalServerError("admin-settings-post", error);
  }
}
