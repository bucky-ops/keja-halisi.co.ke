"use client";
// KEJA HALISI — EstateGuide: AI-generated estate orientation blurb ("Google Mei style").
// Calls /api/ai/estate-blurb (server LLM with deterministic fallback). Cache per estate in-memory.
import { useState } from "react";
import { Sparkles, RefreshCcw, MapPin, Info } from "lucide-react";
import { toast } from "@/lib/store";

type Blurb = { text: string; source: "ai" | "offline"; at: number };

const cache = new Map<string, Blurb>();

export function EstateGuide({ estate }: { estate: string }) {
  const [blurb, setBlurb] = useState<Blurb | null>(() => cache.get(estate) ?? null);
  const [busy, setBusy] = useState(false);
  const key = estate || "Nairobi";

  const generate = () => {
    setBusy(true);
    // simulated Gemini latency (production: streaming LLM call)
    fetch("/api/ai/estate-blurb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estate: key }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("blurb failed"))))
      .then((d: { text: string; source: "ai" | "offline" }) => {
        const b: Blurb = { text: d.text, source: d.source, at: Date.now() };
        cache.set(key, b);
        setBlurb(b);
        toast("success", d.source === "ai" ? `AI guide ready • ${key}` : `Offline guide ready • ${key}`);
      })
      .catch(() => toast("error", "Guide generation failed — try again"))
      .finally(() => setBusy(false));
  };

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/10 via-surface to-surface p-5"
      aria-label={`AI guide for ${key}`}
    >
      {/* decorative glow */}
      <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/15 blur-2xl" aria-hidden />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 font-display text-[14.5px] font-extrabold text-body">
          <Sparkles className="h-4 w-4 text-gold" />
          AI estate guide • {key}
          {blurb && (
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-warn">
              {blurb.source === "ai" ? "Gemini" : "offline"}
            </span>
          )}
        </h3>
        <button
          onClick={generate}
          disabled={busy}
          className="touch-target inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-surface px-3.5 py-2 text-[11.5px] font-extrabold text-body transition-all hover:bg-gold/15 disabled:opacity-60"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
          {busy ? "Thinking…" : blurb ? "Regenerate" : "Generate guide"}
        </button>
      </div>

      {busy && !blurb && (
        <div className="mt-3 space-y-2" aria-hidden>
          <div className="h-3.5 w-full rounded-full shimmer" />
          <div className="h-3.5 w-4/5 rounded-full shimmer" />
        </div>
      )}

      {blurb && (
        <>
          <p className="mt-3 text-[12.5px] font-medium leading-relaxed text-body/90">{blurb.text}</p>
          <p className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-kmuted">
            <Info className="h-3 w-3 shrink-0" />
            AI-generated orientation — always verify on the ground. Guides are private to this device.
          </p>
        </>
      )}

      {!blurb && !busy && (
        <p className="mt-3 flex items-center gap-2 text-[11.5px] font-semibold text-kmuted">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" />
          Get a 2-line local briefing — vibe, transport, water reliability, what to check during the viewing.
        </p>
      )}
    </section>
  );
}
