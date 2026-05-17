"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Mail, Send, Loader2, ShieldCheck, MessageCircle } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/support";

export default function ContactPage() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSending(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name") as string,
      email: form.get("email") as string,
      subject: form.get("subject") as string,
      message: form.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 429) {
          const retryAfter = Number(res.headers.get("Retry-After")) || 60;
          const minutes = Math.max(1, Math.ceil(retryAfter / 60));
          throw new Error(
            `Trop de tentatives — merci de réessayer dans ${minutes} min.`,
          );
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MOBILE — preserved as-is                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 lg:hidden">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/90">
          <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
            <Link
              href="/"
              aria-label="Retour à l'accueil"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/8 dark:hover:text-white"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-semibold text-slate-950 dark:text-white">Contact</h1>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 py-8">
          {sent ? (
            <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-8 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-500/20">
                <Mail size={28} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Message envoyé !</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Nous vous répondrons dans les plus brefs délais.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/70 bg-white p-6 dark:border-white/8 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Besoin d&apos;aide ?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Remplissez le formulaire ci-dessous ou contactez-nous directement à{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium text-violet-600 underline decoration-violet-300/40 underline-offset-2 dark:text-violet-400"
                >
                  {SUPPORT_EMAIL}
                </a>
              </p>
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50/80 px-3 py-1 text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                <Clock size={12} />
                Réponse sous 24 h ouvrées
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name-m" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Nom <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="contact-name-m"
                      name="name"
                      required
                      placeholder="Votre nom"
                      className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-violet-500/30 transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email-m" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="contact-email-m"
                      name="email"
                      type="email"
                      required
                      placeholder="votre@email.com"
                      className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-violet-500/30 transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-subject-m" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Sujet
                  </label>
                  <input
                    id="contact-subject-m"
                    name="subject"
                    placeholder="Le sujet de votre message"
                    className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-violet-500/30 transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-message-m" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="contact-message-m"
                    name="message"
                    required
                    rows={5}
                    placeholder="Décrivez votre demande..."
                    className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-violet-500/30 transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>

                {error && (
                  <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  aria-busy={sending}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {sending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {sending ? "Envoi en cours..." : "Envoyer le message"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DESKTOP — v2 dense (2-col form + sticky info)                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="hidden min-h-screen lg-v2-workspace lg:block">
        <div className="mx-auto max-w-6xl px-6 py-10">
          {/* Top bar */}
          <header className="mb-8 flex items-start justify-between gap-6">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm lg-v2-text-muted transition hover:lg-v2-text"
              >
                <ArrowLeft size={14} aria-hidden /> Retour à l&apos;accueil
              </Link>
              <p className="mt-3 lg-v2-eyebrow">Support</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight lg-v2-text-strong">
                Contactez l&apos;équipe Zolio
              </h1>
              <p className="mt-1 text-sm lg-v2-text-muted">
                Une question, un bug, une idée ? Écrivez-nous, on répond sous 24 h ouvrées.
              </p>
            </div>
            <span className="lg-v2-pill">
              <Clock size={12} aria-hidden /> Réponse sous 24 h
            </span>
          </header>

          {sent ? (
            <section className="lg-v2-panel mx-auto max-w-2xl p-10 text-center">
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--v2-success-soft)] text-[var(--v2-success)]">
                <Mail size={28} aria-hidden />
              </div>
              <h2 className="text-lg font-semibold lg-v2-text-strong">Message envoyé !</h2>
              <p className="mt-2 text-sm lg-v2-text-muted">
                Nous vous répondrons dans les plus brefs délais.
              </p>
              <Link href="/" className="lg-v2-btn lg-v2-btn-primary mt-6 inline-flex">
                Retour à l&apos;accueil
              </Link>
            </section>
          ) : (
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Form (8/12) */}
              <section className="lg-v2-panel p-6 lg:col-span-8">
                <p className="lg-v2-eyebrow">Formulaire</p>
                <h2 className="mt-1 text-lg font-semibold lg-v2-text-strong">Besoin d&apos;aide ?</h2>
                <p className="mt-1 text-sm lg-v2-text-muted">
                  Renseignez vos coordonnées et le message ci-dessous.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor="contact-name" className="text-sm font-medium lg-v2-text">
                        Nom <span className="text-[var(--v2-danger)]">*</span>
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        required
                        placeholder="Votre nom"
                        className="lg-v2-input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="contact-email" className="text-sm font-medium lg-v2-text">
                        Email <span className="text-[var(--v2-danger)]">*</span>
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        placeholder="votre@email.com"
                        className="lg-v2-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contact-subject" className="text-sm font-medium lg-v2-text">
                      Sujet
                    </label>
                    <input
                      id="contact-subject"
                      name="subject"
                      placeholder="Le sujet de votre message"
                      className="lg-v2-input"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contact-message" className="text-sm font-medium lg-v2-text">
                      Message <span className="text-[var(--v2-danger)]">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={6}
                      placeholder="Décrivez votre demande..."
                      className="lg-v2-input"
                    />
                  </div>

                  {error && (
                    <p className="text-sm font-medium text-[var(--v2-danger)]">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    aria-busy={sending}
                    className="lg-v2-btn lg-v2-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sending ? (
                      <Loader2 size={16} className="animate-spin" aria-hidden />
                    ) : (
                      <Send size={16} aria-hidden />
                    )}
                    {sending ? "Envoi en cours..." : "Envoyer le message"}
                  </button>
                </form>
              </section>

              {/* Sticky info (4/12) */}
              <aside className="space-y-4 lg:col-span-4 lg:sticky lg:top-6 self-start">
                <section className="lg-v2-panel p-5">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={14} className="text-[var(--v2-primary)]" aria-hidden />
                    <p className="lg-v2-eyebrow">Contact direct</p>
                  </div>
                  <p className="mt-2 text-sm lg-v2-text-muted">
                    Vous pouvez aussi nous écrire directement :
                  </p>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--v2-primary)] underline decoration-[var(--v2-primary)]/30 underline-offset-4 hover:decoration-[var(--v2-primary)]"
                  >
                    <Mail size={14} aria-hidden /> {SUPPORT_EMAIL}
                  </a>
                </section>

                <section className="lg-v2-panel p-5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[var(--v2-success)]" aria-hidden />
                    <p className="lg-v2-eyebrow">Engagements</p>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm lg-v2-text-muted">
                    <li className="flex items-start gap-2">
                      <Clock size={14} className="mt-0.5 shrink-0 lg-v2-text-subtle" aria-hidden />
                      Réponse sous 24 h ouvrées
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck size={14} className="mt-0.5 shrink-0 lg-v2-text-subtle" aria-hidden />
                      Vos données restent confidentielles
                    </li>
                    <li className="flex items-start gap-2">
                      <Mail size={14} className="mt-0.5 shrink-0 lg-v2-text-subtle" aria-hidden />
                      Hébergement & envoi sécurisé
                    </li>
                  </ul>
                </section>
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
