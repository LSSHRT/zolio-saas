import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { internalServerError, jsonError } from "@/lib/http";
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
 * Crée une session Stripe Checkout pour payer une facture.
 * POST /api/factures/pay-checkout
 * Body: { numeroFacture: string }
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return jsonError("Non autorisé", 401);
    }

    const rl = rateLimit(`invoice-checkout:${userId}`, 5, 60 * 60_000);
    if (!rl.allowed) return jsonError("Trop de requêtes", 429);

    const body = await request.json();
    const numeroFacture = String(body?.numeroFacture || "").trim();
    if (!numeroFacture) {
      return jsonError("Numéro de facture requis", 400);
    }

    const facture = await prisma.facture.findFirst({
      where: { userId, numero: numeroFacture },
    });
    if (!facture) {
      return jsonError("Facture non trouvée", 404);
    }
    if (facture.statut === "Payée") {
      return jsonError("Cette facture est déjà payée", 400);
    }
    if (!facture.emailClient) {
      return jsonError("Aucun email client associé à cette facture", 400);
    }

    const amountCents = Math.round(Number(facture.totalTTC) * 100);

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: facture.emailClient,
      metadata: {
        userId,
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
      success_url: `${APP_URL}/factures?payment=success&numero=${encodeURIComponent(facture.numero)}`,
      cancel_url: `${APP_URL}/factures?payment=cancelled&numero=${encodeURIComponent(facture.numero)}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    return internalServerError("invoice-checkout", error, "Impossible de créer la session de paiement");
  }
}
