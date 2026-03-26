import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Pixel de tracking d'ouverture d'email
// Retourne un pixel transparent 1x1
export async function GET(request: Request) {
  try {
    const email = new URL(request.url).searchParams.get("e");

    if (email) {
      // Enregistrer l'ouverture dans la DB
      await prisma.prospectMail.updateMany({
        where: {
          email,
          status: "Sent",
        },
        data: {
          status: "Opened",
        },
      }).catch(() => {
        // Ignore les erreurs (email peut ne pas exister)
      });
    }
  } catch {
    // Ignore silently — le tracking ne doit jamais casser l'email
  }

  // Retourner un pixel transparent 1x1
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new NextResponse(pixel, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
