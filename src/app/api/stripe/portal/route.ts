import { NextResponse } from "next/server";
import Stripe from "stripe";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { internalServerError } from "@/lib/http";

// Initialisation de Stripe
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-02-25.clover",
  });
}

export async function POST() {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const stripe = getStripe();
    let customerId = user.publicMetadata?.stripeCustomerId as string;

    // Si pas de customerId dans Clerk, on essaye de le trouver par email
    if (!customerId) {
      const email = user.emailAddresses[0]?.emailAddress;
      if (email) {
        const searchResult = await stripe.customers.search({
          query: `email:'${email}'`,
          limit: 1,
        });

        if (searchResult.data.length > 0) {
          customerId = searchResult.data[0].id;
          // On met à jour Clerk pour la prochaine fois
          const client = await clerkClient();
          await client.users.updateUserMetadata(user.id, {
            publicMetadata: {
              ...user.publicMetadata,
              stripeCustomerId: customerId,
            },
          });
        }
      }
    }

    if (!customerId) {
      return NextResponse.json(
        { error: "Aucun abonnement Stripe trouvé. Si vous avez activé le mode PRO manuellement, vous n'avez pas de portail client." },
        { status: 404 }
      );
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    return internalServerError("stripe-portal", error, "Impossible d'ouvrir le portail client");
  }
}
