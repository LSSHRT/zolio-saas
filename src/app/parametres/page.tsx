"use client";

import { useEffect, useState, type ChangeEvent, type CSSProperties, type FormEvent } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  FileDigit,
  Gift,
  Image as ImageIcon,
  Landmark,
  Mail,
  MapPin,
  Palette,
  Phone,
  Save,
  Scale,
  Shield,
  Sparkles,
  Star,
} from "lucide-react";
import {
  ClientHeroStat,
  ClientMobileOverview,
  ClientSectionCard,
  ClientSubpageShell,
} from "@/components/client-shell";
import { ThemeSelector } from "@/components/ThemeSelector";
import { logError } from "@/lib/logger";

type SettingsFormData = {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companySiret: string;
  companyLogo: string;
  companyIban: string;
  companyBic: string;
  companyStatut: string;
  companyAssurance: string;
  companyLegal: string;
  companyCgv: string;
  companyColor: string;
  companyGoogleReview: string;
  referredBy: string;
};

type SettingsMessage = {
  type: "" | "success" | "error";
  text: string;
};

const EMPTY_FORM_DATA: SettingsFormData = {
  companyName: "",
  companyAddress: "",
  companyPhone: "",
  companySiret: "",
  companyLogo: "",
  companyIban: "",
  companyBic: "",
  companyStatut: "",
  companyAssurance: "",
  companyLegal: "",
  companyCgv: "",
  companyColor: "#0ea5e9",
  companyGoogleReview: "",
  referredBy: "",
};

const LEGAL_LINKS = [
  { href: "/cgv", label: "Conditions Générales de Vente (CGV)" },
  { href: "/cgu", label: "Conditions Générales d'Utilisation (CGU)" },
  { href: "/mentions-legales", label: "Mentions Légales" },
  { href: "/politique-confidentialite", label: "Politique de Confidentialité" },
] as const;

const inputClassName =
  "w-full rounded-lg border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-violet-400/40 dark:focus:ring-violet-500/10";

const textAreaClassName = `${inputClassName} min-h-[120px] resize-y`;

function isAllowedLogoUrl(value: string) {
  if (!value.trim()) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && url.hostname !== "localhost";
  } catch {
    return false;
  }
}

function getMetadataString(
  unsafeMeta: Record<string, unknown> | null | undefined,
  publicMeta: Record<string, unknown> | null | undefined,
  key: keyof SettingsFormData,
  fallback = "",
) {
  const unsafeValue = unsafeMeta?.[key];
  if (typeof unsafeValue === "string") return unsafeValue;

  const publicValue = publicMeta?.[key];
  if (typeof publicValue === "string") return publicValue;

  return fallback;
}

function buildFormData(user: { unsafeMetadata: unknown; publicMetadata: unknown }): SettingsFormData {
  const unsafeMeta = (user.unsafeMetadata as Record<string, unknown> | null | undefined) ?? {};
  const publicMeta = (user.publicMetadata as Record<string, unknown> | null | undefined) ?? {};

  return {
    companyName: getMetadataString(unsafeMeta, publicMeta, "companyName"),
    companyAddress: getMetadataString(unsafeMeta, publicMeta, "companyAddress"),
    companyPhone: getMetadataString(unsafeMeta, publicMeta, "companyPhone"),
    companySiret: getMetadataString(unsafeMeta, publicMeta, "companySiret"),
    companyLogo: getMetadataString(unsafeMeta, publicMeta, "companyLogo"),
    companyIban: getMetadataString(unsafeMeta, publicMeta, "companyIban"),
    companyBic: getMetadataString(unsafeMeta, publicMeta, "companyBic"),
    companyStatut: getMetadataString(unsafeMeta, publicMeta, "companyStatut"),
    companyAssurance: getMetadataString(unsafeMeta, publicMeta, "companyAssurance"),
    companyLegal: getMetadataString(unsafeMeta, publicMeta, "companyLegal"),
    companyCgv: getMetadataString(unsafeMeta, publicMeta, "companyCgv"),
    companyColor: getMetadataString(unsafeMeta, publicMeta, "companyColor", "#0ea5e9"),
    companyGoogleReview: getMetadataString(unsafeMeta, publicMeta, "companyGoogleReview"),
    referredBy: getMetadataString(unsafeMeta, publicMeta, "referredBy"),
  };
}

function isHexColor(value: string) {
  return /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);
}

function LanguageSelector() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setLocale("fr")}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
          locale === "fr"
            ? "bg-violet-500/15 text-violet-700 ring-1 ring-violet-300/40 dark:text-violet-300"
            : "text-muted-foreground hover:bg-muted"
        }`}
      >
        🇫🇷 Français
      </button>
      <button
        onClick={() => setLocale("en")}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
          locale === "en"
            ? "bg-violet-500/15 text-violet-700 ring-1 ring-violet-300/40 dark:text-violet-300"
            : "text-muted-foreground hover:bg-muted"
        }`}
      >
        🇬🇧 English
      </button>
    </div>
  );
}

export default function ParametresEntreprise() {
  const { isLoaded, user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<SettingsMessage>({ type: "", text: "" });
  const [formData, setFormData] = useState<SettingsFormData>(EMPTY_FORM_DATA);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(
    (user?.unsafeMetadata?.reminderEnabled as boolean | undefined) ?? true
  );
  const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(
    ((user?.unsafeMetadata?.weeklyDigestEnabled as boolean | undefined)
      ?? (user?.publicMetadata?.weeklyDigestEnabled as boolean | undefined)
      ?? true) === true
  );

  useEffect(() => {
    if (!isLoaded || !user || hydratedUserId === user.id) return;

    setFormData(buildFormData(user));
    setHydratedUserId(user.id);
  }, [hydratedUserId, isLoaded, user]);

  if (!isLoaded || !user) {
    return (
      <div className="client-workspace relative min-h-screen overflow-hidden">
        <div className="client-grid-overlay pointer-events-none absolute inset-0" />
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="client-panel rounded-2xl px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-600" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Chargement des paramètres entreprise...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const referralCode = user.id.slice(-8).toUpperCase();
  const referralApplied =
    (user.unsafeMetadata?.referredBy as string) ||
    (user.publicMetadata?.referredBy as string) ||
    formData.referredBy;
  const primaryEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "";
  const brandColor = isHexColor(formData.companyColor) ? formData.companyColor : "#0ea5e9";
  const logoPreviewStyle: CSSProperties | undefined = formData.companyLogo
    ? {
        backgroundImage: `url(${formData.companyLogo})`,
      }
    : undefined;
  const companyInitials =
    formData.companyName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "Z";
  const addressLines = formData.companyAddress
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const completionItems = [
    {
      label: "Identité visible",
      detail: formData.companyName || "Ajoutez le nom qui apparaîtra sur les documents.",
      filled: Boolean(formData.companyName),
    },
    {
      label: "Coordonnées de contact",
      detail:
        formData.companyAddress && formData.companyPhone
          ? "Adresse et téléphone prêts."
          : "Renseignez adresse et téléphone.",
      filled: Boolean(formData.companyAddress && formData.companyPhone),
    },
    {
      label: "Références légales",
      detail:
        formData.companySiret && formData.companyStatut
          ? "SIRET et statut visibles."
          : "SIRET ou statut à compléter.",
      filled: Boolean(formData.companySiret && formData.companyStatut),
    },
    {
      label: "Habillage document",
      detail:
        formData.companyLogo || isHexColor(formData.companyColor)
          ? "Logo ou couleur de marque actifs."
          : "Ajoutez un logo ou une couleur.",
      filled: Boolean(formData.companyLogo || isHexColor(formData.companyColor)),
    },
    {
      label: "Encaissement",
      detail:
        formData.companyIban && formData.companyBic
          ? "IBAN et BIC prêts pour les factures."
          : "Renseignez les coordonnées bancaires.",
      filled: Boolean(formData.companyIban && formData.companyBic),
    },
    {
      label: "Relance avis",
      detail: formData.companyGoogleReview ? "Le lien Google sera proposé au client." : "Ajoutez le lien d'avis Google.",
      filled: Boolean(formData.companyGoogleReview),
    },
  ];

  const completedCount = completionItems.filter((item) => item.filled).length;
  const completionPercent = Math.round((completedCount / completionItems.length) * 100);
  const documentReady = Boolean(
    formData.companyName && formData.companyAddress && formData.companyPhone && formData.companySiret,
  );
  const payoutReady = Boolean(formData.companyIban && formData.companyBic);
  const reviewReady = Boolean(formData.companyGoogleReview);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    if (formData.referredBy && formData.referredBy.toUpperCase() === referralCode) {
      setMessage({ type: "error", text: "Vous ne pouvez pas utiliser votre propre code de parrainage." });
      setIsSaving(false);
      return;
    }

    if (!isAllowedLogoUrl(formData.companyLogo)) {
      setMessage({
        type: "error",
        text: "Le logo doit être une URL HTTPS publique valide.",
      });
      setIsSaving(false);
      return;
    }

    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          companyName: formData.companyName,
          companyAddress: formData.companyAddress,
          companyPhone: formData.companyPhone,
          companySiret: formData.companySiret,
          companyLogo: formData.companyLogo,
          companyIban: formData.companyIban,
          companyBic: formData.companyBic,
          companyStatut: formData.companyStatut,
          companyAssurance: formData.companyAssurance,
          companyLegal: formData.companyLegal,
          companyCgv: formData.companyCgv,
          companyColor: brandColor,
          companyGoogleReview: formData.companyGoogleReview,
          referredBy: formData.referredBy,
          reminderEnabled,
          weeklyDigestEnabled,
        },
      });
      setMessage({ type: "success", text: "Paramètres enregistrés avec succès." });
    } catch (error) {
      logError("parametres-save", error);
      setMessage({ type: "error", text: "Une erreur est survenue lors de l'enregistrement." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveSettings();
  };

  const copyReferralMessage = async () => {
    try {
      await navigator.clipboard.writeText(
        `Rejoignez Zolio avec mon code de parrainage ${referralCode} pour gagner -50% sur l'abonnement PRO ! https://zolio.site/sign-up?ref=${referralCode}`,
      );
      setMessage({ type: "success", text: "Message de parrainage copié." });
    } catch (error) {
      logError("parametres-action", error);
      setMessage({ type: "error", text: "Impossible de copier le message de parrainage." });
    }
  };

  const messageCard = message.text ? (
    <ClientSectionCard>
      <div
        className={`rounded-2xl border px-4 py-4 text-sm font-medium ${
          message.type === "success"
            ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:text-emerald-300"
            : "border-rose-300/30 bg-rose-500/10 text-rose-700 dark:border-rose-400/20 dark:text-rose-300"
        }`}
      >
        {message.text}
      </div>
    </ClientSectionCard>
  ) : null;

  const documentPreview = (
    <ClientSectionCard>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Aperçu document</p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
            Ce que verra votre client
          </h2>
        </div>
        <span className="client-chip bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-100 dark:ring-white/10">
          PDF
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-slate-950 text-white shadow-[0_32px_70px_-44px_rgba(2,6,23,0.92)] dark:border-white/10">
        <div className="h-2" style={{ backgroundColor: brandColor }} />
        <div className="space-y-4 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.1rem] border border-white/10 bg-white/5">
                {formData.companyLogo && isAllowedLogoUrl(formData.companyLogo) ? (
                  <div className="h-10 w-10 rounded-xl bg-contain bg-center bg-no-repeat" style={logoPreviewStyle} />
                ) : (
                  <span className="text-base font-semibold tracking-[0.16em] text-white/88">{companyInitials}</span>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-white">
                  {formData.companyName || "Nom de l'entreprise"}
                </p>
                <p className="mt-1 truncate text-sm text-white/60">{primaryEmail || "email@entreprise.fr"}</p>
              </div>
            </div>

            <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              Devis
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">Coordonnées</p>
              <div className="mt-3 space-y-2 text-sm text-white/80">
                <p>{addressLines[0] || "Adresse de l'entreprise"}</p>
                {addressLines.slice(1).map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p>{formData.companyPhone || "Téléphone"}</p>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">Références</p>
              <div className="mt-3 space-y-2 text-sm text-white/80">
                <p>SIRET: {formData.companySiret || "à compléter"}</p>
                <p>{formData.companyStatut || "Statut juridique et capital"}</p>
                <p>{formData.companyAssurance || "Assurance professionnelle"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-white/8 bg-white/[0.04] p-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/40">Paiement et mentions</p>
            <div className="mt-3 space-y-2 text-sm text-white/80">
              <p>{formData.companyIban ? `IBAN ${formData.companyIban}` : "IBAN à renseigner"}</p>
              <p>{formData.companyBic ? `BIC ${formData.companyBic}` : "BIC à renseigner"}</p>
              <p>{formData.companyLegal || "Vos pénalités de retard et mentions légales apparaîtront ici."}</p>
            </div>
          </div>
        </div>
      </div>
    </ClientSectionCard>
  );

  const statusCard = (
    <ClientSectionCard>
      <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">État du dossier</p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950 dark:text-white sm:text-xl">
        Lecture rapide
      </h2>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3 rounded-[1.35rem] border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-white/8 dark:bg-white/4">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
              documentReady
                ? "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/12 dark:text-emerald-300"
                : "bg-amber-400/12 text-amber-600 dark:bg-amber-400/12 dark:text-amber-300"
            }`}
          >
            {documentReady ? <CheckCircle2 size={17} /> : <Sparkles size={17} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Base entreprise</p>
            <p className="hidden text-sm leading-6 text-slate-600 dark:text-slate-300 sm:block">
              {documentReady
                ? "Nom, adresse, téléphone et SIRET sont prêts."
                : "Complétez l'identité de base pour fiabiliser vos documents."}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${documentReady ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"}`}>
            {documentReady ? "OK" : "À faire"}
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-[1.35rem] border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-white/8 dark:bg-white/4">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
              payoutReady
                ? "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/12 dark:text-emerald-300"
                : "bg-slate-900/6 text-slate-600 dark:bg-white/8 dark:text-slate-300"
            }`}
          >
            <Landmark size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Coordonnées bancaires</p>
            <p className="hidden text-sm leading-6 text-slate-600 dark:text-slate-300 sm:block">
              {payoutReady
                ? "IBAN et BIC seront visibles sur les factures."
                : "Ajoutez IBAN et BIC pour les règlements."}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${payoutReady ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400"}`}>
            {payoutReady ? "OK" : "À faire"}
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-[1.35rem] border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-white/8 dark:bg-white/4">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
              reviewReady
                ? "bg-violet-500/12 text-violet-600 dark:bg-violet-500/12 dark:text-violet-300"
                : "bg-slate-900/6 text-slate-600 dark:bg-white/8 dark:text-slate-300"
            }`}
          >
            <Star size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Relance avis Google</p>
            <p className="hidden text-sm leading-6 text-slate-600 dark:text-slate-300 sm:block">
              {reviewReady
                ? "Le lien d'avis peut être proposé après paiement."
                : "Ajoutez le lien d'avis pour activer cette relance."}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${reviewReady ? "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400"}`}>
            {reviewReady ? "OK" : "À faire"}
          </span>
        </div>

        {/* Relances automatiques factures */}
        <div className="flex items-center gap-3 rounded-[1.35rem] border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-white/8 dark:bg-white/4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 dark:bg-amber-500/12 dark:text-amber-300">
            <Clock size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Relances automatiques</p>
            <p className="hidden text-sm leading-6 text-slate-600 dark:text-slate-300 sm:block">
              Envoi automatique d&apos;un email de rappel aux clients dont la facture est en retard de 3+ jours.
            </p>
          </div>
          <div className="mt-1">
            <button
              type="button"
              onClick={() => {
                const newVal = !reminderEnabled;
                setReminderEnabled(newVal);
                user.update({
                  unsafeMetadata: {
                    ...user.unsafeMetadata,
                    companyName: formData.companyName,
                    companyAddress: formData.companyAddress,
                    companyPhone: formData.companyPhone,
                    companySiret: formData.companySiret,
                    companyLogo: formData.companyLogo,
                    companyIban: formData.companyIban,
                    companyBic: formData.companyBic,
                    companyStatut: formData.companyStatut,
                    companyAssurance: formData.companyAssurance,
                    companyLegal: formData.companyLegal,
                    companyCgv: formData.companyCgv,
                    companyColor: brandColor,
                    companyGoogleReview: formData.companyGoogleReview,
                    referredBy: formData.referredBy,
                    reminderEnabled: newVal,
                  },
                }).catch(() => setReminderEnabled(!newVal));
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${reminderEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${reminderEnabled ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>

        {/* Récap hebdomadaire */}
        <div className="flex items-center gap-3 rounded-[1.35rem] border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-white/8 dark:bg-white/4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-violet-500/12 text-violet-600 dark:bg-violet-500/12 dark:text-violet-300">
            <Mail size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Récap hebdomadaire</p>
            <p className="hidden text-sm leading-6 text-slate-600 dark:text-slate-300 sm:block">
              Recevez chaque lundi matin un résumé de votre activité : devis, factures et CA encaissé.
            </p>
          </div>
          <div className="mt-1">
            <button
              type="button"
              onClick={() => {
                const newVal = !weeklyDigestEnabled;
                setWeeklyDigestEnabled(newVal);
                user.update({
                  unsafeMetadata: {
                    ...user.unsafeMetadata,
                    weeklyDigestEnabled: newVal,
                  },
                }).catch(() => setWeeklyDigestEnabled(!newVal));
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${weeklyDigestEnabled ? 'bg-violet-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              aria-pressed={weeklyDigestEnabled}
              aria-label="Activer le récap hebdomadaire par email"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${weeklyDigestEnabled ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>
      </div>
    </ClientSectionCard>
  );

  const referralCard = (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 p-[1px] shadow-brand-lg">
      <div className="h-full rounded-[calc(2rem-1px)] bg-[linear-gradient(160deg,rgba(11,13,25,0.88),rgba(20,12,38,0.82))] p-5 text-white sm:p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
            <Gift className="h-5 w-5 text-violet-100" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-violet-100/70">Parrainage</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Parrainez un confrère</h2>
          </div>
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-7 text-violet-50/88">
          Invitez un confrère à utiliser Zolio. S&apos;il s&apos;abonne à la version PRO, vous gagnez tous les deux
          <span className="font-semibold text-white"> -50% sur votre prochain mois</span>.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/8 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.26em] text-violet-100/70">
            Votre code de parrainage unique
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="flex-1 rounded-lg bg-white/12 px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.24em] text-white">
              {referralCode}
            </code>
            <button
              type="button"
              onClick={copyReferralMessage}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
            >
              <Copy size={16} />
              Copier le message
            </button>
          </div>
        </div>

        {!referralApplied ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/18 p-4">
            <p className="text-sm font-semibold text-white">Vous avez été parrainé ?</p>
            <p className="mt-1 text-sm leading-6 text-violet-50/70">
              Entrez le code reçu pour profiter de l&apos;offre avant votre passage en PRO.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                name="referredBy"
                value={formData.referredBy}
                onChange={handleChange}
                placeholder="Entrez le code de votre parrain"
                className="w-full rounded-lg border border-white/15 bg-white/10 px-4 py-3 text-base text-white outline-none transition placeholder:text-violet-100/60 focus:border-white/30 focus:ring-4 focus:ring-white/10"
              />
              <button
                type="button"
                onClick={saveSettings}
                disabled={isSaving || !formData.referredBy}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Valider
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/18 text-emerald-200">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Vous avez été parrainé</p>
              <p className="mt-1 text-sm text-violet-50/78">
                Code appliqué: <span className="font-mono text-white">{referralApplied}</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const legalLinksCard = (
    <ClientSectionCard>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/12 text-violet-700 dark:bg-violet-500/12 dark:text-violet-200">
          <Scale className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Documents légaux</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
            Les bases juridiques de Zolio
          </h2>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {LEGAL_LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between gap-3 rounded-[1.35rem] border border-slate-200/80 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/8 dark:bg-white/4 dark:text-slate-100 dark:hover:border-violet-400/20 dark:hover:text-white"
          >
            <span>{item.label}</span>
            <ExternalLink size={16} className="shrink-0 text-slate-400" />
          </Link>
        ))}
      </div>
    </ClientSectionCard>
  );

  const firstMissingBlock = completionItems.find((item) => !item.filled);

  return (
    <ClientSubpageShell
      title="Paramètres entreprise"
      description="Configurez votre identité commerciale, vos coordonnées bancaires et vos relances."
      eyebrow="Réglages société"
      activeNav="tools"
      breadcrumbs={[{ label: "Outils" }, { label: "Paramètres" }]}
      metaPills={[
        {
          icon: completionPercent === 100 ? CheckCircle2 : Sparkles,
          label: `${completionPercent}% complet`,
          tone: completionPercent === 100 ? "emerald" : completionPercent >= 60 ? "violet" : "amber",
        },
        {
          icon: documentReady ? CheckCircle2 : Sparkles,
          label: documentReady ? "Documents OK" : "Identité à finir",
          tone: documentReady ? "emerald" : "amber",
        },
        {
          label: payoutReady ? "Banque OK" : "IBAN manquant",
          tone: payoutReady ? "emerald" : "slate",
        },
        {
          label: reviewReady ? "Avis activés" : "Avis off",
          tone: reviewReady ? "violet" : "slate",
        },
      ]}
      focusLine={
        completionPercent === 100 ? (
          <>
            <span className="font-semibold text-slate-800 dark:text-slate-100">Tout est paramétré</span>
            {" "}· Vos devis et factures s&apos;émettront avec une identité professionnelle complète.
          </>
        ) : firstMissingBlock ? (
          <>
            Pour finaliser :{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-100">{firstMissingBlock.label.toLowerCase()}</span>
            {" "}· {firstMissingBlock.detail}
          </>
        ) : (
          <>Quelques blocs encore à compléter pour des documents pro de bout en bout.</>
        )
      }
      actions={
        <button
          type="button"
          onClick={() => void saveSettings()}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-zolio px-4 py-2.5 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
          ) : (
            <Save size={16} />
          )}
          Enregistrer
        </button>
      }
      mobilePrimaryAction={
        <button
          type="button"
          onClick={() => void saveSettings()}
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-3.5 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
          ) : (
            <Save size={16} />
          )}
          Sauver
        </button>
      }
      summary={
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ClientHeroStat
            label="Complétude"
            value={`${completionPercent}%`}
            detail={`${completedCount}/${completionItems.length} blocs prêts`}
            tone="violet"
          />
          <ClientHeroStat
            label="Documents"
            value={documentReady ? "Prêts" : "Base"}
            detail={documentReady ? "Nom, adresse, téléphone, SIRET" : "Identité encore incomplète"}
            tone={documentReady ? "emerald" : "amber"}
          />
          <ClientHeroStat
            label="Encaissement"
            value={payoutReady ? "OK" : "À finir"}
            detail={payoutReady ? "IBAN + BIC prêts" : "Coordonnées bancaires manquantes"}
            tone={payoutReady ? "emerald" : "slate"}
          />
          <ClientHeroStat
            label="Avis"
            value={reviewReady ? "Actifs" : "À brancher"}
            detail={reviewReady ? "Lien Google disponible" : "Lien d'avis absent"}
            tone={reviewReady ? "violet" : "slate"}
          />
        </div>
      }
      mobileSummary={
        <ClientMobileOverview
          title="Cockpit vertical"
          description="Gardez vos réglages essentiels visibles sans descendre dans des blocs trop larges : progression, banque, visuel et relance avis sont résumés d'un coup d'œil."
          badge={`${completionPercent}% prêt`}
          items={[
            {
              label: "Complétude",
              value: `${completionPercent}%`,
              detail: `${completedCount}/${completionItems.length} blocs`,
              tone: "violet",
            },
            {
              label: "Documents",
              value: documentReady ? "Prêts" : "Base",
              detail: documentReady ? "Identité complète" : "À finir",
              tone: documentReady ? "emerald" : "amber",
            },
            {
              label: "Banque",
              value: payoutReady ? "OK" : "Manque",
              detail: payoutReady ? "IBAN + BIC" : "Coordonnées",
              tone: payoutReady ? "emerald" : "slate",
            },
            {
              label: "Avis",
              value: reviewReady ? "Actif" : "Off",
              detail: reviewReady ? "Lien Google" : "À ajouter",
              tone: reviewReady ? "violet" : "slate",
            },
          ]}
        />
      }
    >
      {/* ─── Mobile view (< lg) ─────────────────────────── */}
      <div className="space-y-4 sm:space-y-6 lg:hidden">
      {messageCard}

      <div className="space-y-4 xl:hidden">
        {documentPreview}
        {statusCard}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <ClientSectionCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Identité</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                  Ce que vos clients lisent en premier
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Nom, adresse, téléphone, statut et assurance. Tout reste empilé proprement pour une saisie confortable en portrait.
                </p>
              </div>
              <span className="client-chip w-fit bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-100 dark:ring-white/10">
                <BadgeCheck size={14} />
                Bloc entreprise
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  Nom de l&apos;entreprise
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Ex: Maçonnerie Dupont"
                  className={inputClassName}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Adresse postale
                </label>
                <textarea
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleChange}
                  rows={3}
                  placeholder={"123 rue de la République\n75001 Paris"}
                  className={`${textAreaClassName} min-h-[104px] resize-none`}
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Phone className="h-4 w-4 text-slate-400" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="companyPhone"
                  value={formData.companyPhone}
                  onChange={handleChange}
                  placeholder="06 12 34 56 78"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <FileDigit className="h-4 w-4 text-slate-400" />
                  Numéro de SIRET
                </label>
                <input
                  type="text"
                  name="companySiret"
                  value={formData.companySiret}
                  onChange={handleChange}
                  placeholder="123 456 789 00012"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Scale className="h-4 w-4 text-slate-400" />
                  Statut juridique et capital
                </label>
                <input
                  type="text"
                  name="companyStatut"
                  value={formData.companyStatut}
                  onChange={handleChange}
                  placeholder="SARL au capital de 5 000€ - RCS Paris"
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Shield className="h-4 w-4 text-slate-400" />
                  Assurance professionnelle
                </label>
                <input
                  type="text"
                  name="companyAssurance"
                  value={formData.companyAssurance}
                  onChange={handleChange}
                  placeholder="Ex: Assurance décennale MMA N°12345678"
                  className={inputClassName}
                />
              </div>
            </div>
          </ClientSectionCard>

          <ClientSectionCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Habillage</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                  Logo, couleur et réputation
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Ce bloc donne du relief à vos documents sans imposer une mise en page trop large sur mobile vertical.
                </p>
              </div>
              <span className="client-chip w-fit bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-100 dark:ring-violet-400/20">
                <Palette size={14} />
                Couleur active
              </span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <ImageIcon className="h-4 w-4 text-slate-400" />
                    Lien du logo
                  </label>
                  <input
                    type="url"
                    name="companyLogo"
                    value={formData.companyLogo}
                    onChange={handleChange}
                    placeholder="https://mon-site.com/logo.png"
                    className={inputClassName}
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    URL HTTPS publique uniquement. Les liens locaux ou privés sont refusés.
                  </p>
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <Star className="h-4 w-4 text-slate-400" />
                    Lien des avis Google
                  </label>
                  <input
                    type="url"
                    name="companyGoogleReview"
                    value={formData.companyGoogleReview}
                    onChange={handleChange}
                    placeholder="https://g.page/r/.../review"
                    className={inputClassName}
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Utilisé pour demander un avis au client quand la facture est réglée.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4">
                <p className="text-xs uppercase tracking-[0.26em] text-slate-500 dark:text-slate-400">Couleur principale</p>
                <div className="mt-4 flex items-center gap-4">
                  <input
                    type="color"
                    name="companyColor"
                    value={brandColor}
                    onChange={handleChange}
                    className="h-14 w-14 cursor-pointer rounded-2xl border-0 bg-transparent p-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">{brandColor.toUpperCase()}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Bandeau, accents et rappel visuel des documents.
                    </p>
                  </div>
                </div>
                <div
                  className="mt-5 h-12 rounded-lg ring-1 ring-black/5 dark:ring-white/10"
                  style={{ background: `linear-gradient(135deg, ${brandColor}, rgba(255,255,255,0.14))` }}
                />
                {formData.companyGoogleReview ? (
                  <a
                    href={formData.companyGoogleReview}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 transition hover:text-violet-600 dark:text-violet-200"
                  >
                    Voir le lien d&apos;avis
                    <ExternalLink size={14} />
                  </a>
                ) : null}
              </div>
            </div>
          </ClientSectionCard>

          <ClientSectionCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Facturation</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                  Banque, pénalités et CGV
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Tout ce qui termine vos devis et factures proprement, sans repasser dans le PDF ni scroller dans une vue trop dense.
                </p>
              </div>
              <span className="client-chip w-fit bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-100 dark:ring-white/10">
                <Landmark size={14} />
                Paiement & mentions
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  IBAN
                </label>
                <input
                  type="text"
                  name="companyIban"
                  value={formData.companyIban}
                  onChange={handleChange}
                  placeholder="FR76 1234..."
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  BIC
                </label>
                <input
                  type="text"
                  name="companyBic"
                  value={formData.companyBic}
                  onChange={handleChange}
                  placeholder="ABCDEF12"
                  className={inputClassName}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Scale className="h-4 w-4 text-slate-400" />
                  Pénalités de retard et autres mentions légales
                </label>
                <textarea
                  name="companyLegal"
                  value={formData.companyLegal}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Ex: En cas de retard de paiement, pénalité de 10%."
                  className={`${textAreaClassName} min-h-[110px]`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Scale className="h-4 w-4 text-slate-400" />
                  Conditions Générales de Vente (CGV)
                </label>
                <textarea
                  name="companyCgv"
                  value={formData.companyCgv}
                  onChange={handleChange}
                  rows={6}
                  placeholder={"Article 1. Acceptation des conditions...\nArticle 2. Modalités de paiement..."}
                  className={`${textAreaClassName} min-h-[190px]`}
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Ce texte sera ajouté automatiquement en annexe à la fin de vos devis.
                </p>
              </div>
            </div>
        </ClientSectionCard>

        {/* ─── Apparence / Thème ─── */}
        <ClientSectionCard>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Apparence</p>
              <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                Personnalisez votre thème
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Choisissez entre le mode clair, sombre ou laissez votre système décider.
              </p>
            </div>
            <div className="w-full lg:w-[340px]">
              <ThemeSelector />
            </div>
          </div>
        </ClientSectionCard>

        <ClientSectionCard>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Validation</p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                  Enregistrez une base propre pour tous vos documents
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Ces réglages sont réutilisés partout : devis, factures, PDF et relances associées.
                </p>
              </div>

              {/* Langue */}
              <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white/80 p-5 dark:border-white/10 dark:bg-white/6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Langue</h3>
                <LanguageSelector />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200/80 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
                >
                  Retour au cockpit
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-gradient-zolio px-5 py-3 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  ) : (
                    <Save size={16} />
                  )}
                  Enregistrer les paramètres
                </button>
              </div>
            </div>
          </ClientSectionCard>
        </form>

        <div className="hidden space-y-4 xl:sticky xl:top-28 xl:block xl:self-start">
          {documentPreview}
          {statusCard}
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        {referralCard}
        {legalLinksCard}
      </section>
      </div>

      {/* ─── Desktop view (lg+) — v2 dense ─────────────────────── */}
      <div className="hidden lg:block lg:space-y-6">
        {message.text ? (
          <div
            className={`rounded-md border px-4 py-3 text-sm font-medium ${
              message.type === "success"
                ? "border-emerald-300/30 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:text-emerald-300"
                : "border-rose-300/30 bg-rose-500/10 text-rose-700 dark:border-rose-400/20 dark:text-rose-300"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        {/* KPI strip */}
        <div className="grid gap-4 lg:grid-cols-4">
          <DesktopMetricTile
            label="Complétude"
            value={`${completionPercent}%`}
            detail={`${completedCount}/${completionItems.length} blocs`}
            icon={Sparkles}
            tone={completionPercent === 100 ? "success" : completionPercent >= 60 ? "primary" : "warning"}
          />
          <DesktopMetricTile
            label="Documents"
            value={documentReady ? "Prêts" : "À finir"}
            detail={documentReady ? "Identité complète" : "Nom / adresse / SIRET"}
            icon={BadgeCheck}
            tone={documentReady ? "success" : "warning"}
          />
          <DesktopMetricTile
            label="Banque"
            value={payoutReady ? "OK" : "Manque"}
            detail={payoutReady ? "IBAN + BIC prêts" : "Coordonnées à saisir"}
            icon={Landmark}
            tone={payoutReady ? "success" : "neutral"}
          />
          <DesktopMetricTile
            label="Avis"
            value={reviewReady ? "Actifs" : "Off"}
            detail={reviewReady ? "Lien Google branché" : "Lien à ajouter"}
            icon={Star}
            tone={reviewReady ? "primary" : "neutral"}
          />
        </div>

        {/* 2-col body */}
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            {/* Toolbar */}
            <section className="lg-v2-panel flex flex-wrap items-center gap-3 p-4">
              <p className="lg-v2-eyebrow shrink-0">Paramètres entreprise</p>
              <p className="text-xs lg-v2-text-muted">
                {completedCount}/{completionItems.length} blocs renseignés · {completionPercent}%
              </p>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => void saveSettings()}
                disabled={isSaving}
                className="lg-v2-btn lg-v2-btn-primary"
              >
                {isSaving ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                ) : (
                  <Save size={13} aria-hidden />
                )}
                Enregistrer
              </button>
            </section>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identité */}
              <section className="lg-v2-panel p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Building2 size={14} className="text-[var(--v2-text-subtle)]" aria-hidden />
                  <h2 className="text-sm font-semibold lg-v2-text-strong">Identité</h2>
                  <span className="ml-auto text-[10px] uppercase tracking-[0.18em] lg-v2-text-subtle">
                    Nom · adresse · SIRET · statut · assurance
                  </span>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <DesktopField label="Nom de l'entreprise" icon={Building2} className="lg:col-span-2">
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Ex: Maçonnerie Dupont"
                      className="lg-v2-input w-full"
                    />
                  </DesktopField>
                  <DesktopField label="Adresse postale" icon={MapPin} className="lg:col-span-2">
                    <textarea
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleChange}
                      rows={2}
                      placeholder={"123 rue de la République\n75001 Paris"}
                      className="lg-v2-input w-full resize-none"
                    />
                  </DesktopField>
                  <DesktopField label="Téléphone" icon={Phone}>
                    <input
                      type="tel"
                      name="companyPhone"
                      value={formData.companyPhone}
                      onChange={handleChange}
                      placeholder="06 12 34 56 78"
                      className="lg-v2-input w-full"
                    />
                  </DesktopField>
                  <DesktopField label="SIRET" icon={FileDigit}>
                    <input
                      type="text"
                      name="companySiret"
                      value={formData.companySiret}
                      onChange={handleChange}
                      placeholder="123 456 789 00012"
                      className="lg-v2-input w-full"
                    />
                  </DesktopField>
                  <DesktopField label="Statut juridique" icon={Scale}>
                    <input
                      type="text"
                      name="companyStatut"
                      value={formData.companyStatut}
                      onChange={handleChange}
                      placeholder="SARL au capital de 5 000€"
                      className="lg-v2-input w-full"
                    />
                  </DesktopField>
                  <DesktopField label="Assurance pro" icon={Shield}>
                    <input
                      type="text"
                      name="companyAssurance"
                      value={formData.companyAssurance}
                      onChange={handleChange}
                      placeholder="Décennale MMA N°12345678"
                      className="lg-v2-input w-full"
                    />
                  </DesktopField>
                </div>
              </section>

              {/* Habillage */}
              <section className="lg-v2-panel p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Palette size={14} className="text-[var(--v2-text-subtle)]" aria-hidden />
                  <h2 className="text-sm font-semibold lg-v2-text-strong">Habillage & avis</h2>
                  <span className="ml-auto text-[10px] uppercase tracking-[0.18em] lg-v2-text-subtle">
                    Logo · couleur · Google
                  </span>
                </div>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
                  <div className="space-y-3">
                    <DesktopField label="Lien du logo (HTTPS)" icon={ImageIcon}>
                      <input
                        type="url"
                        name="companyLogo"
                        value={formData.companyLogo}
                        onChange={handleChange}
                        placeholder="https://mon-site.com/logo.png"
                        className="lg-v2-input w-full"
                      />
                    </DesktopField>
                    <DesktopField label="Lien avis Google" icon={Star}>
                      <input
                        type="url"
                        name="companyGoogleReview"
                        value={formData.companyGoogleReview}
                        onChange={handleChange}
                        placeholder="https://g.page/r/.../review"
                        className="lg-v2-input w-full"
                      />
                    </DesktopField>
                  </div>
                  <div className="rounded-md border lg-v2-divider bg-[var(--v2-panel-muted)] p-4">
                    <p className="lg-v2-eyebrow">Couleur principale</p>
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        type="color"
                        name="companyColor"
                        value={brandColor}
                        onChange={handleChange}
                        className="h-10 w-10 cursor-pointer rounded-md border-0 bg-transparent p-0"
                      />
                      <div>
                        <p className="text-sm font-semibold tabular-nums lg-v2-text-strong">
                          {brandColor.toUpperCase()}
                        </p>
                        <p className="text-[11px] lg-v2-text-muted">Bandeau & accents</p>
                      </div>
                    </div>
                    <div
                      className="mt-3 h-8 rounded-sm ring-1 ring-black/5 dark:ring-white/10"
                      style={{ background: `linear-gradient(135deg, ${brandColor}, rgba(255,255,255,0.14))` }}
                    />
                  </div>
                </div>
              </section>

              {/* Facturation */}
              <section className="lg-v2-panel p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Landmark size={14} className="text-[var(--v2-text-subtle)]" aria-hidden />
                  <h2 className="text-sm font-semibold lg-v2-text-strong">Banque, pénalités & CGV</h2>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <DesktopField label="IBAN" icon={CreditCard}>
                    <input
                      type="text"
                      name="companyIban"
                      value={formData.companyIban}
                      onChange={handleChange}
                      placeholder="FR76 1234..."
                      className="lg-v2-input w-full"
                    />
                  </DesktopField>
                  <DesktopField label="BIC" icon={CreditCard}>
                    <input
                      type="text"
                      name="companyBic"
                      value={formData.companyBic}
                      onChange={handleChange}
                      placeholder="ABCDEF12"
                      className="lg-v2-input w-full"
                    />
                  </DesktopField>
                  <DesktopField label="Pénalités de retard & mentions légales" icon={Scale} className="lg:col-span-2">
                    <textarea
                      name="companyLegal"
                      value={formData.companyLegal}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Ex: En cas de retard de paiement, pénalité de 10%."
                      className="lg-v2-input w-full"
                    />
                  </DesktopField>
                  <DesktopField label="Conditions Générales de Vente (CGV)" icon={Scale} className="lg:col-span-2">
                    <textarea
                      name="companyCgv"
                      value={formData.companyCgv}
                      onChange={handleChange}
                      rows={4}
                      placeholder={"Article 1. Acceptation des conditions...\nArticle 2. Modalités de paiement..."}
                      className="lg-v2-input w-full"
                    />
                  </DesktopField>
                </div>
              </section>

              {/* Apparence */}
              <section className="lg-v2-panel p-5">
                <div className="flex items-center gap-3">
                  <Palette size={14} className="text-[var(--v2-text-subtle)]" aria-hidden />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold lg-v2-text-strong">Apparence</h2>
                    <p className="mt-0.5 text-xs lg-v2-text-muted">
                      Mode clair, sombre ou automatique.
                    </p>
                  </div>
                  <div className="w-[260px] shrink-0">
                    <ThemeSelector />
                  </div>
                </div>
              </section>

              {/* Langue + actions */}
              <section className="lg-v2-panel p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0">
                    <p className="lg-v2-eyebrow">Langue</p>
                    <p className="mt-0.5 text-xs lg-v2-text-muted">Interface</p>
                  </div>
                  <LanguageSelector />
                  <div className="flex-1" />
                  <Link
                    href="/dashboard"
                    className="lg-v2-btn lg-v2-btn-secondary"
                  >
                    Retour au cockpit
                  </Link>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="lg-v2-btn lg-v2-btn-primary"
                  >
                    {isSaving ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    ) : (
                      <Save size={13} aria-hidden />
                    )}
                    Enregistrer
                  </button>
                </div>
              </section>
            </form>

            {/* Parrainage (full-width below form, denser version) */}
            <section className="lg-v2-panel p-5">
              <div className="mb-3 flex items-center gap-2">
                <Gift size={14} className="text-[var(--v2-text-subtle)]" aria-hidden />
                <h2 className="text-sm font-semibold lg-v2-text-strong">Parrainage</h2>
                <span className="ml-auto text-[10px] uppercase tracking-[0.18em] lg-v2-text-subtle">
                  −50% pour vous & votre filleul
                </span>
              </div>
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="rounded-md border lg-v2-divider bg-[var(--v2-panel-muted)] p-3">
                  <p className="lg-v2-eyebrow">Votre code</p>
                  <code className="mt-1.5 block font-mono text-lg font-bold tracking-[0.18em] lg-v2-text-strong">
                    {referralCode}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={copyReferralMessage}
                  className="lg-v2-btn lg-v2-btn-secondary"
                >
                  <Copy size={13} aria-hidden /> Copier le message
                </button>
              </div>
              {!referralApplied ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <p className="text-xs lg-v2-text-muted">Vous avez été parrainé ?</p>
                  <input
                    type="text"
                    name="referredBy"
                    value={formData.referredBy}
                    onChange={handleChange}
                    placeholder="Code parrain"
                    className="lg-v2-input"
                  />
                  <button
                    type="button"
                    onClick={() => void saveSettings()}
                    disabled={isSaving || !formData.referredBy}
                    className="lg-v2-btn lg-v2-btn-secondary"
                  >
                    Valider
                  </button>
                </div>
              ) : (
                <p className="mt-3 inline-flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 size={13} aria-hidden /> Code appliqué : <span className="font-mono">{referralApplied}</span>
                </p>
              )}
            </section>

            {/* Documents légaux — desktop dense */}
            <section className="lg-v2-panel p-5">
              <div className="mb-3 flex items-center gap-2">
                <Scale size={14} className="text-[var(--v2-text-subtle)]" aria-hidden />
                <h2 className="text-sm font-semibold lg-v2-text-strong">Documents légaux Zolio</h2>
              </div>
              <div className="grid gap-1.5 lg:grid-cols-2">
                {LEGAL_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center justify-between gap-3 rounded-md border lg-v2-divider bg-[var(--v2-panel-muted)] px-3 py-2 text-sm font-semibold transition hover:border-[var(--v2-primary)] lg-v2-text-strong hover:text-[var(--v2-primary)]"
                  >
                    <span className="truncate">{item.label}</span>
                    <ExternalLink size={12} className="shrink-0 text-[var(--v2-text-subtle)]" aria-hidden />
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* Right rail sticky */}
          <aside className="lg:col-span-4 lg:sticky lg:top-6 self-start space-y-4">
            {/* Preview */}
            <section className="lg-v2-panel overflow-hidden p-0">
              <div className="flex items-center justify-between gap-2 border-b lg-v2-divider px-4 py-2.5">
                <p className="lg-v2-eyebrow">Aperçu document</p>
                <span className="text-[10px] uppercase tracking-[0.18em] lg-v2-text-subtle">PDF</span>
              </div>
              <div className="overflow-hidden bg-slate-950 text-white">
                <div className="h-1.5" style={{ backgroundColor: brandColor }} />
                <div className="space-y-3 p-4 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-white/5">
                        {formData.companyLogo && isAllowedLogoUrl(formData.companyLogo) ? (
                          <div className="h-7 w-7 rounded-sm bg-contain bg-center bg-no-repeat" style={logoPreviewStyle} />
                        ) : (
                          <span className="text-xs font-semibold tracking-[0.14em] text-white/88">{companyInitials}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{formData.companyName || "Nom de l'entreprise"}</p>
                        <p className="mt-0.5 truncate text-[10px] text-white/60">{primaryEmail || "email@entreprise.fr"}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-sm border border-white/10 bg-white/6 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/70">
                      Devis
                    </span>
                  </div>
                  <div className="rounded-md border border-white/8 bg-white/[0.04] p-2.5">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-white/40">Coordonnées</p>
                    <div className="mt-1.5 space-y-0.5 text-[11px] text-white/80">
                      <p>{addressLines[0] || "Adresse"}</p>
                      {addressLines.slice(1).map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                      <p>{formData.companyPhone || "Téléphone"}</p>
                    </div>
                  </div>
                  <div className="rounded-md border border-white/8 bg-white/[0.04] p-2.5">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-white/40">Références</p>
                    <div className="mt-1.5 space-y-0.5 text-[11px] text-white/80">
                      <p>SIRET: {formData.companySiret || "à compléter"}</p>
                      <p className="truncate">{formData.companyStatut || "Statut juridique"}</p>
                    </div>
                  </div>
                  <div className="rounded-md border border-white/8 bg-white/[0.04] p-2.5">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-white/40">Paiement</p>
                    <div className="mt-1.5 space-y-0.5 text-[11px] text-white/80">
                      <p className="truncate">{formData.companyIban ? `IBAN ${formData.companyIban}` : "IBAN à renseigner"}</p>
                      <p className="truncate">{formData.companyBic ? `BIC ${formData.companyBic}` : "BIC à renseigner"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* État du dossier — dense */}
            <section className="lg-v2-panel p-5">
              <p className="lg-v2-eyebrow">État du dossier</p>
              <ul className="mt-3 space-y-1.5">
                <StatusRow ok={documentReady} icon={documentReady ? CheckCircle2 : Sparkles} label="Base entreprise" />
                <StatusRow ok={payoutReady} icon={Landmark} label="Coordonnées bancaires" />
                <StatusRow ok={reviewReady} icon={Star} label="Avis Google" tone="primary" />
                <li className="flex items-center gap-2 rounded-md border lg-v2-divider bg-[var(--v2-panel-muted)] px-3 py-2 text-sm">
                  <Clock size={13} className="shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
                  <span className="flex-1 truncate font-semibold lg-v2-text-strong">Relances auto</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newVal = !reminderEnabled;
                      setReminderEnabled(newVal);
                      user.update({
                        unsafeMetadata: {
                          ...user.unsafeMetadata,
                          reminderEnabled: newVal,
                        },
                      }).catch(() => setReminderEnabled(!newVal));
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${reminderEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    aria-pressed={reminderEnabled}
                    aria-label="Relances automatiques"
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition ${reminderEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </li>
                <li className="flex items-center gap-2 rounded-md border lg-v2-divider bg-[var(--v2-panel-muted)] px-3 py-2 text-sm">
                  <Mail size={13} className="shrink-0 text-[var(--v2-primary)]" aria-hidden />
                  <span className="flex-1 truncate font-semibold lg-v2-text-strong">Récap hebdo</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newVal = !weeklyDigestEnabled;
                      setWeeklyDigestEnabled(newVal);
                      user.update({
                        unsafeMetadata: {
                          ...user.unsafeMetadata,
                          weeklyDigestEnabled: newVal,
                        },
                      }).catch(() => setWeeklyDigestEnabled(!newVal));
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${weeklyDigestEnabled ? 'bg-[var(--v2-primary)]' : 'bg-slate-300 dark:bg-slate-600'}`}
                    aria-pressed={weeklyDigestEnabled}
                    aria-label="Récap hebdomadaire"
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition ${weeklyDigestEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </li>
              </ul>
            </section>

            {/* Actions panel */}
            <section className="lg-v2-panel p-5">
              <p className="lg-v2-eyebrow">Actions</p>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => void saveSettings()}
                  disabled={isSaving}
                  className="lg-v2-btn lg-v2-btn-primary w-full justify-center"
                >
                  {isSaving ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  ) : (
                    <Save size={13} aria-hidden />
                  )}
                  Enregistrer les paramètres
                </button>
                <Link
                  href="/dashboard"
                  className="lg-v2-btn lg-v2-btn-secondary w-full justify-center"
                >
                  Retour au cockpit
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </ClientSubpageShell>
  );
}

/* ─── Desktop v2 helpers (lg+ only) ─────────────────────── */

type TileTone = "primary" | "success" | "warning" | "danger" | "neutral";

function DesktopMetricTile({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail?: string;
  icon: typeof Building2;
  tone?: TileTone;
}) {
  const toneClasses: Record<TileTone, string> = {
    primary: "bg-[var(--v2-primary-soft)] text-[var(--v2-primary)]",
    success: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
    danger: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
    neutral: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
  };
  return (
    <div className="lg-v2-panel flex items-start gap-3 p-4">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${toneClasses[tone]}`}>
        <Icon size={15} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="lg-v2-eyebrow">{label}</p>
        <p className="mt-1 text-base font-semibold tabular-nums lg-v2-text-strong">{value}</p>
        {detail ? <p className="mt-0.5 text-xs lg-v2-text-muted">{detail}</p> : null}
      </div>
    </div>
  );
}

function DesktopField({
  label,
  icon: Icon,
  children,
  className = "",
}: {
  label: string;
  icon: typeof Building2;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] lg-v2-text-muted">
        <Icon size={11} className="text-[var(--v2-text-subtle)]" aria-hidden />
        {label}
      </span>
      {children}
    </label>
  );
}

function StatusRow({
  ok,
  icon: Icon,
  label,
  tone = "success",
}: {
  ok: boolean;
  icon: typeof Building2;
  label: string;
  tone?: "success" | "primary";
}) {
  const okColor = tone === "primary"
    ? "text-[var(--v2-primary)]"
    : "text-emerald-700 dark:text-emerald-300";
  return (
    <li className="flex items-center gap-2 rounded-md border lg-v2-divider bg-[var(--v2-panel-muted)] px-3 py-2 text-sm">
      <Icon size={13} className={`shrink-0 ${ok ? okColor : "text-slate-500"}`} aria-hidden />
      <span className="flex-1 truncate font-semibold lg-v2-text-strong">{label}</span>
      <span className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${
        ok
          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
          : "bg-slate-500/12 lg-v2-text-muted"
      }`}>
        {ok ? "OK" : "À faire"}
      </span>
    </li>
  );
}
