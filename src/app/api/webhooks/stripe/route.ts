import { NextResponse } from "next/server";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";
import { internalServerError } from "@/lib/http";
import { logError, logWarn, logInfo } from "@/lib/logger";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { sendFacturePaidEmail } from "@/lib/sendEmail";
import { generateFacturePDF } from "@/lib/generatePdf";
import { getCompanyProfile } from "@/lib/company";
import { parseLignes, normalizeLigneForOutput, type LignePayload } from "@/lib/devis-lignes";

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
        const userIdForSub = session.client_reference_id || session.metadata?.userId;
        const factureNumero = session.metadata?.factureNumero;
        const mode = session.mode;

        if (factureNumero && mode === "payment") {
          // Paiement d'une facture → marquer comme payée + email client
          const facture = await prisma.facture.findFirst({
            where: { userId: userIdForSub, numero: factureNumero },
            include: {
              devis: {
                include: {
                  lignesNorm: { orderBy: { position: "asc" } },
                },
              },
            },
          });
          if (facture) {
            const paymentUpdate = await prisma.facture.updateMany({
              where: {
                id: facture.id,
                statut: { not: "Payée" },
              },
              data: {
                statut: "Payée",
                stripeSessionId: session.id,
              },
            });

            if (paymentUpdate.count === 0) {
              logInfo(
                "stripe-webhook",
                `Facture ${factureNumero} déjà traitée pour la session ${session.id}.`,
              );
              break;
            }

            logInfo("stripe-webhook", `Facture ${factureNumero} marquée comme payée via Stripe.`);

            // Email de confirmation au client avec reçu PDF
            if (facture.emailClient) {
              try {
                // Fetch user for company profile
                const client = await clerkClient();
                const clerkUser = await client.users.getUser(userIdForSub as string);
                const entreprise = getCompanyProfile(clerkUser);

                // Récupérer les lignes du Devis ou fallback
                let lignes: LignePayload[] = [];
                if (facture.devis?.lignesNorm?.length) {
                  lignes = facture.devis.lignesNorm.map((l) => ({
                    isOptional: l.isOptional,
                    nomPrestation: l.nomPrestation,
                    prixUnitaire: l.prixUnitaire,
                    quantite: l.quantite,
                    totalLigne: l.totalLigne,
                    tva: l.tva,
                    unite: l.unite,
                  }));
                } else if (facture.devis?.lignesNorm) {
                  lignes = parseLignes(facture.devis.lignesNorm);
                } else {
                  lignes = [{
                    isOptional: false,
                    nomPrestation: "Prestations",
                    prixUnitaire: facture.totalHT,
                    quantite: 1,
                    totalLigne: facture.totalHT,
                    tva: String(facture.tva),
                    unite: "forfait",
                  }];
                }

                const pdfBuffer = await generateFacturePDF({
                  numeroDevis: facture.numero,
                  date: facture.date.toLocaleDateString("fr-FR"),
                  client: {
                    nom: facture.nomClient,
                    email: facture.emailClient || "",
                    telephone: "",
                    adresse: "",
                  },
                  isPro: clerkUser.publicMetadata?.isPro === true,
                  entreprise,
                  lignes: lignes.map(normalizeLigneForOutput),
                  totalHT: Number(facture.totalHT).toFixed(2),
                  tva: String(facture.tva ?? 20),
                  totalTTC: Number(facture.totalTTC).toFixed(2),
                  statut: "Payée",
                });

                await sendFacturePaidEmail(
                  facture.emailClient,
                  facture.nomClient,
                  facture.numero,
                  Number(facture.totalTTC).toFixed(2),
                  pdfBuffer
                );
                logInfo("stripe-webhook", `Email de confirmation envoyé à ${facture.emailClient}`);
              } catch (emailError) {
                logError("stripe-webhook-email", emailError);
              }
            }

            await createNotification({
              userId: userIdForSub as string,
              type: "facture_paid",
              title: "Facture payée !",
              description: `La facture ${factureNumero} de ${facture.nomClient} a été réglée de ${facture.totalTTC}€ via Stripe.`,
              href: `/factures`,
              tone: "emerald",
            });
          }
        } else if (userIdForSub) {
          // C'est un abonnement
          const client = await clerkClient();
          await client.users.updateUserMetadata(userIdForSub, {
            publicMetadata: {
              isPro: true,
              stripeCustomerId: session.customer as string,
            },
          });
          logInfo("stripe-webhook", `Utilisateur ${userIdForSub} passé en Pro via Webhook.`);

          await createNotification({
            userId: userIdForSub,
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
