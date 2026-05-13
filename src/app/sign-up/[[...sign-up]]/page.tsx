import Image from "next/image";
import Link from "next/link";
import { SignUp } from "@clerk/nextjs";
import { FileSignature, Receipt, Sparkles, Zap } from "lucide-react";
import { AuthHero, AuthMobileProof } from "@/components/auth-hero";

export default function Page() {
  return (
    <div className="flex min-h-screen">
      <AuthHero
        badge={{ icon: Sparkles, label: "3 devis gratuits · Sans carte bancaire" }}
        titleLead="Vos devis,"
        titleAccent="signés en 3 minutes"
        description="Rejoignez les artisans qui transforment leur paperasse en chiffre d'affaires. Zolio s'occupe de tout, de la création à la signature digitale."
        bullets={[
          { icon: Zap, label: "Devis en 3 minutes chrono" },
          { icon: FileSignature, label: "Signature digitale intégrée" },
          { icon: Receipt, label: "Transformation en facture en 1 clic" },
        ]}
        testimonial={{
          quote:
            "Je faisais mes devis sur Excel. Avec Zolio, j'en sors 3 de plus par semaine — et ils sont signés avant que je rentre chez moi.",
          authorName: "Marc D.",
          authorRole: "Plombier · Bordeaux",
          authorInitials: "MD",
          avatarTone: "fuchsia",
        }}
      />

      {/* ── RIGHT : sign-up widget ─────────────────────────────────── */}
      <div className="flex w-full flex-col bg-slate-50 dark:bg-slate-950 lg:w-1/2">
        {/* Mobile header (shown below lg) */}
        <header className="flex items-center justify-between px-6 pt-6 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-500 shadow-md shadow-violet-500/30">
              <Image src="/logo.png" alt="Zolio" width={20} height={20} className="h-5 w-5" />
            </div>
            <span className="text-[13px] font-semibold uppercase tracking-[0.22em] text-slate-900 dark:text-white">
              Zolio
            </span>
          </Link>
          <Link href="/sign-in" className="text-sm font-medium text-violet-600 dark:text-violet-300">
            Se connecter
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-8">
          <div className="w-full max-w-[420px]">
            <AuthMobileProof
              trustBadges={["3 devis gratuits", "Sans carte bancaire", "RGPD · Hébergé en France"]}
            />

            <div className="mb-6 text-center lg:text-left">
              <h2 className="text-[26px] font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-[28px]">
                Créez votre compte
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                Déjà client ?{" "}
                <Link
                  href="/sign-in"
                  className="font-semibold text-violet-600 underline-offset-4 hover:underline dark:text-violet-300"
                >
                  Connectez-vous
                </Link>
              </p>
            </div>

            <SignUp
              appearance={{
                elements: { rootBox: "w-full", card: "!shadow-none !border-0 !bg-transparent" },
              }}
            />

            <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-500">
              En créant votre compte, vous acceptez nos{" "}
              <Link
                href="/cgu"
                className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300"
              >
                CGU
              </Link>{" "}
              et notre{" "}
              <Link
                href="/politique-confidentialite"
                className="underline underline-offset-2 hover:text-slate-700 dark:hover:text-slate-300"
              >
                politique de confidentialité
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
