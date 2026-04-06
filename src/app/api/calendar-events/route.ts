import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { internalServerError, jsonError } from "@/lib/http";

// GET — événements du mois
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const url = new URL(request.url);
    const month = parseInt(url.searchParams.get("month") ?? String(new Date().getMonth() + 1));
    const year = parseInt(url.searchParams.get("year") ?? String(new Date().getFullYear()));

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const events = await prisma.calendarEvent.findMany({
      where: { userId, date: { gte: startDate, lte: endDate } },
      orderBy: [{ date: "asc" }, { heure: "asc" }],
    });

    return NextResponse.json({
      events: events.map((e) => ({
        id: e.id,
        type: "manuel" as const,
        date: e.date.toISOString(),
        heure: e.heure,
        title: e.titre,
        subtitle: e.notes || e.type,
        amount: null,
        statut: e.type,
        href: "",
        tone: e.couleur,
      })),
    });
  } catch (error: unknown) {
    return internalServerError("calendar-events-get", error);
  }
}

// POST — créer un événement
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const body = await request.json();
    const { titre, date, heure, type, couleur, notes } = body;

    if (!titre || !date) {
      return jsonError("Titre et date requis", 400);
    }

    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        titre,
        date: new Date(date),
        heure: heure || null,
        type: type || "rdv",
        couleur: couleur || "violet",
        notes: notes || null,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error: unknown) {
    return internalServerError("calendar-events-post", error);
  }
}

// DELETE — supprimer un événement
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError("Non autorisé", 401);

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return jsonError("ID requis", 400);

    await prisma.calendarEvent.deleteMany({ where: { id, userId } });
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return internalServerError("calendar-events-delete", error);
  }
}
