"use client";
// KEJA HALISI — PWA install prompt (round 10).
// Captures beforeinstallprompt (Chromium/Android/desktop) and offers a one-tap install.
// iOS Safari cannot be captured — banner explains the Share > Add to Home Screen path instead.
import { useEffect, useState } from "react";
import { Download, X, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISS_KEY = "keja-pwa-dismissed";

export function PwaInstall() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  // iOS detection — no beforeinstallprompt, but A2HS works via the share menu
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // deferred env detection (avoids sync setState-in-effect cascades)
    const t = window.setTimeout(() => {
      setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
      setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    }, 0);

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      if (!localStorage.getItem(DISMISS_KEY)) setVisible(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setVisible(false);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !visible) return null;

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* private mode */ }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferred(null);
    setVisible(false);
  };

  return (
    <div
      className={cn(
        "card-in fixed bottom-20 right-3 z-[80] w-[calc(100vw-24px)] max-w-xs md:bottom-6 md:right-6",
        "overflow-hidden rounded-3xl border border-trust/25 bg-surface shadow-[0_18px_50px_rgba(17,25,40,0.25)]"
      )}
      role="dialog"
      aria-label="Install Keja Halisi app"
    >
      <div className="relative overflow-hidden bg-gradient-to-r from-trust to-verified p-4 text-white">
        <span className="pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full bg-white/15 blur-xl" aria-hidden />
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="touch-target absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-2.5">
          {/* brand tile */}
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/95 shadow-md" aria-hidden>
            <img src="/logo/icon-192.png" alt="Keja Halisi icon" className="h-8 w-8 rounded-lg" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-[13.5px] font-extrabold leading-tight">Install Keja Halisi</p>
            <p className="mt-0.5 text-[10.5px] font-semibold leading-snug text-white/85">
              {isIOS ? "Share → Add to Home Screen" : "Home-screen app • loads fast on bundles"}
            </p>
          </div>
        </div>
      </div>
      <div className="p-3">
        {isIOS ? (
          <p className="flex items-start gap-2 text-[11px] font-semibold leading-relaxed text-kmuted">
            <Share2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-trust" />
            On iPhone: tap the Share button in Safari, then “Add to Home Screen”. The green tick stays in your pocket.
          </p>
        ) : (
          <button
            onClick={install}
            className="touch-target flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 font-display text-[12.5px] font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="h-4 w-4" /> Add to home screen
          </button>
        )}
      </div>
    </div>
  );
}
