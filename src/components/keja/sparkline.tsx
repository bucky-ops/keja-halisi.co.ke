"use client";
// KEJA HALISI — Sparkline: tiny SVG area chart for admin trust trend cards.
import { useId } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  color: string; // tailwind text color class used for stroke via currentColor
  fillFrom: string; // hex for gradient start
  fillTo: string; // hex for gradient end (transparent)
  label: string;
  total: number;
  delta: number; // % change vs previous window
  height?: number;
}

export function Sparkline({ data, color, fillFrom, fillTo, label, total, delta, height = 44 }: SparklineProps) {
  const gid = useId().replace(/[:]/g, "");
  const w = 120;
  const max = Math.max(...data, 1);
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const pts = data.map((v, i) => [i * step, height - 4 - (v / max) * (height - 12)] as const);

  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;
  const last = pts[pts.length - 1];
  const up = delta >= 0;

  return (
    <div className="min-w-0 flex-1 rounded-2xl border border-kline bg-card p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-kmuted">{label}</p>
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums",
            up ? "bg-verified-soft text-ok-strong" : "bg-scam/10 text-scam"
          )}
          aria-label={`${up ? "up" : "down"} ${Math.abs(delta)} percent vs previous period`}
        >
          {up ? "▲" : "▼"} {Math.abs(delta)}%
        </span>
      </div>
      <p className="mt-0.5 font-display text-[18px] font-extrabold tabular-nums text-body">{total.toLocaleString()}</p>
      <svg viewBox={`0 0 ${w} ${height}`} className="mt-1.5 h-11 w-full overflow-visible" aria-hidden preserveAspectRatio="none">
        <defs>
          <linearGradient id={`sg-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillFrom} stopOpacity="0.35" />
            <stop offset="100%" stopColor={fillTo} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#sg-${gid})`} />
        <path d={line} fill="none" stroke={fillFrom} strokeWidth="2" strokeLinecap="round" className={color} />
        {last && <circle cx={last[0]} cy={last[1]} r="2.5" fill={fillFrom} className="pulse-dot origin-center" />}
      </svg>
    </div>
  );
}
