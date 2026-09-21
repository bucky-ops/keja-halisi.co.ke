"use client";
// KEJA HALISI — PWA offline shell registration + connectivity feedback.
// Registers public/sw.js (cache-first shell, stale API fallback) and toasts
// when the device goes offline / back online — trust copy stays on even with no network.
import { useEffect } from "react";
import { toast } from "@/lib/store";

export function SwRegister() {
  useEffect(() => {
    // register the offline shell. Dev flag disables chunk caching inside the SW
    // (Turbopack rebuilds change hashes every save — never serve those from cache).
    if ("serviceWorker" in navigator) {
      const onLoad = () => {
        const devFlag = process.env.NODE_ENV === "production" ? "" : "?dev=1";
        navigator.serviceWorker
          .register(`/sw.js${devFlag}`, { scope: "/" })
          .catch(() => {
            /* SW is a progressive enhancement — silent on failure */
          });
      };
      if (document.readyState === "complete") onLoad();
      else window.addEventListener("load", onLoad, { once: true });
    }

    // connectivity feedback loop
    const onOffline = () =>
      toast(
        "warning",
        "You are offline — hakuna net. Browsing cached kejas; fresh listings return when the network is back. Viewing is still free."
      );
    const onOnline = () => toast("success", "Back online — catalog re-synced, fresh kejas loading.");

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    if (typeof navigator !== "undefined" && navigator.onLine === false) onOffline();

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}

/** true when the app is running as an installed PWA (standalone display) */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}
