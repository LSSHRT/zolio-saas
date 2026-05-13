import Image from "next/image";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { Clock, Shield, Smartphone, Star } from "lucide-react";
import { AuthHero, AuthMobileProof } from "@/components/auth-hero";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <AuthHero
        badge={{ icon: Star, label: "Votre terrain de jeu préféré" }}
        titleLead="Heureux de vous"
        titleAccent="revoir, pro"
        description="Retrouvez vos devis, relances et clients en un clic. On a gardé tout au chaud pendant que vous étiez sur le chantier."
        bullets={[
          { icon: Clock, label: "Reprenez où vous vous étiez arrêté" },
          { icon: Smartphone, label: "Disponible sur mobile & desktop" },
          { icon: Shield, label: "Vos données chiffrées, sauvegardées" },
        ]}
        testimonial={{
          quote:
            "Avant, je faisais mes devis le dimanche soir. Maintenant, c'est 20 minutes entre deux interventions. Zolio m'a rendu mes week-ends.",
          authorName: "Karim B.",
          authorRole: "Électricien · Lyon",
          authorInitials: "KB",
          avatarTone: "violet",
        }}
      />

      {/* ── RIGHT : sign-in widget ─────────────────────────────────── */}
      <div className="flex w-full flex-col bg-slate-50 dark:bg-slate-950 lg:w-1/2">
        <header className="flex items-center justify-between px-6 pt-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-md shadow-violet-500/30">
              <Image src="/logo.png" alt="Zolio" width={20} height={20} className="h-5 w-5" />
            </div>
            <span className="text-[13px] font-semibold uppercase tracking-[0.22em] text-slate-900 dark:text-white">
              Zolio
            </span>
          </Link>
          <Link href="/sign-up" className="text-sm font-medium text-violet-600 dark:text-violet-300">
            Créer un compte
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-8">
          <div className="w-full max-w-[420px]">
            <AuthMobileProof
              proofLabel="artisans connectés"
              trustBadges={["Connexion sécurisée TLS", "Hébergé en France", "Conforme RGPD"]}
            />

            <div className="mb-6 text-center lg:text-left">
              <h2 className="text-[26px] font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[28px]">
                Connectez-vous
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                Pas encore de compte ?{" "}
                <Link
                  href="/sign-up"
                  className="font-semibold text-violet-600 underline-offset-4 hover:underline dark:text-violet-300"
                >
                  Créez le vôtre (gratuit)
                </Link>
              </p>
            </div>

            <SignIn
              appearance={{
                elements: { rootBox: "w-full", card: "!shadow-none !border-0 !bg-transparent" },
              }}
            />

            <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
              Problème de connexion ?{" "}
              <Link
                href="/contact"
                className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Contactez-nous
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
