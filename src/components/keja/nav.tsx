"use client";
// KEJA HALISI — sticky header + topbar + mobile bottom nav + footer (sticky footer layout)
// Round 3 redesign: deduped nav, theme toggle, notifications bell, EN/SW language pill, More menu.
import { useEffect, useRef, useState } from "react";
import {
  Home, Building2, PlusCircle, ShieldCheck, Menu, X, MapPin, Bell, Sun, Moon,
  Scale, LayoutDashboard, Wallet, Zap, ZapOff, Globe, ChevronDown, Heart, Search,
  Trophy, GraduationCap, Calculator, ShieldQuestion,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast, type KejaNotification } from "@/lib/store";
import { useT, type DictKey } from "@/lib/i18n";
import { LogoLockup } from "./logo";

const NAV_ITEMS: { key: string; labelKey: DictKey }[] = [
  { key: "home", labelKey: "navDiscover" },
  { key: "estate", labelKey: "navEstates" },
  { key: "saved", labelKey: "navSaved" },
  { key: "map", labelKey: "navMap" },
];

const MORE_ITEMS: { key: string; labelKey: DictKey; icon: typeof LayoutDashboard }[] = [
  { key: "shield", labelKey: "navShield", icon: ShieldQuestion },
  { key: "afford", labelKey: "navAfford", icon: Calculator },
  { key: "agents", labelKey: "navAgents", icon: Trophy },
  { key: "quiz", labelKey: "navQuiz", icon: GraduationCap },
  { key: "compare", labelKey: "navCompare", icon: Scale },
  { key: "verify", labelKey: "navVerify", icon: ShieldCheck },
  { key: "dashboard", labelKey: "navDashboard", icon: LayoutDashboard },
  { key: "payments", labelKey: "navPayments", icon: Wallet },
  // admin intentionally unlisted — console is hidden from all public menus;
  // operators reach it via the direct deep-link /?admin (PIN-gated server-side)
];

export function TopBar() {
  const t = useT();
  return (
    <div className="bg-ink text-white print:hidden">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 py-2 text-[11px] font-semibold">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#19d27c] pulse-dot" aria-hidden />
          {t("topbarRule")}
        </span>
        <span className="hidden text-white/60 sm:inline">{t("topbarPrivacy")}</span>
        <span className="text-tiktok-cyan">{t("topbarSheng")}</span>
      </div>
    </div>
  );
}

/* ---------------- Notifications bell ---------------- */
function relTime(at: number): string {
  const s = Math.max(1, Math.floor((Date.now() - at) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const NOTIF_STYLE: Record<KejaNotification["kind"], { dot: string; icon: string }> = {
  success: { dot: "bg-verified", icon: "text-verified" },
  info: { dot: "bg-trust", icon: "text-trust" },
  warning: { dot: "bg-pending", icon: "text-pending" },
  error: { dot: "bg-scam", icon: "text-scam" },
};

export function NotificationsBell() {
  const { activity, markAllRead } = useKeja();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();
  const notifs = activity.notifications;
  const unread = notifs.filter((n) => n.at > activity.lastReadAt).length;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open && unread > 0) setTimeout(markAllRead, 1200);
        }}
        aria-label={`${t("notifications")}${unread ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
        className="touch-target relative grid place-items-center rounded-full border border-kline bg-surface text-body transition-colors hover:bg-kbg"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="pop absolute -right-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-tiktok-pink px-1 text-[9px] font-extrabold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("notifications")}
          className="slide-up absolute right-0 top-12 z-[70] w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-kline bg-surface shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-kline px-4 py-3">
            <p className="font-display text-[13px] font-extrabold text-body">{t("notifications")}</p>
            <span className="rounded-full bg-kbg px-2 py-0.5 text-[10px] font-bold text-kmuted">{notifs.length}</span>
          </div>
          <div className="keja-scroll max-h-[320px] overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto h-6 w-6 text-kmuted/50" />
                <p className="mt-2 text-[11.5px] font-semibold text-kmuted">
                  No notifications yet — save a keja, log a lead or report a scam and activity lands here.
                </p>
              </div>
            ) : (
              notifs.map((n) => {
                const st = NOTIF_STYLE[n.kind];
                return (
                  <div key={n.id} className="flex gap-3 border-b border-kline/60 px-4 py-3 last:border-0">
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", st.dot)} aria-hidden />
                    <div className="min-w-0">
                      <p className={cn("text-[12px] font-extrabold leading-tight", st.icon)}>{n.title}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-kmuted">{n.body}</p>
                      <p className="mt-1 text-[9.5px] font-bold uppercase tracking-wide text-kmuted/60">{relTime(n.at)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t border-kline bg-kbg/60 px-4 py-2.5">
            <p className="text-[10px] font-semibold text-kmuted">
              🔒 Private to this device • notifications never leave your browser
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Theme toggle ---------------- */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useKeja();
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode — Nairobi night vibes"}
      className={cn(
        "touch-target items-center rounded-full border border-kline bg-surface text-body transition-colors hover:bg-kbg",
        compact ? "grid place-items-center" : "inline-flex gap-1.5 px-3"
      )}
    >
      {isDark ? <Sun className="h-4 w-4 text-gold" /> : <Moon className="h-4 w-4" />}
      {!compact && <span className="text-[11px] font-extrabold">{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
}

/* ---------------- Language pill ---------------- */
export function LangPill() {
  const { lang, setLang } = useKeja();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "sw" : "en")}
      aria-label={`Switch language to ${lang === "en" ? "Kiswahili" : "English"}`}
      className="touch-target hidden items-center gap-1.5 rounded-full border border-kline bg-surface px-3 text-body transition-colors hover:bg-kbg sm:inline-flex"
    >
      <Globe className="h-3.5 w-3.5 text-trust" />
      <span className="text-[11px] font-extrabold">{lang === "en" ? "SW" : "EN"}</span>
    </button>
  );
}

/* ---------------- Header ---------------- */
export function Header() {
  const { view, navigate, session, saved, compare, lowData, setLowData } = useKeja();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const t = useT();

  const go = (key: string) => {
    setMenuOpen(false);
    setMoreOpen(false);
    navigate(key as never);
  };

  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [moreOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-kline bg-surface/92 backdrop-blur-md">
      <div className="mx-auto flex h-[64px] max-w-[1440px] items-center gap-2 px-4">
        <LogoLockup onNavigate={() => go("home")} />

        <nav className="ml-5 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => go(item.key)}
              className={cn(
                "rounded-full px-3.5 py-2 text-[12.5px] font-bold transition-colors",
                view === item.key ? "bg-ink text-white" : "text-kmuted hover:bg-kbg hover:text-body"
              )}
            >
              {item.key === "saved" && saved.length > 0 ? `${t(item.labelKey)} • ${saved.length}` : t(item.labelKey)}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {/* ⌘K command palette trigger */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("keja:open-palette"))}
            aria-label="Open command palette (Cmd+K)"
            title="Search everything — ⌘K"
            className="touch-target hidden items-center gap-2 rounded-full border border-kline bg-surface pl-3 pr-1.5 text-kmuted transition-colors hover:bg-kbg hover:text-body md:inline-flex"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden text-[11px] font-bold lg:inline">Search</span>
            <kbd className="rounded-md border border-kline bg-kbg px-1.5 py-0.5 text-[9px] font-extrabold">⌘K</kbd>
          </button>
          <LangPill />
          <ThemeToggle compact />
          <NotificationsBell />

          <button
            onClick={() => {
              setLowData(!lowData);
              toast(
                "info",
                !lowData
                  ? "Low-data mode ON • autoplay disabled • saves data on 3G"
                  : "Low-data mode OFF • embeds autoplay again"
              );
            }}
            aria-pressed={lowData}
            title="Low-data mode — disables autoplay (Safaricom bundles friendly)"
            className={cn(
              "touch-target hidden items-center gap-1.5 rounded-full border px-3 text-[11px] font-extrabold transition-colors xl:inline-flex",
              lowData ? "border-safaricom bg-safaricom/10 text-ok" : "border-kline bg-surface text-kmuted hover:bg-kbg"
            )}
          >
            {lowData ? <ZapOff className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
            {lowData ? t("dataSaverOn") : t("dataSaver")}
          </button>

          <button
            onClick={() => go("post")}
            aria-label={t("navPost")}
            className="touch-target inline-flex items-center justify-center gap-1.5 rounded-full bg-ink px-3.5 text-[12px] font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] sm:px-4"
          >
            <PlusCircle className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{t("navPost")}</span>
          </button>

          {/* More menu — dashboard / pricing / admin / verify (≥sm; mobile uses burger sheet) */}
          <div className="relative hidden sm:block" ref={moreRef}>
            <button
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-label={t("navMore")}
              className="touch-target inline-flex items-center gap-1 rounded-full border border-kline bg-surface px-3 text-[12px] font-bold text-body hover:bg-kbg"
            >
              <LayoutDashboard className="hidden h-3.5 w-3.5 sm:inline" />
              <span className="hidden sm:inline">{t("navMore")}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", moreOpen && "rotate-180")} />
            </button>
            {moreOpen && (
              <div className="slide-up absolute right-0 top-12 z-[70] w-56 overflow-hidden rounded-2xl border border-kline bg-surface p-1.5 shadow-2xl">
                {MORE_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => go(item.key)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-bold transition-colors",
                      view === item.key ? "bg-ink text-white" : "text-body hover:bg-kbg"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", view === item.key ? "text-white" : "text-trust")} />
                    {t(item.labelKey)}
                    {item.key === "compare" && compare.length > 0 && (
                      <span className="ml-auto rounded-full bg-trust px-1.5 text-[9.5px] font-extrabold text-white">
                        {compare.length}
                      </span>
                    )}
                  </button>
                ))}
                <div className="mt-1 border-t border-kline px-3 py-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-kmuted">
                    <span className={cn("h-1.5 w-1.5 rounded-full pulse-dot", session.verified ? "bg-verified" : "bg-pending")} />
                    {session.verified ? `OTP OK • ${session.phone?.slice(0, 7)}****` : "Demo session — verify to post"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            className="touch-target grid place-items-center rounded-full border border-kline bg-surface text-body lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-kline bg-surface px-4 py-3 lg:hidden" aria-label="Mobile">
          <div className="grid grid-cols-2 gap-2">
            {[
              ...NAV_ITEMS,
              { key: "compare", labelKey: "navCompare" as DictKey },
              { key: "post", labelKey: "navPost" as DictKey },
              { key: "verify", labelKey: "navVerify" as DictKey },
              { key: "agents", labelKey: "navAgents" as DictKey },
              { key: "quiz", labelKey: "navQuiz" as DictKey },
              { key: "afford", labelKey: "navAfford" as DictKey },
              { key: "shield", labelKey: "navShield" as DictKey },
              { key: "dashboard", labelKey: "navDashboard" as DictKey },
              { key: "payments", labelKey: "navPayments" as DictKey },
              // no admin — hidden console, direct URL only
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => go(item.key)}
                className={cn(
                  "touch-target flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-bold",
                  view === item.key ? "bg-ink text-white" : "bg-kbg text-body"
                )}
              >
                {t(item.labelKey)}
                {item.key === "saved" && saved.length > 0 && (
                  <span className="rounded-full bg-tiktok-pink px-1.5 text-[9.5px] font-extrabold text-white">{saved.length}</span>
                )}
                {item.key === "compare" && compare.length > 0 && (
                  <span className="rounded-full bg-trust px-1.5 text-[9.5px] font-extrabold text-white">{compare.length}</span>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setLowData(!lowData);
              setMenuOpen(false);
              toast("info", !lowData ? "Low-data mode ON • autoplay disabled" : "Low-data mode OFF");
            }}
            className={cn(
              "touch-target mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-bold",
              lowData ? "bg-safaricom/10 text-ok" : "bg-kbg text-body"
            )}
          >
            {lowData ? <ZapOff className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            {t("dataSaver")}: {lowData ? "ON" : "OFF"}
          </button>
        </nav>
      )}
    </header>
  );
}

export function BottomNav() {
  const { view, navigate, compare } = useKeja();
  const t = useT();
  const items = [
    { key: "home", labelKey: "navDiscover" as DictKey, icon: Home },
    { key: "estate", labelKey: "navEstates" as DictKey, icon: MapPin },
    { key: "post", labelKey: "navPost" as DictKey, icon: PlusCircle, primary: true },
    { key: "saved", labelKey: "navSaved" as DictKey, icon: Heart },
    { key: "compare", labelKey: "navCompare" as DictKey, icon: Scale, badge: compare.length },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-kline bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Bottom navigation"
    >
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => navigate(item.key as never)}
          className={cn(
            "touch-target relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[9.5px] font-bold",
            item.primary ? "text-trust" : view === item.key ? "text-body" : "text-kmuted"
          )}
        >
          <item.icon className={cn("h-5 w-5", item.primary && "fill-trust/10")} />
          {t(item.labelKey)}
          {"badge" in item && item.badge ? (
            <span className="absolute right-1/4 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-trust px-1 text-[8.5px] font-extrabold text-white">
              {item.badge}
            </span>
          ) : null}
        </button>
      ))}
    </nav>
  );
}

export function Footer() {
  const { navigate, view } = useKeja();
  const t = useT();
  return (
    // on listing view the mobile call bar (fixed, ~60px above bottom nav) overlays the
    // footer bottom line — give extra clearance on mobile in that case
    <footer className={cn("mt-auto bg-ink text-white md:pb-0", view === "listing" ? "pb-[128px]" : "pb-20")}>
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <LogoLockup dark onNavigate={() => navigate("home")} />
          <p className="mt-3 max-w-sm text-[11.5px] leading-relaxed text-white/55">{t("footerTag")}</p>
          <p className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10.5px] font-bold italic text-white/70">
            “{t("banner")}.” Exact addresses, ID and phone numbers are protected information.
          </p>
        </div>
        <div>
          <h4 className="font-display text-[12px] font-bold uppercase tracking-wider text-white/80">{t("footerCoverage")}</h4>
          <p className="mt-2.5 text-[11px] leading-relaxed text-white/50">
            Dagoretti North • Dagoretti South • Embakasi Central • Embakasi East • Embakasi North • Embakasi South •
            Embakasi West • Kamukunji • Kasarani • Kibra • Langata • Makadara • Mathare • Roysambu • Ruaraka • Starehe • Westlands
          </p>
        </div>
        <div>
          <h4 className="font-display text-[12px] font-bold uppercase tracking-wider text-white/80">{t("footerLinks")}</h4>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
            {[
              { key: "home", label: t("footerDiscover") },
              { key: "estate", label: t("footerEstates") },
              { key: "saved", label: t("footerSaved") },
              { key: "map", label: t("footerMap") },
              { key: "compare", label: t("navCompare") },
              { key: "agents", label: t("navAgents") },
              { key: "quiz", label: t("navQuiz") },
              { key: "afford", label: t("navAfford") },
              { key: "shield", label: t("navShield") },
              { key: "post", label: t("footerPost") },
              { key: "verify", label: t("footerVerify") },
              { key: "payments", label: t("footerPricing") },
            ].map((l) => (
              <button
                key={l.key}
                onClick={() => navigate(l.key as never)}
                className="text-[11.5px] font-bold text-white/60 transition-colors hover:text-white"
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-verified/15 px-2.5 py-1 text-[10px] font-extrabold text-[#3ecf8e]">{t("footerTrustChecks")}</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-extrabold text-white/70">{t("footerAutoHide")}</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4">
        <p className="mx-auto max-w-[1440px] px-4 text-[10px] leading-relaxed text-white/40">
          © Keja Halisi v3 • Trust Blue #1976D2 • M-Pesa #12B44A • Verified #0E9F6E • 4 roles inc Caretaker • Borough 6×17 •
          Fresh/NoFee/Verified filters • Fee warning red • Evidence checklist • Privacy: exact number hidden • Phone masked until contact •
          No lorem ipsum • Nairobi real estates • TikTok embedded legally via oEmbed
        </p>
      </div>
    </footer>
  );
}
