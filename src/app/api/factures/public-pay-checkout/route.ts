import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { internalServerError, jsonError } from "@/lib/http";
import { verifyClientPortalToken } from "@/lib/client-portal";
import { rateLimit } from "@/lib/rate-limit";

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  });
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://zolio.site";

/**
 * Crée une session Stripe Checkout pour payer une facture
 * via l'espace client (sans auth Clerk).
 * POST /api/factures/public-pay-checkout
 * Body: { numéroFacture: string, portalToken: string }
 */
export async function POST(request: Request) {
  try {
    const rl = rateLimit(`public-invoice-checkout:${request.headers.get("x-forwarded-for") || "unknown"}`, 5, 60 * 60_000);
    if (!rl.allowed) return jsonError("Trop de requêtes", 429);

    const body = await request.json();
    const numeroFacture = String(body?.numeroFacture || "").trim();
    const portalToken = String(body?.portalToken || "").trim();

    if (!numeroFacture || !portalToken) {
      return jsonError("Numéro de facture et token requis", 400);
    }

    // Vérifier le token
    let payload: { email: string; userId: string };
    try {
      payload = verifyClientPortalToken(portalToken);
    } catch {
      return jsonError("Token invalide", 401);
    }

    const facture = await prisma.facture.findFirst({
      where: {
        userId: payload.userId,
        numero: numeroFacture,
        emailClient: payload.email,
      },
    });

    if (!facture) {
      return jsonError("Facture non trouvée", 404);
    }
    if (facture.statut === "Payée") {
      return jsonError("Cette facture est déjà payée", 400);
    }

    const amountCents = Math.round(Number(facture.totalTTC) * 100);

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: facture.emailClient || undefined,
      metadata: {
        userId: payload.userId,
        factureId: facture.id,
        factureNumero: facture.numero,
      },
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Facture ${facture.numero}`,
              description: `${facture.nomClient} — ${facture.date.toLocaleDateString("fr-FR")}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/espace-client/${encodeURIComponent(portalToken)}?paid=${encodeURIComponent(facture.numero)}`,
      cancel_url: `${APP_URL}/espace-client/${encodeURIComponent(portalToken)}?cancelled=${encodeURIComponent(facture.numero)}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    return internalServerError("public-invoice-checkout", error, "Impossible de créer la session de paiement");
  }
}
