import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";

// Initialisation de Stripe avec la clé secrète (lazy pour éviter le crash au build)
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  });
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const { isAnnual } = await request.json();
    
    // Pour l'instant nous utilisons le mode paiement unique (payment) 
    // ou abonnement (subscription). Faisons abonnement.
    // Idéalement, il faut créer les "Produits" et "Prix" dans le dashboard Stripe
    // et utiliser leurs ID (price_xxxx). Mais on peut aussi créer des prix "à la volée".
    
    const amount = isAnnual ? 1900 * 12 : 2900; // en centimes (19€*12 ou 29€)

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription", 
      client_reference_id: userId,
      metadata: {
        userId,
      },
      subscription_data: {
        metadata: {
          userId,
        },
      },
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Zolio Pro",
              description: isAnnual ? "Abonnement Annuel Zolio Pro" : "Abonnement Mensuel Zolio Pro",
              images: ["https://zolio.site/logo.png"], // Le vrai logo plus tard
            },
            unit_amount: amount,
            recurring: {
              interval: isAnnual ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],
      // URL de redirection après paiement réussi ou annulé
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/abonnement/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/abonnement`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Erreur Stripe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
