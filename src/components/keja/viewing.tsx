"use client";
// KEJA HALISI — Book Viewing modal (escrow-safe scheduler)
// Rule: viewing is FREE. No payment before physical viewing (Hakuna Kulipa).
// Confirmation is a simulated Africa's Talking SMS in production slot.
import { useEffect, useMemo, useState } from "react";
import { X, CalendarCheck, Clock, ShieldCheck, Smartphone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast, useKeja } from "@/lib/store";
import type { ListingDTO } from "@/lib/types";

const SLOTS = ["9:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"] as const;

function dayLabel(d: Date, i: number): { short: string; date: string } {
  if (i === 0) return { short: "Today", date: d.toDateString() };
  if (i === 1) return { short: "Tomorrow", date: d.toDateString() };
  return { short: d.toLocaleDateString("en-KE", { weekday: "short" }), date: d.toDateString() };
}

export function ViewingModal({
  listing,
  open,
  onClose,
}: {
  listing: ListingDTO | null;
  open: boolean;
  onClose: () => void;
}) {
  // form mounts fresh on every open → state resets naturally (no reset effect)
  if (!open || !listing) return null;
  return <ViewingForm listing={listing} onClose={onClose} />;
}

function ViewingForm({ listing, onClose }: { listing: ListingDTO; onClose: () => void }) {
  const { logViewing, navigate } = useKeja();
  const [dayIdx, setDayIdx] = useState(0);
  const [slot, setSlot] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const days = useMemo(
    () => Array.from({ length: 5 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d;
    }),
    []
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pick = days[dayIdx];
  const dateLabel = pick.toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "short" });

  // target viewing timestamp from day + slot (drives the home reminder banner)
  const targetTs = useMemo(() => {
    const m = /^(\d+):(\d+)\s*(AM|PM)$/.exec(slot || "");
    const d = new Date(pick);
    if (m) {
      let h = Number(m[1]);
      if (m[3] === "PM" && h !== 12) h += 12;
      if (m[3] === "AM" && h === 12) h = 0;
      d.setHours(h, Number(m[2]), 0, 0);
    }
    return d.getTime();
  }, [pick, slot]);

  const confirm = async () => {
    if (!slot) {
      toast("warning", "Pick a time slot first");
      return;
    }
    setBusy(true);
    // simulated SMS latency
    await new Promise((r) => setTimeout(r, 700));
    logViewing({ listingId: listing.id, estate: listing.estate, date: dateLabel, slot, ts: targetTs });
    toast("success", `Viewing booked • ${dateLabel} ${slot} • SMS sent (simulated)`);
    setBusy(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Book a viewing"
    >
      <div className="slide-up max-h-[90vh] w-full max-w-[460px] overflow-y-auto keja-scroll rounded-3xl bg-surface p-5 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-display text-[16px] font-extrabold text-body">
            <CalendarCheck className="h-4.5 w-4.5 text-trust" /> Book a viewing
          </h3>
          <button onClick={onClose} aria-label="Close" className="touch-target grid place-items-center rounded-full hover:bg-kbg">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* listing summary */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-kline bg-kbg/60 p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-trust-soft text-trust">
            <MapPin className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-extrabold text-body">
              {listing.beds} • {listing.estate}
            </p>
            <p className="truncate text-[10.5px] font-semibold text-kmuted">
              {listing.road ?? listing.estate} • {listing.subCounty} • host {listing.poster.tiktokHandle}
            </p>
          </div>
        </div>

        {/* date chips */}
        <p className="mt-4 text-[10.5px] font-extrabold uppercase tracking-wider text-kmuted">Pick a day</p>
        <div className="mt-2 grid grid-cols-5 gap-1.5" role="group" aria-label="Viewing day">
          {days.map((d, i) => {
            const lab = dayLabel(d, i);
            return (
              <button
                key={lab.date}
                onClick={() => setDayIdx(i)}
                aria-pressed={dayIdx === i}
                className={cn(
                  "min-h-[52px] rounded-xl px-1 py-2 text-center transition-colors",
                  dayIdx === i ? "bg-trust text-white shadow-md" : "bg-kbg text-body/75 hover:bg-trust/10"
                )}
              >
                <span className="block text-[10.5px] font-extrabold">{lab.short}</span>
                <span className={cn("mt-0.5 block text-[9.5px] font-bold", dayIdx === i ? "text-white/75" : "text-kmuted")}>
                  {d.getDate()}/{d.getMonth() + 1}
                </span>
              </button>
            );
          })}
        </div>

        {/* time slots */}
        <p className="mt-4 flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-kmuted">
          <Clock className="h-3 w-3" /> Pick a time (EAT)
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2" role="group" aria-label="Viewing time">
          {SLOTS.map((s) => (
            <button
              key={s}
              onClick={() => setSlot(s)}
              aria-pressed={slot === s}
              className={cn(
                "min-h-11 rounded-xl px-3 py-2.5 text-[12px] font-extrabold transition-colors",
                slot === s ? "bg-ink text-white" : "bg-kbg text-body/75 hover:bg-ink/10"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* note */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Note to agent (optional) — e.g. niko na roomate, tunafit 2"
          className="mt-3 w-full rounded-xl border border-kline bg-surface px-3.5 py-2.5 text-[12.5px] outline-none placeholder:font-medium placeholder:text-kmuted focus:border-trust focus:ring-4 focus:ring-trust/10"
        />

        {/* escrow-safe notice */}
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-verified/25 bg-verified-soft px-3.5 py-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-verified" />
          <p className="text-[11px] font-semibold leading-snug text-ok-strong">
            Viewing is <strong className="font-extrabold">100% free</strong> — hakuna kulipa kabla ya kuona nyumba.
            Paying any viewing fee before the visit = scam. Report it.
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="touch-target flex-1 rounded-full border border-kline py-2.5 text-[12.5px] font-bold text-body hover:bg-kbg"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            disabled={busy}
            className="touch-target flex-[1.6] rounded-full bg-trust py-2.5 text-[12.5px] font-extrabold text-white shadow-[0_8px_20px_rgba(25,118,210,0.3)] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {busy ? "Booking…" : `Confirm • ${dateLabel.split(",")[0]} ${slot || "—"}`}
          </button>
        </div>

        <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[10px] font-semibold text-kmuted">
          <Smartphone className="h-3 w-3" /> Agent gets an SMS + in-app notification (Africa&apos;s Talking — simulated)
        </p>
        <button
          onClick={() => navigate("saved")}
          className="mx-auto mt-1 block text-[10px] font-bold text-trust hover:underline"
        >
          See all your bookings in Saved →
        </button>
      </div>
    </div>
  );
}
