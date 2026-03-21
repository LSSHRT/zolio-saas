"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import {
  ClientBrandMark,
  ClientMobileActionsMenu,
  type ClientMobileAction,
} from "@/components/client-shell";

export type CreationWizardStep = {
  description: string;
  title: string;
};

export function CreationWizardShell({
  aside,
  backHref,
  children,
  currentStep,
  description,
  eyebrow = "Parcours guidé",
  footer,
  steps,
  title,
}: {
  aside?: ReactNode;
  backHref: string;
  children: ReactNode;
  currentStep: number;
  description: string;
  eyebrow?: string;
  footer?: ReactNode;
  steps: CreationWizardStep[];
  title: string;
}) {
  return (
    <div className="client-workspace relative min-h-screen overflow-x-hidden pb-[calc(env(safe-area-inset-bottom)+8.25rem)] text-slate-950 dark:text-white sm:pb-24">
      <div className="client-grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.18),transparent_56%)] dark:bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.22),transparent_58%)]" />

      <div className="mx-auto flex min-h-screen w-full max-w-[1320px] flex-col px-4 pb-8 pt-3 sm:px-6 sm:pb-10 sm:pt-4 lg:px-8">
        <header className="client-panel sticky top-2 z-40 rounded-[1.8rem] px-4 py-3 backdrop-blur-xl sm:top-3 sm:rounded-[2rem] sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:hidden">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href={backHref}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
                aria-label="Retour"
              >
                <ArrowLeft size={18} />
              </Link>
              <ClientBrandMark showLabel={false} />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-violet-200">
              {currentStep + 1}/{steps.length}
            </div>
          </div>

          <div className="hidden flex-wrap items-center justify-between gap-4 sm:flex">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href={backHref}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/8 dark:hover:text-white"
                aria-label="Retour"
              >
                <ArrowLeft size={20} />
              </Link>
              <ClientBrandMark />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-violet-200">
              {eyebrow}
            </div>
          </div>
        </header>

        <main className="mt-3 flex-1 space-y-4 sm:mt-4 lg:mt-6 lg:space-y-6">
          <section className="client-panel-strong overflow-hidden rounded-[1.9rem] px-4 py-4 sm:rounded-[2.25rem] sm:px-6 sm:py-6 lg:px-7 md:hidden">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-violet-600 dark:text-violet-200">
                    {eyebrow}
                  </p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                    {title}
                  </h1>
                </div>
                <div className="rounded-[1.2rem] border border-violet-300/40 bg-violet-500/10 px-3 py-2 text-right dark:border-violet-400/20 dark:bg-violet-500/12">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-700 dark:text-violet-100">
                    Étape active
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                    {steps[currentStep]?.title}
                  </p>
                </div>
              </div>

              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {steps[currentStep]?.description}
              </p>

              <div className="grid grid-cols-3 gap-2">
                {steps.map((step, index) => {
                  const isActive = index === currentStep;
                  const isDone = index < currentStep;

                  return (
                    <div
                      key={step.title}
                      className={`rounded-[1.2rem] border px-3 py-3 text-left ${
                        isActive
                          ? "border-violet-300/50 bg-violet-500/10 dark:border-violet-400/20 dark:bg-violet-500/12"
                          : "border-slate-200/70 bg-white/70 dark:border-white/8 dark:bg-white/4"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            isDone
                              ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                              : isActive
                                ? "bg-violet-500/12 text-violet-700 dark:text-violet-200"
                                : "bg-slate-900/6 text-slate-500 dark:bg-white/8 dark:text-slate-300"
                          }`}
                        >
                          {isDone ? <Check size={14} /> : index + 1}
                        </div>
                        <p className="min-w-0 truncate text-xs font-semibold text-slate-900 dark:text-white">
                          {step.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="client-panel-strong hidden overflow-hidden rounded-[2.25rem] px-5 py-6 md:block sm:px-6 lg:px-7">
            <div className="flex flex-col gap-6">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-violet-600 dark:text-violet-200">
                  {eyebrow}
                </p>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  {title}
                </h1>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                  {description}
                </p>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                {steps.map((step, index) => {
                  const isActive = index === currentStep;
                  const isDone = index < currentStep;

                  return (
                    <div
                      key={step.title}
                      className={`rounded-[1.6rem] border p-4 transition ${
                        isActive
                          ? "border-violet-300/50 bg-violet-500/10 shadow-[0_22px_60px_-36px_rgba(124,58,237,0.55)] dark:border-violet-400/20 dark:bg-violet-500/12"
                          : "border-slate-200/70 bg-white/70 dark:border-white/8 dark:bg-white/4"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ring-1 ${
                            isDone
                              ? "bg-emerald-500/12 text-emerald-700 ring-emerald-300/40 dark:text-emerald-300 dark:ring-emerald-400/20"
                              : isActive
                                ? "bg-violet-500/12 text-violet-700 ring-violet-300/40 dark:text-violet-200 dark:ring-violet-400/20"
                                : "bg-slate-900/6 text-slate-600 ring-slate-300/40 dark:bg-white/8 dark:text-slate-300 dark:ring-white/10"
                          }`}
                        >
                          {isDone ? <Check size={18} /> : index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-950 dark:text-white">{step.title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className={aside ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" : ""}>
            <div className="min-w-0">{children}</div>
            {aside ? <div className="min-w-0 xl:sticky xl:top-28 xl:self-start">{aside}</div> : null}
          </section>

          {footer}
        </main>
      </div>
    </div>
  );
}

export function CreationWizardPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`client-panel rounded-[2rem] p-5 sm:p-6 ${className}`}>{children}</section>;
}

export function CreationWizardFooter({
  children,
  mobileMeta,
  mobilePrimaryAction,
  mobileSecondaryActions = [],
}: {
  children: ReactNode;
  mobileMeta?: ReactNode;
  mobilePrimaryAction?: ReactNode;
  mobileSecondaryActions?: ClientMobileAction[];
}) {
  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 sm:sticky sm:bottom-4 sm:inset-x-auto">
      <div className="client-panel rounded-[1.5rem] px-4 py-4 shadow-[0_32px_90px_-52px_rgba(15,23,42,0.42)] sm:rounded-[1.8rem]">
        {mobilePrimaryAction || mobileSecondaryActions.length > 0 ? (
          <>
            <div className="grid gap-3 sm:hidden">
              {mobileMeta}
              <div className="grid gap-3">
                {mobilePrimaryAction}
                {mobileSecondaryActions.length > 0 ? (
                  <ClientMobileActionsMenu items={mobileSecondaryActions} stretch />
                ) : null}
              </div>
            </div>
            <div className="hidden sm:grid sm:gap-3">{children}</div>
          </>
        ) : (
          <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">{children}</div>
        )}
      </div>
    </div>
  );
}
