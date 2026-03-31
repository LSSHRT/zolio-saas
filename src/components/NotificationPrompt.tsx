"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const STORAGE_KEY = "zolio-notif-choice";

export function NotificationPrompt() {
  const { isSupported, isSubscribed, subscribe } = usePushNotifications();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupported) return;
    if (isSubscribed) {
      localStorage.setItem(STORAGE_KEY, "granted");
      return;
    }

    const choice = localStorage.getItem(STORAGE_KEY);
    if (choice === "granted") return;

    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed]);

  async function handleAccept() {
    setLoading(true);
    await subscribe();
    localStorage.setItem(STORAGE_KEY, "granted");
    setShow(false);
    setLoading(false);
  }

  async function handleDeny() {
    localStorage.setItem(STORAGE_KEY, "denied");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={handleDeny}
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <button
          type="button"
          onClick={handleDeny}
          className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm hover:bg-slate-100 hover:text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/20">
            <Bell size={28} className="text-violet-600 dark:text-violet-400" />
          </div>

          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
            Activer les notifications ?
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Recevez une alerte instantanée quand un client signe un devis.
          </p>

          <div className="mt-6 flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={handleAccept}
              disabled={loading}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              <Bell size={16} />
              {loading ? "Activation..." : "Oui, activer les notifications"}
            </button>

            <button
              type="button"
              onClick={handleDeny}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <BellOff size={16} />
              Non merci
            </button>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Vous pourrez changer ce choix dans Paramètres.
          </p>
        </div>
      </div>
    </div>
  );
}
