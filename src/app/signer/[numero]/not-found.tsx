import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText } from "lucide-react";

export default function SignerNotFound() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-4 py-12 text-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-violet-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.18),rgba(251,146,60,0.08),transparent_62%)]" />

      <div className="relative mx-auto w-full max-w-md">
        <div className="mx-auto mb-8 flex w-fit items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 ring-1 ring-white/50">
            <Image src="/logo.png" alt="Zolio" width={28} height={28} className="h-7 w-auto object-contain" priority />
          </div>
          <span className="text-sm font-semibold tracking-[0.22em] text-violet-600">ZOLIO</span>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-[0_28px_70px_-36px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:p-10">
          <div className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-100 ring-4 ring-rose-50">
            <FileText size={30} className="text-rose-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Lien de signature invalide</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Ce lien de signature n&apos;est plus valide ou a expiré. Contactez votre artisan pour obtenir un nouveau lien.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:opacity-90"
          >
            <ArrowLeft size={16} />
            Retour à l&apos;accueil
          </Link>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Propulsé par{" "}
          <Link href="/" className="font-semibold text-violet-500 hover:text-violet-700 hover:underline">
            Zolio
          </Link>
        </p>
      </div>
    </div>
  );
}
