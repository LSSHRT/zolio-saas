/**
 * Helper pour les notifications Web Push
 * Utilise la DB PostgreSQL pour persister les abonnements
 */

import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// Configurer VAPID
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || "contact@zolio.site"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
};

export async function saveSubscription(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function removeSubscription(userId: string, endpoint: string) {
  await prisma.pushSubscription.deleteMany({
    where: { userId, endpoint },
  });
}

export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  let sent = 0;
  let failed = 0;

  const notificationPayload = JSON.stringify(payload);

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notificationPayload
      );
      sent++;
    } catch (error: unknown) {
      failed++;
      const statusCode = (error as { statusCode?: number })?.statusCode;
      // 410 = Gone (abonnement expiré), 404 = Not Found
      if (statusCode === 410 || statusCode === 404) {
        await prisma.pushSubscription.deleteMany({
          where: { endpoint: sub.endpoint },
        });
      }
    }
  }

  return { sent, failed };
}
