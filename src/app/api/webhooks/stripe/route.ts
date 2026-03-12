import { NextResponse } from "next/server";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";

// Stripe webhook endpoint
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2026-02-25.clover",
    });

    // Verify webhook signature (Requires STRIPE_WEBHOOK_SECRET in .env)
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      console.error("STRIPE_WEBHOOK_SECRET is not set.");
      // Allow testing without secret if not in production? No, better secure it.
      return new NextResponse("Webhook secret missing", { status: 400 });
    }

    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // userId was passed in client_reference_id
        const userId = session.client_reference_id || session.metadata?.userId;
        
        if (userId) {
          const client = await clerkClient();
          await client.users.updateUserMetadata(userId, {
            publicMetadata: {
              isPro: true,
            },
          });
          console.log(`✅ Utilisateur ${userId} passé en Pro via Webhook.`);
        } else {
          console.warn("⚠️ checkout.session.completed: userId introuvable");
        }
        break;
      }
      case "customer.subscription.deleted": {
        // En cas d'annulation ou fin d'abonnement
        const subscription = event.data.object as Stripe.Subscription;
        // On récupère l'userId depuis les metadata de la subscription
        const userId = subscription.metadata?.userId;

        if (userId) {
          const client = await clerkClient();
          await client.users.updateUserMetadata(userId, {
            publicMetadata: {
              isPro: false,
            },
          });
          console.log(`❌ Utilisateur ${userId} a perdu son abonnement Pro.`);
        } else {
          console.warn("⚠️ customer.subscription.deleted: userId introuvable");
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Erreur serveur webhook:", error);
    return new NextResponse("Internal webhook error", { status: 500 });
  }
}
