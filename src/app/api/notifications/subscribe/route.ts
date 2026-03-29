import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { saveSubscription, removeSubscription } from "@/lib/push-notifications";
import { internalServerError, jsonError } from "@/lib/http";
import { pushSubscribeSchema, pushUnsubscribeSchema, zodErrorResponse } from "@/lib/validations";

// POST — S'abonner aux notifications push
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const json = await request.json();
    const parsed = pushSubscribeSchema.safeParse(json);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    saveSubscription(userId, parsed.data);

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

    const json = await request.json();
    const parsed = pushUnsubscribeSchema.safeParse(json);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    if (parsed.data.endpoint) {
      removeSubscription(userId, parsed.data.endpoint);
    }

    return NextResponse.json({ success: true, message: "Notifications désactivées" });
  } catch (error) {
    return internalServerError("push-unsubscribe", error, "Erreur");
  }
}
