import { NextResponse } from "next/server";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";
import { internalServerError } from "@/lib/http";
import { logError, logWarn, logInfo } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";

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
      logError("stripe-webhook", "STRIPE_WEBHOOK_SECRET is not set.");
      // Allow testing without secret if not in production? No, better secure it.
      return new NextResponse("Webhook secret missing", { status: 400 });
    }

    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logError("stripe-webhook", `Webhook signature verification failed: ${message}`);
    return new NextResponse("Webhook signature verification failed", { status: 400 });
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
              stripeCustomerId: session.customer as string,
            },
          });
          logInfo("stripe-webhook", `Utilisateur ${userId} passé en Pro via Webhook.`);

          await createNotification({
            userId,
            type: "subscription_activated",
            title: "Bienvenue en Pro !",
            description: "Votre abonnement est actif. Profitez de toutes les fonctionnalités.",
            href: "/dashboard",
            tone: "emerald",
          });
        } else {
          logWarn("stripe-webhook", "checkout.session.completed: userId introuvable");
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
          logInfo("stripe-webhook", `Utilisateur ${userId} a perdu son abonnement Pro.`);

          await createNotification({
            userId,
            type: "subscription_cancelled",
            title: "Abonnement annulé",
            description: "Votre abonnement Pro a pris fin. Vous êtes revenu au plan Starter.",
            href: "/abonnement",
            tone: "amber",
          });
        } else {
          logWarn("stripe-webhook", "customer.subscription.deleted: userId introuvable");
        }
        break;
      }
      default:
        logInfo("stripe-webhook", `Unhandled event type ${event.type}`);
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return internalServerError("stripe-webhook", error, "Internal webhook error");
  }
}
