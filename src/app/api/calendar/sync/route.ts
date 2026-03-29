import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { calendarSyncSchema, zodErrorResponse } from "@/lib/validations";
import { logError } from "@/lib/logger";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = calendarSyncSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const { accessToken } = parsed.data;

  try {
    const devis = await prisma.devis.findMany({
      where: {
        userId,
        statut: "Accepté",
        dateDebut: { not: null },
      },
      include: { client: { select: { nom: true } } },
      orderBy: { dateDebut: "asc" },
    });

    const calendar = google.calendar({ version: "v3" });
    const authClient = new google.auth.OAuth2();
    authClient.setCredentials({ access_token: accessToken });

    let synced = 0;
    let errors = 0;

    for (const d of devis) {
      try {
        const eventId = `zolio-${d.numero}`.replace(/[^a-zA-Z0-9-]/g, "");

        await calendar.events.insert({
          auth: authClient,
          calendarId: "primary",
          requestBody: {
            id: eventId,
            summary: `Devis ${d.numero} — ${d.client.nom}`,
            description: [
              `Devis ${d.numero}`,
              `Statut: ${d.statut}`,
            ].join("\n"),
            start: { dateTime: d.dateDebut!.toISOString() },
            end: {
              dateTime: (d.dateFin ?? d.dateDebut)!.toISOString(),
            },
          },
        });

        synced++;
      } catch (err) {
        // Si l'event existe déjà on tente un update
        if ((err as { code?: number }).code === 409) {
          try {
            const eventId = `zolio-${d.numero}`.replace(/[^a-zA-Z0-9-]/g, "");

            await calendar.events.update({
              auth: authClient,
              calendarId: "primary",
              eventId,
              requestBody: {
                summary: `Devis ${d.numero} — ${d.client.nom}`,
                description: [
                  `Devis ${d.numero}`,
                  `Statut: ${d.statut}`,
                ].join("\n"),
                start: { dateTime: d.dateDebut!.toISOString() },
                end: {
                  dateTime: (d.dateFin ?? d.dateDebut)!.toISOString(),
                },
              },
            });

            synced++;
          } catch (updateErr) {
            logError("calendar-sync-update", updateErr);
            errors++;
          }
        } else {
          logError("calendar-sync-insert", err);
          errors++;
        }
      }
    }

    return NextResponse.json({ synced, errors });
  } catch (error) {
    logError("calendar-sync", error);
    return NextResponse.json(
      { error: "Erreur lors de la synchronisation" },
      { status: 500 },
    );
  }
}
