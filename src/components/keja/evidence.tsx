"use client";
// KEJA HALISI — evidence checklist (required before publish) + OTP input (6 boxes auto-focus)
import { useRef, useState } from "react";
import { Check, CircleCheck, Droplets, Eye, Home as HomeIcon, Video, DoorOpen, Fence } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVIDENCE_ITEMS } from "@/lib/nairobi";

const EVIDENCE_ICONS = [DoorOpen, Fence, HomeIcon, Droplets, Eye];

export function EvidenceChecklist({
  checked,
  onChange,
  readOnly = false,
}: {
  checked: boolean[];
  onChange?: (next: boolean[]) => void;
  readOnly?: boolean;
}) {
  const allDone = checked.every(Boolean);
  return (
    <section
      className={cn(
        "rounded-2xl border p-4",
        allDone ? "bg-verified-soft border-verified/20" : "bg-verified-soft/60 border-verified/15"
      )}
      aria-label="Evidence checklist"
    >
      <header className="flex items-center gap-2">
        <CircleCheck className={cn("h-4.5 w-4.5", allDone ? "text-verified" : "text-verified/50")} />
        <p className="text-[12.5px] font-extrabold text-ok">
          Evidence checklist: {EVIDENCE_ITEMS.join(" • ")}
        </p>
      </header>
      <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {EVIDENCE_ITEMS.map((item, i) => {
          const Icon = EVIDENCE_ICONS[i];
          const on = checked[i];
          return (
            <label
              key={item}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[12px] font-bold transition-colors touch-target",
                on ? "border-verified/40 bg-surface text-ok-strong" : "border-transparent bg-surface/70 text-kmuted",
                readOnly && "cursor-default"
              )}
            >
              <input
                type="checkbox"
                checked={on}
                disabled={readOnly}
                onChange={(e) => {
                  const next = [...checked];
                  next[i] = e.target.checked;
                  onChange?.(next);
                }}
                className="accent-[#0E9F6E]"
              />
              <span className={cn("grid h-4.5 w-4.5 place-items-center rounded-full", on ? "bg-verified" : "bg-verified/25")}>
                {on ? <Check className="h-3 w-3 text-white" /> : null}
              </span>
              <Icon className="h-3.5 w-3.5 shrink-0 text-trust" />
              {item}
            </label>
          );
        })}
      </div>
      <p className="mt-2.5 flex items-center gap-1.5 text-[10.5px] font-semibold text-ok-strong">
        <Video className="h-3.5 w-3.5 text-trust" />
        Required before publish • AI checks presence • TikTok vertical evidence • 5 clips
      </p>
    </section>
  );
}

export function OtpInput({
  value,
  onChange,
  length = 6,
}: {
  value: string;
  onChange: (next: string) => void;
  length?: number;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (i: number, digit: string) => {
    const clean = digit.replace(/\D/g, "");
    if (!clean) return;
    const chars = value.padEnd(length, " ").split("");
    chars[i] = clean.slice(-1);
    onChange(chars.join("").trimEnd());
    if (i < length - 1) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const chars = value.padEnd(length, " ").split("");
      if (chars[i] && chars[i] !== " ") {
        chars[i] = " ";
        onChange(chars.join("").trimEnd());
      } else if (i > 0) {
        chars[i - 1] = " ";
        onChange(chars.join("").trimEnd());
        refs.current[i - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  };

  return (
    <div className="flex gap-2" role="group" aria-label={`${length} digit OTP`}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={value[i] && value[i] !== " " ? value[i] : ""}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={2}
          placeholder="•"
          aria-label={`Digit ${i + 1}`}
          className="h-12 w-12 rounded-xl border-2 border-kline bg-surface text-center font-display text-lg font-extrabold outline-none placeholder:text-kmuted/50 focus:border-trust focus:ring-4 focus:ring-trust/10"
        />
      ))}
    </div>
  );
}

export function Confetti() {
  const colors = ["#1976D2", "#00B140", "#FF0050", "#00F2EA", "#FACC15"];
  return (
    <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden" aria-hidden>
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="confetti-piece absolute top-0 h-2.5 w-2.5 rounded-sm"
          style={{
            left: `${(i * 2.5 + Math.random() * 3) % 100}%`,
            backgroundColor: colors[i % colors.length],
            animationDelay: `${(i % 10) * 0.04}s`,
          }}
        />
      ))}
    </div>
  );
}
