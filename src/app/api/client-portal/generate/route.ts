import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createClientPortalToken } from "@/lib/client-portal";
import { rateLimit } from "@/lib/rate-limit";
import { rateLimitResponse, jsonError } from "@/lib/http";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const rl = rateLimit(`client-portal-gen:${userId}`, 10, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const { clientEmail } = await req.json();
    if (!clientEmail) return jsonError("Email client requis", 400);

    const token = createClientPortalToken(clientEmail, userId);
    if (!token) return jsonError("Configuration manquante", 500);

    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const link = `${origin}/espace-client/${token}`;

    return NextResponse.json({ link });
  } catch {
    return jsonError("Erreur interne", 500);
  }
}
