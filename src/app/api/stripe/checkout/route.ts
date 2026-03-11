import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialisation de Stripe avec la clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-02-25.clover", // ou la dernière version stable
});

export async function POST(request: Request) {
  try {
    const { isAnnual } = await request.json();
    
    // Pour l'instant nous utilisons le mode paiement unique (payment) 
    // ou abonnement (subscription). Faisons abonnement.
    // Idéalement, il faut créer les "Produits" et "Prix" dans le dashboard Stripe
    // et utiliser leurs ID (price_xxxx). Mais on peut aussi créer des prix "à la volée".
    
    const amount = isAnnual ? 1900 * 12 : 2900; // en centimes (19€*12 ou 29€)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment", // "subscription" est mieux pour du SaaS, mais demande des Price IDs valides, on fait simple pour le test
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
