const fallbackEmail = "contact@zolio.site";

export const dynamic = "force-dynamic";

export default function UnsubscribePage() {
  const replyEmail =
    process.env.PROSPECT_REPLY_TO || process.env.PROSPECT_FROM_EMAIL || fallbackEmail;
  const mailtoHref = `mailto:${replyEmail}?subject=unsubscribe`;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1e1b4b,transparent_45%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-6 py-16 text-white">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-white/10 bg-slate-950/70 p-8 shadow-[0_30px_120px_rgba(15,23,42,0.45)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.32em] text-violet-200/80">Zolio</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Desinscription prospection</h1>
        <p className="mt-4 text-base leading-7 text-slate-300">
          Si vous ne souhaitez plus recevoir de message de notre part, il suffit de repondre
          <strong className="text-white"> STOP</strong> a l&apos;email recu ou d&apos;ecrire directement a
          {" "}
          <a className="text-violet-200 underline decoration-violet-300/40 underline-offset-4" href={mailtoHref}>
            {replyEmail}
          </a>
          .
        </p>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          Nous retirerons votre adresse de notre liste de prospection des reception de votre demande.
        </p>
      </div>
    </main>
  );
}
