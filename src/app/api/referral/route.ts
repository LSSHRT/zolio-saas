import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { internalServerError, jsonError, rateLimitResponse } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

// POST — Générer un lien de parrainage
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const rl = rateLimit(`referral-post:${userId}`, 10, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Vérifier si l'utilisateur a déjà un code de parrainage
    const existingCode = user.publicMetadata?.referralCode as string | undefined;
    if (existingCode) {
      return NextResponse.json({ code: existingCode, url: `https://zolio.site?ref=${existingCode}` });
    }

    // Générer un code unique
    const code = `${userId.slice(-8)}${Date.now().toString(36)}`;

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        referralCode: code,
        referralCount: 0,
      },
    });

    return NextResponse.json({ code, url: `https://zolio.site?ref=${code}` });
  } catch (error) {
    return internalServerError("referral-post", error, "Erreur lors de la génération du code");
  }
}

// GET — Vérifier le statut de parrainage
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const rl = rateLimit(`referral-get:${userId}`, 30, 60_000);
    if (!rl.allowed) return rateLimitResponse(rl.resetAt);

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    return NextResponse.json({
      code: user.publicMetadata?.referralCode || null,
      count: user.publicMetadata?.referralCount || 0,
      isPro: user.publicMetadata?.isPro === true,
    });
  } catch (error) {
    return internalServerError("referral-get", error, "Erreur");
  }
}
