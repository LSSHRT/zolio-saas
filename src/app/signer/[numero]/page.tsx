"use client";

import { useEffect, useState, useRef, use, Suspense } from "react";
import dynamic from "next/dynamic";
import type ReactSignatureCanvas from "react-signature-canvas";
const SignaturePad = dynamic(() => import("@/components/SignaturePad"), { ssr: false });
import { motion } from "framer-motion";
import NextImage from "next/image";
import {
  AlertCircle,
  CheckCircle,
  CircleDollarSign,
  FileSignature,
  Loader2,
  PenTool,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

type PublicQuote = {
  entreprise?: {
    color?: string | null;
    logo?: string | null;
    nom?: string | null;
  } | null;
  nomClient?: string | null;
  signature?: string | null;
  statut?: string | null;
  totalTTC?: number | string | null;
};

const formatCurrency = (value?: number | string | null) => {
  const amount = typeof value === "string" ? Number.parseFloat(value) : Number(value ?? 0);

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

function SignerDevisContent({ params }: { params: Promise<{ numero: string }> }) {
  const unwrappedParams = use(params);
  const numero = unwrappedParams.numero;
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [devis, setDevis] = useState<PublicQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState(false);

  const sigCanvas = useRef<ReactSignatureCanvas | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Lien invalide ou expiré");
      setLoading(false);
      return;
    }

    fetch(`/api/public/devis/${numero}?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setDevis(data);
      })
      .catch(() => setError("Erreur de connexion"))
      .finally(() => setLoading(false));
  }, [numero, token]);

  const clear = () => {
    sigCanvas.current?.clear();
  };

  const save = async () => {
    if (sigCanvas.current?.isEmpty()) {
      toast.error("Veuillez dessiner votre signature avant de valider.");
      return;
    }

    if (!token) {
      toast.error("Lien invalide ou expiré");
      return;
    }

    const signatureCanvas = sigCanvas.current;
    if (!signatureCanvas) {
      toast.error("Le module de signature n’est pas prêt. Réessayez dans un instant.");
      return;
    }

    setSigning(true);
    try {
      const signatureBase64 = signatureCanvas.getTrimmedCanvas().toDataURL("image/png");
      const res = await fetch(`/api/public/devis/${numero}?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureBase64 }),
      });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(payload?.error || "Erreur lors de l'enregistrement de la signature");
      }

      if (payload?.emailSkippedReason === "missing_client_email") {
        toast.success("Devis signé. L’email client n’a pas été envoyé car aucune adresse n’est enregistrée.");
      } else if (payload?.emailSkippedReason === "smtp_not_configured") {
        toast.success("Devis signé. L’email client n’a pas été envoyé car la messagerie n’est pas configurée.");
      } else if (payload?.emailSkippedReason === "send_failed") {
        toast.success("Devis signé. L’envoi automatique de l’email a échoué, mais la signature est bien enregistrée.");
      } else if (payload?.emailSent) {
        toast.success("Devis signé et copie envoyée au client.");
      } else {
        toast.success("Devis signé avec succès.");
      }

      setSuccess(true);
      import("canvas-confetti").then((confetti) => {
        confetti.default({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur réseau");
    } finally {
      setSigning(false);
    }
  };

  const accentColor = devis?.entreprise?.color || "#7c3aed";
  const companyName = devis?.entreprise?.nom || "Signature en ligne";
  const clientName = devis?.nomClient || "Client";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.10),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-[2rem] border border-white/70 bg-white/90 px-6 py-8 text-center shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900/85 dark:shadow-black/20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Chargement du devis</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Préparation de l’espace de signature sécurisé.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !devis) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.08),_transparent_35%),linear-gradient(180deg,#fff7ed_0%,#fff_100%)] px-6 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-red-100 bg-white p-7 text-center shadow-xl shadow-red-100/40">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">Document introuvable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{error || "Ce devis n'existe pas."}</p>
        </div>
      </div>
    );
  }

  if (success || devis.statut === "Accepté" || devis.signature) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_35%),linear-gradient(180deg,#f0fdf4_0%,#fff_100%)] px-6 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-emerald-100 bg-white p-7 text-center shadow-xl shadow-emerald-100/40">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10"
          >
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </motion.div>
          <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Devis signé</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Le devis n°{numero} a bien été validé. Vous pouvez maintenant fermer cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.10),_transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_46%,#ffffff_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-32 pt-4 sm:px-6 sm:pb-10 sm:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[2rem] border border-white/90 bg-white shadow-[0_28px_70px_-35px_rgba(76,29,149,0.28)]"
        >
          <div className="relative overflow-hidden border-b border-slate-100 px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-36 opacity-90 blur-3xl"
              style={{ background: `linear-gradient(135deg, ${accentColor}24 0%, rgba(255,255,255,0.92) 72%)` }}
            />

            <div className="relative flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white shadow-sm shadow-slate-300/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                Signature sécurisée
              </span>
              <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm shadow-slate-200/60">
                Devis n°{numero}
              </span>
            </div>

            <div className="relative mt-5 flex items-start gap-4">
              {devis.entreprise?.logo ? (
                <NextImage
                  src={devis.entreprise.logo}
                  alt={`Logo ${companyName}`}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-14 w-14 rounded-2xl border border-slate-200 object-contain dark:border-white/10"
                />
              ) : (
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <PenTool className="h-6 w-6" style={{ color: accentColor }} />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{companyName}</h1>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Relisez les informations ci-dessous, signez en portrait, puis validez en bas d’écran.
                </p>
              </div>
            </div>

            <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Client</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{clientName}</p>
              </div>
              <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <CircleDollarSign className="h-3.5 w-3.5" />
                  Montant
                </p>
                <p className="mt-2 text-lg font-bold" style={{ color: accentColor }}>
                  {formatCurrency(devis.totalTTC)}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <FileSignature className="h-3.5 w-3.5" />
                  Étape
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">Signez puis validez</p>
              </div>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-8 sm:py-7">
            <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-inner shadow-slate-100/80 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Votre signature</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Utilisez votre doigt ou un stylet pour signer dans le cadre ci-dessous.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clear}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-violet-300 hover:text-violet-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Effacer
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-[1.5rem] border-2 border-dashed border-slate-300 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                <SignaturePad
                  ref={sigCanvas}
                  penColor="#0f172a"
                  backgroundColor="rgb(255,255,255)"
                  canvasProps={{ className: "h-[280px] w-full cursor-crosshair bg-white sm:h-72" }}
                />
              </div>

              <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm shadow-slate-100">
                En signant ce document, vous confirmez votre accord sur le devis et ses conditions générales de vente.
              </div>
            </div>
          </div>
        </motion.div>

        <div className="sticky bottom-0 z-20 -mx-4 mt-auto border-t border-slate-200 bg-white/98 px-4 py-4 backdrop-blur sm:mx-0 sm:mt-6 sm:rounded-[1.75rem] sm:border sm:px-5 sm:py-5 sm:shadow-lg sm:shadow-slate-200/40">
          <div className="space-y-3">
            <button
              type="button"
              onClick={save}
              disabled={signing}
              className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] px-4 py-4 text-sm font-bold text-white shadow-lg shadow-violet-200/60 transition-all disabled:opacity-50 hover:opacity-95"
              style={{ backgroundColor: accentColor }}
            >
              {signing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
              {signing ? "Enregistrement..." : "Valider et signer"}
            </button>
            <p className="text-center text-xs leading-5 text-slate-600">
              Signature sécurisée, sans application à installer. Prenez le téléphone en portrait pour plus de confort.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignerDevis({ params }: { params: Promise<{ numero: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      }
    >
      <SignerDevisContent params={params} />
    </Suspense>
  );
}
