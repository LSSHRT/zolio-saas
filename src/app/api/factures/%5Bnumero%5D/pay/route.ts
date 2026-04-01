import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(_request: Request, ctx: any) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Non autorisé", { status: 401 });

    const { numero } = await ctx.params;

    const rl = rateLimit(`stripe-pay:${userId}`, 10, 60_000);
    if (!rl.allowed) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

    const facture = await prisma.facture.findFirst({
      where: { userId, numero },
    });

    if (!facture) {
      return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
    }

    const totalTTCCents = Math.round(facture.totalTTC * 100);
    if (totalTTCCents <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zolio.site";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: facture.emailClient || undefined,
      metadata: { userId, factureNumero: numero },
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Facture ${numero}`,
              description: facture.nomClient ? `Client: ${facture.nomClient}` : undefined,
            },
            unit_amount: totalTTCCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/factures?paid=${encodeURIComponent(numero)}`,
      cancel_url: `${appUrl}/factures`,
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
