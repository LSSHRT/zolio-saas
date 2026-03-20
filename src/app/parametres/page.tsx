"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  FileDigit,
  Gift,
  Image as ImageIcon,
  Landmark,
  MapPin,
  Palette,
  Phone,
  Save,
  Scale,
  Shield,
  Sparkles,
  Star,
} from "lucide-react";
import { ClientBrandMark, ClientHeroStat, ClientSupportButton } from "@/components/client-shell";

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

const inputClassName =
  "w-full rounded-[1rem] border border-slate-200/80 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-violet-400/40 dark:focus:ring-violet-500/10";

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

export default function ParametresEntreprise() {
  const { isLoaded, user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<SettingsMessage>({ type: "", text: "" });
  const [formData, setFormData] = useState<SettingsFormData>(EMPTY_FORM_DATA);
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user || hydratedUserId === user.id) return;

    setFormData(buildFormData(user));
    setHydratedUserId(user.id);
  }, [hydratedUserId, isLoaded, user]);

  if (!isLoaded || !user) {
    return (
      <div className="client-workspace relative min-h-screen overflow-hidden">
        <div className="client-grid-overlay pointer-events-none absolute inset-0" />
        <div className="flex min-h-screen items-center justify-center">
          <div className="client-panel rounded-[2rem] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-600" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Chargement des paramètres entreprise...</p>
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
  const primaryEmail =
    user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "";
  const brandColor = isHexColor(formData.companyColor) ? formData.companyColor : "#0ea5e9";
  const logoPreviewStyle = formData.companyLogo
    ? {
        backgroundImage: `url(${formData.companyLogo})`,
      }
    : undefined;
  const companyInitials = formData.companyName
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
      detail: formData.companyAddress && formData.companyPhone ? "Adresse et téléphone prêts." : "Renseignez adresse et téléphone.",
      filled: Boolean(formData.companyAddress && formData.companyPhone),
    },
    {
      label: "Références légales",
      detail: formData.companySiret && formData.companyStatut ? "SIRET et statut visibles." : "SIRET ou statut à compléter.",
      filled: Boolean(formData.companySiret && formData.companyStatut),
    },
    {
      label: "Habillage document",
      detail: formData.companyLogo || isHexColor(formData.companyColor) ? "Logo ou couleur de marque actifs." : "Ajoutez un logo ou une couleur.",
      filled: Boolean(formData.companyLogo || isHexColor(formData.companyColor)),
    },
    {
      label: "Encaissement",
      detail: formData.companyIban && formData.companyBic ? "IBAN et BIC prêts pour les factures." : "Renseignez les coordonnées bancaires.",
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
    formData.companyName &&
      formData.companyAddress &&
      formData.companyPhone &&
      formData.companySiret,
  );
  const payoutReady = Boolean(formData.companyIban && formData.companyBic);
  const reviewReady = Boolean(formData.companyGoogleReview);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        },
      });
      setMessage({ type: "success", text: "Paramètres enregistrés avec succès." });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Une erreur est survenue lors de l'enregistrement." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
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
      console.error(error);
      setMessage({ type: "error", text: "Impossible de copier le message de parrainage." });
    }
  };

  return (
    <div className="client-workspace relative min-h-screen overflow-x-hidden pb-28 text-slate-950 dark:text-white">
      <div className="client-grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_56%)] dark:bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_58%)]" />

      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-10">
        <header className="client-panel sticky top-3 z-40 rounded-[2rem] px-4 py-4 backdrop-blur-xl sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
                aria-label="Retour"
              >
                <ArrowLeft size={20} />
              </Link>
              <ClientBrandMark />
              <span className="client-chip hidden bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-100 dark:ring-violet-400/20 sm:inline-flex">
                Paramètres entreprise
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <ClientSupportButton compact />
              <button
                type="button"
                onClick={saveSettings}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-4 py-2.5 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                ) : (
                  <Save size={16} />
                )}
                Enregistrer
              </button>
            </div>
          </div>
        </header>

        <main className="mt-4 flex-1 space-y-4 lg:mt-6 lg:space-y-6">
          <section className="client-panel-strong overflow-hidden rounded-[2.25rem] px-5 py-6 sm:px-6 lg:px-7">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_24rem] xl:items-start">
              <div className="max-w-4xl">
                <div className="flex flex-wrap gap-3">
                  <span className="client-chip bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-100 dark:ring-violet-400/20">
                    <Building2 size={14} />
                    Appliqué à tous vos devis et factures
                  </span>
                  <span className="client-chip bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-100 dark:ring-white/10">
                    <Sparkles size={14} />
                    {completionPercent}% prêt
                  </span>
                </div>

                <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  Un cockpit entreprise plus propre, plus utile, plus crédible
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                  Ici, vous préparez tout ce qui sera visible sur vos documents: identité, coordonnées,
                  banque, habillage et mentions. L&apos;objectif est simple: des devis et factures propres sans
                  retouche de dernière minute.
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <ClientHeroStat
                    label="Complétude"
                    value={`${completionPercent}%`}
                    detail={`${completedCount}/${completionItems.length} blocs prêts`}
                    tone="violet"
                  />
                  <ClientHeroStat
                    label="Documents"
                    value={documentReady ? "Prêts" : "Base"}
                    detail={documentReady ? "Vos documents ont une identité complète" : "Nom, adresse, téléphone, SIRET"}
                    tone={documentReady ? "emerald" : "amber"}
                  />
                  <ClientHeroStat
                    label="Encaissement"
                    value={payoutReady ? "OK" : "À finir"}
                    detail={payoutReady ? "IBAN + BIC affichables sur facture" : "Coordonnées bancaires manquantes"}
                    tone={payoutReady ? "emerald" : "slate"}
                  />
                </div>
              </div>

              <div className="client-panel rounded-[1.9rem] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                      Contrôle rapide
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      Ce qui manque encore
                    </h2>
                  </div>
                  <span className="client-chip bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-100 dark:ring-white/10">
                    {completedCount}/{completionItems.length}
                  </span>
                </div>

                <div className="mt-5 h-2 rounded-full bg-slate-200/80 dark:bg-white/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>

                <div className="mt-5 space-y-3">
                  {completionItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 rounded-[1.25rem] border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-white/8 dark:bg-white/4"
                    >
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${
                          item.filled
                            ? "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/12 dark:text-emerald-300"
                            : "bg-amber-400/12 text-amber-600 dark:bg-amber-400/12 dark:text-amber-300"
                        }`}
                      >
                        {item.filled ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.label}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {message.text ? (
            <div
              className={`client-panel rounded-[1.6rem] px-5 py-4 text-sm font-medium ${
                message.type === "success"
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-rose-700 dark:text-rose-300"
              }`}
            >
              {message.text}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <section className="client-panel rounded-[2rem] p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Identité</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      Ce que vos clients lisent en premier
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Nom, adresse, téléphone, statut et assurance. Tout ce qui doit être visible et rassurant.
                    </p>
                  </div>
                  <span className="client-chip bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-100 dark:ring-white/10">
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
              </section>

              <section className="client-panel rounded-[2rem] p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Habillage</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      Logo, couleur et réputation
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Ce bloc donne du relief à vos documents et prépare aussi la relance avis Google.
                    </p>
                  </div>
                  <span className="client-chip bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:bg-violet-500/12 dark:text-violet-100 dark:ring-violet-400/20">
                    <Palette size={14} />
                    Couleur active
                  </span>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem]">
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

                  <div className="rounded-[1.6rem] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4">
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
                      className="mt-5 h-12 rounded-[1rem] ring-1 ring-black/5 dark:ring-white/10"
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
              </section>

              <section className="client-panel rounded-[2rem] p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Facturation</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      Banque, pénalités et CGV
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Tout ce qui termine vos devis et factures proprement, sans repasser dans le PDF.
                    </p>
                  </div>
                  <span className="client-chip bg-slate-900/6 text-slate-700 ring-slate-300/40 dark:bg-white/8 dark:text-slate-100 dark:ring-white/10">
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
              </section>

              <section className="client-panel rounded-[2rem] p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Validation</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      Enregistrez une base propre pour tous vos documents
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Le cockpit applique ces réglages partout: devis, factures, PDF et relances associées.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100"
                    >
                      <ArrowLeft size={16} />
                      Retour au cockpit
                    </Link>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 px-5 py-2.5 text-sm font-semibold text-white shadow-brand disabled:cursor-not-allowed disabled:opacity-60"
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
              </section>
            </form>

            <div className="space-y-4 xl:sticky xl:top-28 xl:self-start">
              <section className="client-panel rounded-[2rem] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Aperçu document</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
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
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.1rem] border border-white/10 bg-white/5">
                          {formData.companyLogo && isAllowedLogoUrl(formData.companyLogo) ? (
                            <div
                              className="h-10 w-10 rounded-xl bg-contain bg-center bg-no-repeat"
                              style={logoPreviewStyle}
                            />
                          ) : (
                            <span className="text-base font-semibold tracking-[0.16em] text-white/88">{companyInitials}</span>
                          )}
                        </div>

                        <div>
                          <p className="text-lg font-semibold text-white">
                            {formData.companyName || "Nom de l'entreprise"}
                          </p>
                          <p className="mt-1 text-sm text-white/60">{primaryEmail || "email@entreprise.fr"}</p>
                        </div>
                      </div>

                      <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
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
                        <p>
                          {formData.companyLegal || "Vos pénalités de retard et mentions légales apparaîtront ici."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="client-panel rounded-[2rem] p-5 sm:p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Etat du dossier</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Lecture rapide
                </h2>

                <div className="mt-5 space-y-3">
                  <div className="flex items-start gap-3 rounded-[1.35rem] border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-white/8 dark:bg-white/4">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${documentReady ? "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/12 dark:text-emerald-300" : "bg-amber-400/12 text-amber-600 dark:bg-amber-400/12 dark:text-amber-300"}`}>
                      {documentReady ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">Base entreprise</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {documentReady ? "Nom, adresse, téléphone et SIRET sont prêts." : "Complétez l'identité de base pour fiabiliser vos documents."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-[1.35rem] border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-white/8 dark:bg-white/4">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${payoutReady ? "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-500/12 dark:text-emerald-300" : "bg-slate-900/6 text-slate-600 dark:bg-white/8 dark:text-slate-300"}`}>
                      <Landmark size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">Coordonnées bancaires</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {payoutReady ? "IBAN et BIC seront visibles sur les factures." : "Ajoutez IBAN et BIC pour les règlements."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-[1.35rem] border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-white/8 dark:bg-white/4">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl ${reviewReady ? "bg-violet-500/12 text-violet-600 dark:bg-violet-500/12 dark:text-violet-300" : "bg-slate-900/6 text-slate-600 dark:bg-white/8 dark:text-slate-300"}`}>
                      <Star size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">Relance avis Google</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {reviewReady ? "Le lien d'avis peut être proposé après paiement." : "Ajoutez le lien d'avis pour activer cette relance."}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-fuchsia-500 to-orange-400 p-[1px] shadow-brand-lg">
              <div className="h-full rounded-[calc(2rem-1px)] bg-[linear-gradient(160deg,rgba(11,13,25,0.88),rgba(20,12,38,0.82))] p-6 text-white sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12">
                    <Gift className="h-5 w-5 text-violet-100" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-violet-100/70">Parrainage</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight">Parrainez un confrère</h2>
                  </div>
                </div>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-violet-50/88">
                  Invitez un confrère à utiliser Zolio. S&apos;il s&apos;abonne à la version PRO, vous gagnez tous les deux
                  <span className="font-semibold text-white"> -50% sur votre prochain mois</span>.
                </p>

                <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-white/8 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.26em] text-violet-100/70">
                    Votre code de parrainage unique
                  </p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <code className="flex-1 rounded-[1rem] bg-white/12 px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.24em] text-white">
                      {referralCode}
                    </code>
                    <button
                      type="button"
                      onClick={copyReferralMessage}
                      className="inline-flex items-center justify-center gap-2 rounded-[1rem] bg-white px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                    >
                      <Copy size={16} />
                      Copier le message
                    </button>
                  </div>
                </div>

                {!referralApplied ? (
                  <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-black/18 p-4">
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
                        className="w-full rounded-[1rem] border border-white/15 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-violet-100/60 focus:border-white/30 focus:ring-4 focus:ring-white/10"
                      />
                      <button
                        type="button"
                        onClick={saveSettings}
                        disabled={isSaving || !formData.referredBy}
                        className="inline-flex items-center justify-center gap-2 rounded-[1rem] bg-white px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Valider
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 flex items-start gap-3 rounded-[1.6rem] border border-emerald-300/20 bg-emerald-500/10 p-4">
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

            <div className="client-panel rounded-[2rem] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/12 text-violet-700 dark:bg-violet-500/12 dark:text-violet-200">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Documents légaux</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    Les bases juridiques de Zolio
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  { href: "/cgv", label: "Conditions Générales de Vente (CGV)" },
                  { href: "/cgu", label: "Conditions Générales d'Utilisation (CGU)" },
                  { href: "/mentions-legales", label: "Mentions Légales" },
                  { href: "/politique-confidentialite", label: "Politique de Confidentialité" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-[1.35rem] border border-slate-200/80 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/8 dark:bg-white/4 dark:text-slate-100 dark:hover:border-violet-400/20 dark:hover:text-white"
                  >
                    <span>{item.label}</span>
                    <ExternalLink size={16} className="text-slate-400" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
