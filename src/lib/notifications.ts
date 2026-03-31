import { prisma } from "@/lib/prisma";

type NotificationTone = "violet" | "rose" | "amber" | "emerald" | "slate";

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  description: string;
  href?: string;
  tone?: NotificationTone;
}

/**
 * Crée une notification pour un utilisateur.
 * Ignorée silencieusement en cas d'erreur (non-bloquant).
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        description: params.description,
        href: params.href,
        tone: params.tone ?? "violet",
      },
    });
  } catch (error) {
    // Non-bloquant : on log mais on ne throw pas
    console.error("[createNotification]", error);
  }
}
