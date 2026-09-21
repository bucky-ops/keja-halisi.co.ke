"use client";
// KEJA HALISI — RatingSheet: "Was this keja real?" 1-5 stars + comment
// Wireframe File C §06: Rating after call — shows on agent card. Demo-persisted locally.
import { useState } from "react";
import { Star, X, MessageSquareHeart, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast } from "@/lib/store";

const STAR_LABELS = ["", "Scam vibes", "Meh", "Decent", "Real keja", "Legit! 🎉"];

export function RatingSheet({
  open,
  onClose,
  agentHandle,
  agentId,
  estateHint,
}: {
  open: boolean;
  onClose: () => void;
  agentHandle: string;
  agentId: string;
  estateHint?: string;
}) {
  const { bumpActivity } = useKeja();
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  // reset form when the sheet re-opens (adjust-state-during-render pattern)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStars(0);
      setHover(0);
      setComment("");
      setDone(false);
    }
  }

  if (!open) return null;

  const submit = () => {
    if (!stars) {
      toast("warning", "Tap the stars first — 1 to 5");
      return;
    }
    try {
      localStorage.setItem(`keja-rating-${agentId}`, JSON.stringify({ stars, comment }));
    } catch {
      /* storage unavailable — demo continues */
    }
    bumpActivity({ ratings: 1 });
    setDone(true);
    toast("success", `Rated ${stars}★ • Thanks! • Review saved to ${agentHandle}'s profile`);
    setTimeout(onClose, 1400);
  };

  return (
    <div
      className="fixed inset-0 z-[95] grid place-items-end sm:place-items-center bg-black/55 p-0 sm:p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Rate agent"
    >
      <div className="slide-up w-full rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl sm:max-w-[420px]">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-kline sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[16px] font-extrabold text-ink">Was this keja real?</h3>
            <p className="mt-0.5 text-[11.5px] font-semibold text-kmuted">
              Rate {agentHandle}
              {estateHint ? ` • ${estateHint}` : ""} — shows on their agent card
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="touch-target grid shrink-0 place-items-center rounded-full hover:bg-kbg">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {done ? (
          <div className="pop mt-6 rounded-2xl border border-verified/30 bg-verified-soft p-5 text-center">
            <p className="font-display text-2xl">{stars >= 4 ? "🎉" : "🙏"}</p>
            <p className="mt-1.5 text-[13px] font-extrabold text-[#08743A]">
              Asante! {stars}★ recorded — {STAR_LABELS[stars]}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[#0a6b40]">
              Trust feedback loop: ratings update the agent card + response-rate badge.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 flex items-center justify-center gap-2" role="radiogroup" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setStars(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  className="touch-target grid place-items-center rounded-xl transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={cn(
                      "h-9 w-9 transition-colors",
                      (hover || stars) >= n ? "fill-gold text-gold drop-shadow-[0_2px_6px_rgba(250,204,21,0.5)]" : "text-kline"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="mt-2 text-center text-[12px] font-extrabold text-ink">
              {STAR_LABELS[hover || stars] || "Tap to rate"}
            </p>

            <div className="mt-4">
              <label htmlFor="rating-comment" className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wide text-kmuted">
                <MessageSquareHeart className="h-3.5 w-3.5" /> Comment (optional — Sheng allowed)
              </label>
              <textarea
                id="rating-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Keja ilikuwa real, msee ni straight..."
                className="mt-1.5 w-full rounded-xl border border-kline bg-white px-3.5 py-2.5 text-[12.5px] outline-none focus:border-trust focus:ring-4 focus:ring-trust/10"
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={onClose} className="touch-target flex-1 rounded-full border border-kline font-bold text-[12.5px] hover:bg-kbg">
                Later
              </button>
              <button
                onClick={submit}
                className="touch-target flex-1 rounded-full bg-verified font-extrabold text-[12.5px] text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Submit rating
              </button>
            </div>
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] font-semibold text-kmuted">
              <ShieldCheck className="h-3 w-3 text-verified" />
              Ratings never expose your phone — privacy by design
            </p>
          </>
        )}
      </div>
    </div>
  );
}
