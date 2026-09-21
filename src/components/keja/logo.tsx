"use client";
// KEJA HALISI — logo mark (house + green tick + Nairobi skyline roof)
import { cn } from "@/lib/utils";

export function LogoMark({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span
      className={cn(
        "grid place-items-center rounded-xl shadow-[0_8px_20px_rgba(25,118,210,0.25)]",
        dark ? "bg-white" : "bg-white",
        className ?? "h-9 w-9"
      )}
      aria-hidden
    >
      <svg viewBox="0 0 64 64" className="h-[72%] w-[72%]" fill="none">
        <path d="M8 30 L32 8 L56 30 V52 a4 4 0 0 1 -4 4 H12 a4 4 0 0 1 -4 -4 Z" fill="#1976D2" />
        <path
          d="M14 31 h7 v-6 h3 v-4 h2.5 v4 h3 v-9 h5 v-5.5 l1.5 -2.5 1.5 2.5 V16 h5 v9 h3 v-4 h2.5 v4 h3 v6 h-7 v-5 h-23 z"
          fill="#FFFFFF"
          opacity="0.95"
        />
        <path
          d="M22 42 l7 7 13 -14"
          stroke="#00B140"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </span>
  );
}

export function LogoLockup({ dark = false, onNavigate }: { dark?: boolean; onNavigate?: () => void }) {
  return (
    <button onClick={onNavigate} className="flex items-center gap-2.5 text-left group" aria-label="Keja Halisi home">
      <LogoMark dark={dark} />
      <span className="leading-none">
        <span className={cn("block font-display font-extrabold tracking-tight text-[15px]", dark ? "text-white" : "text-ink")}>
          KEJA HALISI
        </span>
        <span className={cn("block text-[8.5px] font-bold tracking-[0.14em] mt-1", dark ? "text-white/60" : "text-kmuted")}>
          REAL HOUSE • VERIFIED
        </span>
      </span>
    </button>
  );
}
