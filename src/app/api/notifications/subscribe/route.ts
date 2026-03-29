import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { saveSubscription, removeSubscription } from "@/lib/push-notifications";
import { internalServerError, jsonError } from "@/lib/http";

// POST — S'abonner aux notifications push
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const subscription = await request.json();

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return jsonError("Abonnement invalide", 400);
    }

    saveSubscription(userId, subscription);

    return NextResponse.json({ success: true, message: "Notifications activées" });
  } catch (error) {
    return internalServerError("push-subscribe", error, "Erreur lors de l'abonnement");
  }
}

// DELETE — Se désabonner
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const { endpoint } = await request.json();
    if (endpoint) {
      removeSubscription(userId, endpoint);
    }

    return NextResponse.json({ success: true, message: "Notifications désactivées" });
  } catch (error) {
    return internalServerError("push-unsubscribe", error, "Erreur");
  }
}
