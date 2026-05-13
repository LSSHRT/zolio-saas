import Image from "next/image";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { Clock, Shield, Smartphone, Star } from "lucide-react";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      {/* ── LEFT : brand & social proof (desktop only) ─────────────── */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-700 via-fuchsia-600 to-orange-500 px-12 py-10 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.08]" />
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-[420px] w-[420px] rounded-full bg-fuchsia-300/20 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition hover:opacity-90">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
              <Image src="/logo.png" alt="Zolio" width={22} height={22} className="h-[22px] w-[22px]" />
            </div>
            <span className="text-[13px] font-semibold uppercase tracking-[0.24em]">Zolio</span>
          </Link>
          <Link href="/" className="text-sm font-medium text-white/80 transition hover:text-white">
            ← Accueil
          </Link>
        </div>

        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <Star size={13} className="fill-orange-200 text-orange-200" />
            Votre terrain de jeu préféré
          </span>
          <h1 className="mt-5 text-[44px] font-extrabold leading-[1.05] tracking-tight">
            Heureux de vous<br />revoir, <span className="text-orange-200">pro</span>.
          </h1>
          <p className="mt-4 max-w-md text-lg text-white/85">
            Retrouvez vos devis, relances et clients en un clic. On a gardé tout au chaud pendant que vous étiez sur le chantier.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              { icon: Clock, label: "Reprenez où vous vous étiez arrêté" },
              { icon: Smartphone, label: "Disponible sur mobile & desktop" },
              { icon: Shield, label: "Vos données chiffrées, sauvegardées" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-[15px] font-medium">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/15 backdrop-blur">
                  <Icon size={16} />
                </span>
                {label}
              </li>
            ))}
          </ul>

          <figure className="mt-10 max-w-md rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="flex gap-0.5 text-orange-200">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="fill-current" />
              ))}
            </div>
            <blockquote className="mt-3 text-[15px] leading-snug text-white/95">
              « Avant, je faisais mes devis le dimanche soir. Maintenant, c&apos;est 20 minutes entre deux interventions. Zolio m&apos;a rendu mes week-ends. »
            </blockquote>
            <figcaption className="mt-3 flex items-center gap-3 text-sm">
              <Image
                src="https://i.pravatar.cc/80?img=12"
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-full ring-2 ring-white/30"
              />
              <div>
                <p className="font-semibold">Karim B.</p>
                <p className="text-xs text-white/70">Électricien · Lyon</p>
              </div>
            </figcaption>
          </figure>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm">
          <div className="flex -space-x-2.5">
            {[11, 32, 33, 45].map((id) => (
              <Image
                key={id}
                src={`https://i.pravatar.cc/80?img=${id}`}
                alt=""
                width={32}
                height={32}
                className="h-8 w-8 rounded-full ring-2 ring-violet-700"
              />
            ))}
          </div>
          <p className="font-medium">
            <span className="font-bold">250+</span> artisans nous font déjà confiance
          </p>
        </div>
      </aside>

      {/* ── RIGHT : sign-in widget ─────────────────────────────────── */}
      <div className="flex w-full flex-col bg-slate-50 dark:bg-slate-950 lg:w-1/2">
        <header className="flex items-center justify-between px-6 pt-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-md shadow-violet-500/30">
              <Image src="/logo.png" alt="Zolio" width={20} height={20} className="h-5 w-5" />
            </div>
            <span className="text-[13px] font-semibold uppercase tracking-[0.22em] text-slate-900 dark:text-white">Zolio</span>
          </Link>
          <Link href="/sign-up" className="text-sm font-medium text-violet-600 dark:text-violet-300">
            Créer un compte
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-6 text-center lg:text-left">
              <h2 className="text-[26px] font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[28px]">
                Connectez-vous
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                Pas encore de compte ?{" "}
                <Link href="/sign-up" className="font-semibold text-violet-600 underline-offset-4 hover:underline dark:text-violet-300">
                  Créez le vôtre (gratuit)
                </Link>
              </p>
            </div>

            <SignIn appearance={{ elements: { rootBox: "w-full", card: "!shadow-none !border-0 !bg-transparent" } }} />

            <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
              Problème de connexion ?{" "}
              <Link href="/contact" className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300">
                Contactez-nous
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
