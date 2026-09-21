"use client";
// KEJA HALISI — ⌘K command palette: jump to views, search estates, quick actions.
// Keyboard-first: ⌘K/Ctrl+K toggles, ↑↓ moves, ↵ runs, esc closes.
// Dialog remounts on every open → fresh state with zero reset effects
// (React Compiler auto-memoizes; no manual useMemo/useCallback here).
import { useEffect, useRef, useState } from "react";
import {
  Search, Home, MapPin, Heart, Scale, ShieldCheck, LayoutDashboard, ShieldAlert,
  Wallet, Play, Moon, Sun, Globe, Zap, ZapOff, Building2, CornerDownLeft, ListFilter,
  Trophy, GraduationCap, Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast, type ViewName } from "@/lib/store";
import { fetchListings } from "./api";
import type { ListingDTO } from "@/lib/types";

interface PaletteItem {
  id: string;
  group: "Navigate" | "Estates" | "Actions";
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
  run: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keja:open-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keja:open-palette", onOpen);
    };
  }, []);

  if (!open) return null;
  return <PaletteDialog onClose={() => setOpen(false)} />;
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [estates, setEstates] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { view, navigate, setFilters, resetFilters, theme, setTheme, lang, setLang, lowData, setLowData, compare, clearCompare, session } = useKeja();

  /* focus + estates cache on mount (dialog mounts fresh per open) */
  useEffect(() => {
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    let alive = true;
    fetchListings({ limit: 60 })
      .then((rows: ListingDTO[]) => {
        if (alive) setEstates(Array.from(new Set(rows.map((l) => l.estate))).sort());
      })
      .catch(() => setEstates([]));
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  /* lock scroll while open */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const go = (v: ViewName, params?: Parameters<typeof navigate>[1]) => {
    onClose();
    navigate(v, params);
  };

  const NAV_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    home: Home,
    estate: MapPin,
    saved: Heart,
    listing: Building2,
    agent: Building2,
    map: MapPin,
    compare: Scale,
    verify: ShieldCheck,
    post: Play,
    dashboard: LayoutDashboard,
    payments: Wallet,
    admin: ShieldAlert,
    agents: Trophy,
    quiz: GraduationCap,
    afford: Calculator,
  };
  const NAV_LABELS: Record<string, string> = {
    home: "Discover — home feed",
    estate: "Estates — browse listings",
    saved: "Saved — your shortlist",
    listing: "Latest listing",
    agent: "Agent directory",
    map: "Map — Nairobi discovery",
    compare: "Compare — side-by-side",
    verify: "Verify — agent trust check",
    post: "Post a house",
    dashboard: "Dashboard — owner/developer",
    payments: "Pricing & payments",
    admin: "Admin trust console",
    agents: "Agents — trust leaderboard",
    quiz: "Scam safety quiz — Scam au Legit?",
    afford: "Rent reality check — can you afford it?",
  };

  const nav: PaletteItem[] = (Object.keys(NAV_LABELS) as ViewName[]).map((v) => ({
    id: `nav-${v}`,
    group: "Navigate" as const,
    label: NAV_LABELS[v],
    hint: v === view ? "current" : undefined,
    icon: NAV_ICONS[v],
    keywords: v,
    run: () => go(v),
  }));

  const estateItems: PaletteItem[] = estates.map((e) => ({
    id: `estate-${e}`,
    group: "Estates" as const,
    label: e,
    hint: "search listings",
    icon: MapPin,
    keywords: "estate area nairobi",
    run: () => {
      setFilters({ estate: e });
      toast("info", `Filtering listings • ${e}`);
      go("estate");
    },
  }));

  const actions: PaletteItem[] = [
    {
      id: "act-theme",
      group: "Actions" as const,
      label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
      hint: "theme",
      icon: theme === "dark" ? Sun : Moon,
      keywords: "dark light theme night",
      run: () => {
        setTheme(theme === "dark" ? "light" : "dark");
        toast("info", theme === "dark" ? "Light mode — Nairobi daylight" : "Dark mode — Nairobi night vibes");
      },
    },
    {
      id: "act-lang",
      group: "Actions" as const,
      label: lang === "en" ? "Badilisha kiswahili" : "Switch to English",
      hint: "language",
      icon: Globe,
      keywords: "language swahili english kiswahili",
      run: () => setLang(lang === "en" ? "sw" : "en"),
    },
    {
      id: "act-data",
      group: "Actions" as const,
      label: lowData ? "Turn Data Saver OFF" : "Turn Data Saver ON",
      hint: "low-data",
      icon: lowData ? ZapOff : Zap,
      keywords: "data saver low bandwidth 3g safaricom",
      run: () => {
        setLowData(!lowData);
        toast("info", !lowData ? "Low-data mode ON • autoplay disabled" : "Low-data mode OFF");
      },
    },
    {
      id: "act-compare",
      group: "Actions" as const,
      label: `Clear compare tray (${compare.length})`,
      hint: "compare",
      icon: Scale,
      keywords: "compare clear tray",
      run: () => {
        if (compare.length === 0) {
          toast("info", "Compare tray is already empty");
          return;
        }
        clearCompare();
        toast("success", "Compare tray cleared");
      },
    },
    {
      id: "act-filters",
      group: "Actions" as const,
      label: "Reset all search filters",
      hint: "filters",
      icon: ListFilter,
      keywords: "reset filters clear search",
      run: () => {
        resetFilters();
        toast("success", "Filters reset — full catalog visible");
        go("estate");
      },
    },
  ];

  const items = [...nav, ...estateItems, ...actions];

  const filtered = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) => it.label.toLowerCase().includes(q) || (it.keywords ?? "").includes(q) || it.group.toLowerCase().startsWith(q)
    );
  })();

  /* cursor clamps when the list shrinks */
  const clampedCursor = Math.min(cursor, Math.max(0, filtered.length - 1));

  /* keep the active row in view */
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${clampedCursor}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [clampedCursor]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (filtered.length === 0 ? 0 : (c + 1) % filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (filtered.length === 0 ? 0 : (c - 1 + filtered.length) % filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[clampedCursor]?.run();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/55 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="slide-up w-full max-w-[560px] overflow-hidden rounded-3xl bg-surface shadow-2xl ring-1 ring-kline">
        {/* input row */}
        <div className="flex items-center gap-2.5 border-b border-kline px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-kmuted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search views, estates, actions…"
            className="w-full bg-transparent text-[14px] font-semibold text-body outline-none placeholder:font-medium placeholder:text-kmuted"
            aria-label="Command palette search"
            autoComplete="off"
          />
          <kbd className="hidden rounded-md border border-kline bg-kbg px-1.5 py-0.5 text-[9.5px] font-extrabold text-kmuted sm:block">esc</kbd>
        </div>

        {/* results */}
        <div ref={listRef} className="keja-scroll max-h-[46vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Search className="mx-auto h-6 w-6 text-kline" />
              <p className="mt-2 text-[12.5px] font-bold text-kmuted">
                No matches for “{query}” — try <em>Kasarani</em>, <em>verify</em> or <em>theme</em>
              </p>
            </div>
          ) : (
            filtered.map((it, idx) => {
              const showGroup = it.group !== lastGroup;
              lastGroup = it.group;
              const active = idx === clampedCursor;
              return (
                <div key={it.id}>
                  {showGroup && (
                    <p className="px-3 pb-1 pt-2.5 text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-kmuted/70">
                      {it.group}
                    </p>
                  )}
                  <button
                    data-idx={idx}
                    onMouseMove={() => setCursor(idx)}
                    onClick={it.run}
                    role="option"
                    aria-selected={active}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      active ? "bg-trust text-white" : "text-body hover:bg-kbg"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                        active ? "bg-white/15" : "bg-kbg"
                      )}
                    >
                      <it.icon className={cn("h-4 w-4", active ? "text-white" : "text-trust")} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-extrabold">
                        {it.label}
                        {it.hint === "current" && (
                          <span className={cn("ml-1.5 rounded-full px-1.5 py-0.5 text-[8.5px] font-extrabold", active ? "bg-white/20" : "bg-verified-soft text-verified")}>
                            HERE
                          </span>
                        )}
                      </span>
                      {it.hint && it.hint !== "current" && (
                        <span className={cn("block truncate text-[10px] font-semibold", active ? "text-white/65" : "text-kmuted")}>
                          {it.hint}
                        </span>
                      )}
                    </span>
                    {active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-white/70" />}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* footer legend */}
        <div className="flex items-center justify-between border-t border-kline bg-kbg/60 px-4 py-2.5">
          <p className="flex items-center gap-3 text-[9.5px] font-bold text-kmuted">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-kline bg-surface px-1 py-0.5">↑</kbd>
              <kbd className="rounded border border-kline bg-surface px-1 py-0.5">↓</kbd> move
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-kline bg-surface px-1 py-0.5">↵</kbd> open
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <kbd className="rounded border border-kline bg-surface px-1 py-0.5">⌘</kbd>K toggle
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-[9.5px] font-bold text-kmuted">
            <span className={cn("h-1.5 w-1.5 rounded-full", session.verified ? "bg-verified" : "bg-pending")} />
            {session.verified ? "OTP verified" : "demo session"}
          </p>
        </div>
      </div>
    </div>
  );
}
