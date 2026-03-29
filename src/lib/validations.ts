/**
 * Schémas de validation Zod — centralisés pour toutes les routes API.
 *
 * Règles :
 * - Tous les body JSON passent par ici AVANT d'atteindre la logique métier
 * - Les erreurs Zod retournent 400 avec les détails
 * - On valide la forme, pas la logique (ex: "cet email existe déjà" = logique)
 */
import { z } from "zod";

// ─── Helpers ───

const trimmedString = z.string().trim();
const optionalTrimmedString = trimmedString.optional().or(z.literal("")).transform(v => v || undefined);
const positiveNumber = z.number().positive();
const nonNegativeNumber = z.number().min(0);

// ─── Clients ───

export const clientCreateSchema = z.object({
  nom: trimmedString.min(1, "Le nom est requis").max(200),
  email: trimmedString.email("Email invalide").optional().or(z.literal("")),
  telephone: optionalTrimmedString,
  adresse: optionalTrimmedString,
});

export const clientUpdateSchema = clientCreateSchema.partial();

export const clientBulkSchema = z.array(clientCreateSchema).min(1).max(100);

// ─── Devis ───

export const ligneDevisSchema = z.object({
  nomPrestation: trimmedString.min(1, "Le nom de la prestation est requis").max(500),
  unite: trimmedString.max(20).default("U"),
  quantite: positiveNumber.max(999999),
  prixUnitaire: nonNegativeNumber.max(9999999),
  tva: trimmedString.max(10).default("20"),
  isOptional: z.boolean().default(false),
});

export const devisCreateSchema = z.object({
  clientId: trimmedString.min(1, "Le client est requis"),
  lignes: z.array(ligneDevisSchema).min(1, "Au moins une ligne est requise").max(100),
  remise: nonNegativeNumber.max(100).default(0),
  acompte: nonNegativeNumber.max(100).default(0),
  tva: nonNegativeNumber.max(100).default(20),
  notes: optionalTrimmedString,
  tags: z.array(trimmedString.max(50)).max(10).optional(),
  dateDebut: z.string().datetime().optional(),
  dateFin: z.string().datetime().optional(),
  photos: z.array(trimmedString).max(20).optional(),
});

export const devisUpdateSchema = devisCreateSchema
  .extend({
    client: trimmedString.max(200).optional(),
    resendEmail: z.boolean().default(false),
    statut: z.enum(["En attente", "Accepté", "Refusé", "Annulé", "Facturé", "Payé"]).optional(),
  })
  .partial()
  .strict();

export const devisStatutSchema = z.object({
  statut: z.enum(["En attente", "Accepté", "Refusé", "Annulé", "Facturé", "Payé"]),
});

export const devisPlanningSchema = z.object({
  dateDebut: z.string().datetime().nullable().optional(),
  dateFin: z.string().datetime().nullable().optional(),
});

// ─── Factures ───

export const factureClientSchema = z.object({
  nom: trimmedString.min(1, "Le nom du client est requis").max(200),
  telephone: optionalTrimmedString,
  email: trimmedString.email("Email invalide").optional().or(z.literal("")),
  adresse: optionalTrimmedString,
});

export const factureLigneSchema = z.object({
  nomPrestation: trimmedString.min(1).max(500),
  unite: optionalTrimmedString,
  quantite: positiveNumber.max(999999),
  prixUnitaire: nonNegativeNumber.max(9999999),
  tva: optionalTrimmedString,
  isOptional: z.boolean().default(false),
  totalLigne: nonNegativeNumber.max(99999999).optional(),
});

export const factureCreateSchema = z.object({
  client: factureClientSchema,
  lignes: z.array(factureLigneSchema).min(1, "Au moins une ligne est requise").max(100),
  totalHT: nonNegativeNumber.max(99999999),
  totalTTC: positiveNumber.max(99999999),
  tva: nonNegativeNumber.max(100),
  devisNumero: optionalTrimmedString,
});

export const factureUpdateSchema = z.object({
  statut: z.enum(["Émise", "Payée", "En retard"]).optional(),
  emailClient: trimmedString.email("Email invalide").optional().or(z.literal("")),
});

// ─── Dépenses ───

export const depenseCreateSchema = z.object({
  description: trimmedString.min(1, "La description est requise").max(500),
  montant: positiveNumber.max(9999999),
  date: z.string().datetime().optional(),
  categorie: optionalTrimmedString,
});

// ─── Notes ───

export const noteCreateSchema = z.object({
  titre: trimmedString.min(1, "Le titre est requis").max(200),
  contenu: trimmedString.min(1, "Le contenu est requis").max(50000),
  categorie: optionalTrimmedString,
  couleur: z.enum(["violet", "emerald", "rose", "amber", ""]).optional(),
  epingle: z.boolean().default(false),
  date: z.string().datetime().optional(),
});

export const noteUpdateSchema = noteCreateSchema.partial();

// ─── Prestations ───

export const prestationCreateSchema = z.object({
  nom: trimmedString.min(1, "Le nom est requis").max(200),
  description: optionalTrimmedString,
  unite: optionalTrimmedString,
  prix: nonNegativeNumber.max(9999999),
  cout: nonNegativeNumber.max(9999999).default(0),
  stock: z.number().int().min(0).default(0),
});

export const prestationUpdateSchema = prestationCreateSchema.partial();

export const prestationBulkSchema = z.array(prestationCreateSchema).min(1).max(100);

// ─── Notifications push ───

export const pushSubscribeSchema = z.object({
  endpoint: trimmedString.url("URL d'abonnement invalide"),
  keys: z.object({
    p256dh: trimmedString.min(1),
    auth: trimmedString.min(1),
  }),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: trimmedString.url().optional(),
});

// ─── Admin ───

export const adminMailSchema = z.object({
  email: trimmedString.email("Email invalide").min(1, "L'email est requis"),
});

export const adminSettingsSchema = z.record(z.string(), z.string().max(10000));

// ─── Stripe ───

export const stripeCheckoutSchema = z.object({
  priceId: trimmedString.min(1).optional(),
});

// ─── Referral ───

export const referralSchema = z.object({
  code: trimmedString.min(1, "Le code est requis").max(50),
});

// ─── AI ───

export const aiGenerateDevisSchema = z.object({
  description: trimmedString.min(10, "La description doit faire au moins 10 caractères").max(5000),
  clientId: trimmedString.min(1).optional(),
  clientName: trimmedString.max(200).optional(),
});

// ─── Helper de réponse d'erreur ───

import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function zodErrorResponse(error: ZodError) {
  const issues = error.issues.map((issue) => ({
    champ: issue.path.join("."),
    message: issue.message,
  }));

  return NextResponse.json(
    {
      error: "Données invalides",
      details: issues,
    },
    { status: 400 },
  );
}
