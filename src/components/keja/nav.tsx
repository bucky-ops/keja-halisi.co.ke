"use client";
// KEJA HALISI — sticky header + topbar + mobile bottom nav + footer (sticky footer layout)
import { useState } from "react";
import { Home, Building2, PlusCircle, ShieldCheck, Menu, X, Phone, MapPin, LayoutDashboard, ShieldAlert, Wallet, Heart, ZapOff, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeja, toast } from "@/lib/store";
import { LogoLockup } from "./logo";

const NAV_ITEMS: { key: string; label: string }[] = [
  { key: "home", label: "Discover" },
  { key: "estate", label: "Estates" },
  { key: "saved", label: "Saved" },
  { key: "map", label: "Map" },
  { key: "verify", label: "Trust" },
  { key: "dashboard", label: "Dashboard" },
];

export function TopBar() {
  return (
    <div className="bg-ink text-white">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 py-2 text-[11px] font-semibold">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#19d27c] pulse-dot" aria-hidden />
          NO VIEWING FEE BEFORE VIEWING
        </span>
        <span className="hidden text-white/60 sm:inline">Phone masked until contact • IDs encrypted • Demo data</span>
        <span className="text-tiktok-cyan">Hakuna Kulipa Kabla Ya Kuona Nyumba.</span>
      </div>
    </div>
  );
}

export function Header() {
  const { view, navigate, session, saved, lowData, setLowData } = useKeja();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (key: string) => {
    setMenuOpen(false);
    navigate(key as never);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-white/92 backdrop-blur-md" style={{ backgroundColor: "rgba(255,255,255,0.93)" }}>
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-3 px-4">
        <LogoLockup onNavigate={() => go("home")} />

        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => go(item.key)}
              className={cn(
                "rounded-full px-3.5 py-2 text-[12.5px] font-bold transition-colors",
                view === item.key ? "bg-ink text-white" : "text-ink/60 hover:bg-kbg hover:text-ink"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
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
            title="Low-data mode — disables autoplay (safaricom bundles friendly)"
            className={`touch-target hidden items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-extrabold transition-colors xl:inline-flex ${
              lowData ? "border-safaricom bg-safaricom/10 text-[#08743A]" : "border-kline bg-white text-kmuted hover:bg-kbg"
            }`}
          >
            {lowData ? <ZapOff className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
            {lowData ? "Data Saver ON" : "Data Saver"}
          </button>
          <button
            onClick={() => navigate("saved")}
            aria-label={`Saved kejas (${saved.length})`}
            className={`touch-target relative hidden items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12px] font-bold sm:inline-flex ${
              view === "saved" ? "border-ink bg-ink text-white" : "border-kline bg-white text-ink hover:bg-kbg"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${saved.length > 0 ? "fill-tiktok-pink text-tiktok-pink" : ""}`} />
            Saved
            {saved.length > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-tiktok-pink px-1 text-[9px] font-extrabold text-white">
                {saved.length}
              </span>
            )}
          </button>
          <span className="hidden rounded-full bg-trust/10 px-2.5 py-1 text-[9.5px] font-extrabold text-trust xl:inline-flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full pulse-dot", session.verified ? "bg-verified" : "bg-pending")} />
            {session.verified ? `OTP OK • ${session.phone?.slice(0, 7)}****` : "v3 Merged • Live Filters"}
          </span>
          <button
            onClick={() => { navigate("dashboard"); toast("info", "Dashboard refreshed"); }}
            className="touch-target hidden items-center gap-1.5 rounded-full border border-kline bg-white px-3.5 py-2 text-[12px] font-bold text-ink hover:bg-kbg sm:inline-flex"
          >
            <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
          </button>
          <button
            onClick={() => { navigate("admin"); toast("info", "Admin console — moderation + verification queue"); }}
            className="touch-target hidden items-center gap-1.5 rounded-full border border-kline bg-white px-3.5 py-2 text-[12px] font-bold text-ink hover:bg-kbg md:inline-flex"
          >
            <ShieldAlert className="h-3.5 w-3.5" /> Admin
          </button>
          <button
            onClick={() => go("post")}
            className="touch-target rounded-full bg-ink px-4 py-2 text-[12px] font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Post House
          </button>
          <button
            onClick={() => go("verify")}
            className="touch-target hidden rounded-full bg-trust px-4 py-2 text-[12px] font-extrabold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] sm:inline-flex"
          >
            Verify Agent
          </button>
          <button
            className="touch-target grid place-items-center rounded-full border border-kline lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-kline bg-white px-4 py-3 lg:hidden" aria-label="Mobile">
          <div className="grid grid-cols-2 gap-2">
            {[...NAV_ITEMS, { key: "post", label: "Post House" }, { key: "verify", label: "Verify Agent" }, { key: "payments", label: "Payments" }, { key: "admin", label: "Admin" }].map((item) => (
              <button
                key={item.key}
                onClick={() => go(item.key)}
                className={cn(
                  "touch-target rounded-xl px-3 py-2.5 text-left text-[13px] font-bold",
                  view === item.key ? "bg-ink text-white" : "bg-kbg text-ink"
                )}
              >
                {item.label}
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
              lowData ? "bg-safaricom/10 text-[#08743A]" : "bg-kbg text-ink"
            )}
          >
            {lowData ? <ZapOff className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
            Low-data mode: {lowData ? "ON" : "OFF"}
          </button>
        </nav>
      )}
    </header>
  );
}

export function BottomNav() {
  const { view, navigate } = useKeja();
  const items = [
    { key: "home", label: "Home", icon: Home },
    { key: "estate", label: "Estates", icon: MapPin },
    { key: "post", label: "Post", icon: PlusCircle, primary: true },
    { key: "saved", label: "Saved", icon: Heart },
    { key: "verify", label: "Verify", icon: ShieldCheck },
  ];
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-ink/10 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Bottom navigation"
    >
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => navigate(item.key as never)}
          className={cn(
            "touch-target flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[9.5px] font-bold",
            item.primary ? "text-trust" : view === item.key ? "text-ink" : "text-kmuted"
          )}
        >
          <item.icon className={cn("h-5 w-5", item.primary && "fill-trust/10")} />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export function Footer() {
  const { navigate } = useKeja();
  return (
    <footer className="mt-auto bg-ink text-white pb-20 md:pb-0">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <LogoLockup dark onNavigate={() => navigate("home")} />
          <p className="mt-3 max-w-sm text-[11.5px] leading-relaxed text-white/55">
            A Nairobi-focused marketplace designed around how renters actually search: location first, budget fast,
            availability now, trust always. Real House Verified • 2026.
          </p>
          <p className="mt-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10.5px] font-bold italic text-white/70">
            “Hakuna Kulipa Kabla Ya Kuona Nyumba.” Exact addresses, ID and phone numbers are protected information.
          </p>
        </div>
        <div>
          <h4 className="font-display text-[12px] font-bold uppercase tracking-wider text-white/80">Nairobi coverage</h4>
          <p className="mt-2.5 text-[11px] leading-relaxed text-white/50">
            Dagoretti North • Dagoretti South • Embakasi Central • Embakasi East • Embakasi North • Embakasi South •
            Embakasi West • Kamukunji • Kasarani • Kibra • Langata • Makadara • Mathare • Roysambu • Ruaraka • Starehe • Westlands
          </p>
        </div>
        <div>
          <h4 className="font-display text-[12px] font-bold uppercase tracking-wider text-white/80">Quick links</h4>
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
            {[
              { key: "home", label: "Discover" },
              { key: "estate", label: "Estates" },
              { key: "saved", label: "Saved kejas" },
              { key: "map", label: "Nairobi map" },
              { key: "post", label: "Post a house" },
              { key: "verify", label: "Get verified" },
              { key: "payments", label: "Pricing" },
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
            <span className="rounded-full bg-verified/15 px-2.5 py-1 text-[10px] font-extrabold text-[#3ecf8e]">Trust checks on every listing</span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-extrabold text-white/70">3 reports = auto-hide</span>
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
