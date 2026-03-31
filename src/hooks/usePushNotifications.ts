"use client";

import { useEffect, useState } from "react";
import { logError, logWarn } from "@/lib/logger";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && !!VAPID_PUBLIC_KEY;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const supported = isPushSupported();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier abonnement au montage
  useEffect(() => {
    if (!supported) return;

    (async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        logError("push-check", error);
      }
    })();
  }, [supported]);

  async function subscribe() {
    if (!supported) return;
    setIsLoading(true);

    try {
      // Enregistrer le service worker
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Demander la permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        logWarn("push-permission", new Error("Notification permission denied"));
        setIsLoading(false);
        return false;
      }

      // S'abonner aux notifications push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      // Envoyer l'abonnement au serveur
      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      logError("push-subscribe", error);
      setIsLoading(false);
      return false;
    }
  }

  async function unsubscribe() {
    if (!supported) return;
    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Notifier le serveur
        await fetch("/api/notifications/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        // Se désabonner
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (error) {
      logError("push-unsubscribe", error);
      setIsLoading(false);
      return false;
    }
  }

  return { isSupported: supported, isSubscribed, isLoading, subscribe, unsubscribe };
}
