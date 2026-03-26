/**
 * Helper pour les notifications Web Push
 */

import webpush from "web-push";

// Configurer VAPID
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL || "contact@zolio.site"}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

type PushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
};

// Stockage en mémoire des abonnements (en prod, utiliser la DB)
// Pour simplifier, on stocke les abonnements par userId dans un Map
const subscriptions = new Map<string, PushSubscription[]>();

export function saveSubscription(userId: string, subscription: PushSubscription) {
  const existing = subscriptions.get(userId) || [];
  // Éviter les doublons
  const filtered = existing.filter((s) => s.endpoint !== subscription.endpoint);
  filtered.push(subscription);
  subscriptions.set(userId, filtered);
}

export function getSubscriptions(userId: string): PushSubscription[] {
  return subscriptions.get(userId) || [];
}

export function removeSubscription(userId: string, endpoint: string) {
  const existing = subscriptions.get(userId) || [];
  subscriptions.set(
    userId,
    existing.filter((s) => s.endpoint !== endpoint)
  );
}

export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const subs = getSubscriptions(userId);
  let sent = 0;
  let failed = 0;

  const notificationPayload = JSON.stringify(payload);

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, notificationPayload);
      sent++;
    } catch (error: unknown) {
      failed++;
      const statusCode = (error as { statusCode?: number })?.statusCode;
      // 410 = Gone (l'abonnement a expiré)
      if (statusCode === 410 || statusCode === 404) {
        removeSubscription(userId, sub.endpoint);
      }
    }
  }

  return { sent, failed };
}

export async function sendPushToAll(
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { sent: totalSent, failed: totalFailed };
}
