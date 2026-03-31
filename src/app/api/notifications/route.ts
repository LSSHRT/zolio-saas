import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { internalServerError, jsonError } from "@/lib/http";

// GET — Liste les notifications de l'utilisateur
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get("unread") === "true";
    const limit = Math.min(Number.parseInt(url.searchParams.get("limit") || "50", 10), 100);

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return internalServerError("notifications-get", error, "Impossible de charger les notifications");
  }
}

// PATCH — Marquer comme lues
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const body = await request.json();
    const { ids, markAll } = body as { ids?: string[]; markAll?: boolean };

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
    } else if (ids?.length) {
      await prisma.notification.updateMany({
        where: { userId, id: { in: ids } },
        data: { read: true },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return internalServerError("notifications-patch", error, "Erreur lors de la mise à jour");
  }
}
