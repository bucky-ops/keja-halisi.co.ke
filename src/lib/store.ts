"use client";
// KEJA HALISI — SPA navigation + app state (single-route architecture)
// The sandbox preview exposes only "/", so every "page" is a client-side view.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewName =
  | "home"
  | "estate"
  | "saved"
  | "listing"
  | "agent"
  | "verify"
  | "post"
  | "dashboard"
  | "admin"
  | "payments"
  | "map"
  | "compare"
  | "agents"
  | "quiz";

export interface ViewParams {
  borough?: string;
  subCounty?: string;
  estate?: string;
  beds?: string;
  listingId?: string;
  handle?: string;
  tab?: string;
  // search carry-over
  q?: string;
  minPrice?: number;
  maxPrice?: number;
}

// ---- notifications (trust feedback loop) ----
export interface KejaNotification {
  id: number;
  kind: "success" | "info" | "warning" | "error";
  title: string;
  body: string;
  at: number;
}

// ---- renter report log (persisted proof of community policing) ----
export interface ReportLogItem {
  id: number;
  listingId: string;
  estate: string;
  reason: string;
  at: number;
  autoHidden: boolean;
}

// ---- viewing bookings (escrow-safe scheduler, no fee before viewing) ----
export interface ViewingLogItem {
  id: number;
  listingId: string;
  estate: string;
  date: string;
  slot: string;
  at: number;
  /** target viewing timestamp (ms) — optional for backward compatibility */
  ts?: number;
}

// ---- saved searches (alerts when fresh kejas match your filters) ----
export interface SavedSearch {
  id: number;
  label: string;
  createdAt: number;
  filters: KejaFiltersSnapshot;
  /** listing ids seen on the last sync — new ids become "new matches" */
  lastSeen: string[];
  newCount: number;
}

export interface KejaFiltersSnapshot {
  q: string;
  borough: string;
  subCounty: string;
  estate: string;
  beds: string;
  minPrice: number;
  maxPrice: number;
  fresh: boolean;
  noFee: boolean;
  verified: boolean;
  available: boolean;
  sort: "fresh" | "price_asc" | "price_desc" | "response";
}

interface KejaState {
  view: ViewName;
  params: ViewParams;
  history: { view: ViewName; params: ViewParams }[];
  // marketplace filters (persisted)
  filters: {
    q: string;
    borough: string;
    subCounty: string;
    estate: string;
    beds: string;
    minPrice: number;
    maxPrice: number;
    fresh: boolean;
    noFee: boolean;
    verified: boolean;
    available: boolean;
    sort: "fresh" | "price_asc" | "price_desc" | "response";
  };
  saved: string[];
  // recently viewed listing ids (cap 8, most recent first)
  recent: string[];
  // compare tray (max 3)
  compare: string[];
  // saved searches with new-match alerts (cap 6)
  savedSearches: SavedSearch[];
  // demo session (OTP-verified user)
  session: { phone: string | null; verified: boolean };
  // renter activity (trust feedback loop — persisted)
  activity: {
    leads: number;
    reports: number;
    ratings: number;
    upvotes: Record<string, true>;
    notifications: KejaNotification[];
    lastReadAt: number;
    reportLog: ReportLogItem[];
    viewingLog: ViewingLogItem[];
    // scam safety quiz (best % score + plays)
    quizBest: number;
    quizRuns: number;
  };
  // low-data mode (disables embed autoplay / heavy effects)
  lowData: boolean;
  // theme (light/dark)
  theme: "light" | "dark";
  // UI language
  lang: "en" | "sw";
  navigate: (view: ViewName, params?: ViewParams) => void;
  back: () => void;
  setFilters: (patch: Partial<KejaState["filters"]>) => void;
  resetFilters: () => void;
  toggleSaved: (id: string) => void;
  pushRecent: (id: string) => void;
  clearRecent: () => void;
  logViewing: (item: Omit<ViewingLogItem, "id" | "at">) => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  saveSearch: (label: string) => void;
  removeSearch: (id: number) => void;
  runSearch: (id: number) => void;
  /** sync saved searches against a catalog snapshot; notifies on new matches */
  syncSavedSearches: (rows: SearchMatchRow[]) => void;
  setSession: (s: Partial<KejaState["session"]>) => void;
  bumpActivity: (patch: Partial<Pick<KejaState["activity"], "leads" | "reports" | "ratings">>) => void;
  toggleUpvote: (agentId: string) => void;
  notify: (kind: KejaNotification["kind"], title: string, body: string) => void;
  markAllRead: () => void;
  logReport: (item: Omit<ReportLogItem, "id" | "at">) => void;
  recordQuiz: (pct: number) => void;
  setLowData: (v: boolean) => void;
  setTheme: (t: KejaState["theme"]) => void;
  setLang: (l: KejaState["lang"]) => void;
}

/** minimal listing shape needed by the saved-search matcher (keeps store decoupled) */
export interface SearchMatchRow {
  id: string;
  title: string;
  estate: string;
  subCounty: string;
  borough: string;
  road: string | null;
  beds: string;
  price: number;
  fee: boolean;
  freshH: number;
  status: string;
  posterVerified: boolean;
}

const DEFAULT_FILTERS: KejaState["filters"] = {
  q: "",
  borough: "",
  subCounty: "",
  estate: "",
  beds: "",
  minPrice: 3000,
  maxPrice: 100000,
  fresh: false,
  noFee: false,
  verified: false,
  available: false,
  sort: "fresh",
};

export const useKeja = create<KejaState>()(
  persist(
    (set, get) => ({
      view: "home",
      params: {},
      history: [],
      filters: DEFAULT_FILTERS,
      saved: [],
      recent: [],
      compare: [],
      savedSearches: [],
      session: { phone: null, verified: false },
      activity: { leads: 0, reports: 0, ratings: 0, upvotes: {}, notifications: [], lastReadAt: 0, reportLog: [], viewingLog: [], quizBest: 0, quizRuns: 0 },
      lowData: false,
      theme: "light",
      lang: "en",
      navigate: (view, params = {}) => {
        const { view: v, params: p, history } = get();
        set({
          view,
          params,
          history: [...history.slice(-9), { view: v, params: p }],
        });
        if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      },
      back: () => {
        const { history } = get();
        if (history.length === 0) {
          set({ view: "home", params: {} });
          return;
        }
        const prev = history[history.length - 1];
        set({ view: prev.view, params: prev.params, history: history.slice(0, -1) });
      },
      setFilters: (patch) => {
        const cur = get().filters;
        let next = { ...cur, ...patch };
        // Estate is the most specific scope: whenever a concrete estate is set without
        // explicitly setting coarser scopes, drop borough/subCounty — they'd AND the query
        // into an impossible combo (e.g. estate=Umoja + borough=Western → 0 results).
        if (
          patch.estate !== undefined &&
          patch.estate !== "" &&
          patch.borough === undefined &&
          patch.subCounty === undefined
        ) {
          next = { ...next, borough: "", subCounty: "" };
        }
        set({ filters: next });
      },
      resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
      toggleSaved: (id) => {
        const { saved } = get();
        const isSaved = saved.includes(id);
        set({ saved: isSaved ? saved.filter((s) => s !== id) : [...saved, id] });
        if (!isSaved) {
          get().notify("success", "Keja saved", "Added to your shortlist — we watch freshness for you.");
        }
      },
      pushRecent: (id) => {
        const r = get().recent.filter((x) => x !== id);
        set({ recent: [id, ...r].slice(0, 8) });
      },
      clearRecent: () => set({ recent: [] }),
      logViewing: (item) => {
        const a = get().activity;
        const v: ViewingLogItem = { ...item, id: Date.now(), at: Date.now() };
        set({ activity: { ...a, viewingLog: [v, ...(a.viewingLog ?? [])].slice(0, 8) } });
        get().notify(
          "success",
          "Viewing booked",
          `${v.estate} • ${v.date} ${v.slot} • confirmation SMS simulated. Viewing is free — hakuna kulipa.`
        );
      },
      toggleCompare: (id) => {
        const { compare } = get();
        if (compare.includes(id)) {
          set({ compare: compare.filter((c) => c !== id) });
          return;
        }
        if (compare.length >= 3) {
          toast("warning", "Compare tray full — remove one first (max 3)");
          return;
        }
        set({ compare: [...compare, id] });
        if (compare.length + 1 === 2) toast("info", "1 more keja and you can compare side-by-side");
      },
      clearCompare: () => set({ compare: [] }),
      saveSearch: (label) => {
        const { savedSearches, filters } = get();
        const snapshot = JSON.stringify({ ...filters, sort: undefined });
        // dedupe identical filter combos
        if (savedSearches.some((s) => JSON.stringify({ ...s.filters, sort: undefined }) === snapshot)) {
          toast("info", "This search is already saved — check Saved kejas");
          return;
        }
        const s: SavedSearch = {
          id: Date.now(),
          label,
          createdAt: Date.now(),
          filters: { ...filters },
          lastSeen: [],
          newCount: 0,
        };
        set({ savedSearches: [s, ...savedSearches].slice(0, 6) });
        toast("success", "Search saved • we watch for fresh kejas and ping you here");
        get().notify("success", "Search alert created", `${label} — you'll get a notification when new kejas match.`);
      },
      removeSearch: (id) => set({ savedSearches: get().savedSearches.filter((s) => s.id !== id) }),
      runSearch: (id) => {
        const s = get().savedSearches.find((x) => x.id === id);
        if (!s) return;
        set({ filters: { ...get().filters, ...s.filters }, savedSearches: get().savedSearches.map((x) => (x.id === id ? { ...x, newCount: 0 } : x)) });
        get().navigate("estate", { estate: s.filters.estate || undefined, borough: s.filters.borough || undefined, subCounty: s.filters.subCounty || undefined, beds: s.filters.beds || undefined });
        toast("info", `Search running • ${s.label}`);
      },
      syncSavedSearches: (rows) => {
        const searches = get().savedSearches;
        if (searches.length === 0 || rows.length === 0) return;
        // matcher inlined to avoid a circular import with lib/trust
        const matches = (r: SearchMatchRow, f: KejaFiltersSnapshot) => {
          if (f.estate && r.estate !== f.estate) return false;
          if (f.subCounty && r.subCounty !== f.subCounty) return false;
          if (f.borough && r.borough !== f.borough) return false;
          if (f.beds && r.beds !== f.beds) return false;
          if (r.price < f.minPrice || r.price > f.maxPrice) return false;
          if (f.fresh && r.freshH > 24) return false;
          if (f.noFee && r.fee) return false;
          if (f.verified && !r.posterVerified) return false;
          if (f.available && r.status !== "Available") return false;
          if (f.q) {
            const hay = `${r.title} ${r.estate} ${r.subCounty} ${r.road ?? ""}`.toLowerCase();
            if (!hay.includes(f.q.toLowerCase().trim())) return false;
          }
          return true;
        };
        let totalNew = 0;
        let firstLabel = "";
        const next = searches.map((s) => {
          const hits = rows.filter((r) => matches(r, s.filters)).map((r) => r.id);
          if (s.lastSeen.length === 0) {
            // first sync after save/restore — baseline, not "new"
            return { ...s, lastSeen: hits, newCount: 0 };
          }
          const fresh = hits.filter((h) => !s.lastSeen.includes(h));
          if (fresh.length === 0) return s.newCount === 0 ? s : { ...s, newCount: 0 };
          totalNew += fresh.length;
          if (!firstLabel) firstLabel = s.label;
          return { ...s, lastSeen: hits, newCount: fresh.length };
        });
        if (totalNew > 0) {
          set({ savedSearches: next });
          get().notify(
            "success",
            totalNew === 1 ? "1 fresh keja matches your search" : `${totalNew} fresh kejas match your searches`,
            `${firstLabel}${totalNew > 1 ? ` +${totalNew - 1} more` : ""} — open Saved kejas → Saved searches to run it.`
          );
        } else {
          set({ savedSearches: next });
        }
      },
      setSession: (s) => set({ session: { ...get().session, ...s } }),
      bumpActivity: (patch) => {
        const a = get().activity;
        set({
          activity: {
            ...a,
            leads: a.leads + (patch.leads ?? 0),
            reports: a.reports + (patch.reports ?? 0),
            ratings: a.ratings + (patch.ratings ?? 0),
          },
        });
      },
      toggleUpvote: (agentId) => {
        const upvotes = { ...get().activity.upvotes };
        if (upvotes[agentId]) delete upvotes[agentId];
        else {
          upvotes[agentId] = true;
          get().notify("success", "Upvote counted", "Community trust score +1 — asante sana!");
        }
        set({ activity: { ...get().activity, upvotes } });
      },
      notify: (kind, title, body) => {
        const a = get().activity;
        const n: KejaNotification = { id: Date.now() + Math.floor(Math.random() * 999), kind, title, body, at: Date.now() };
        set({ activity: { ...a, notifications: [n, ...(a.notifications ?? [])].slice(0, 12) } });
      },
      markAllRead: () => set({ activity: { ...get().activity, lastReadAt: Date.now() } }),
      logReport: (item) => {
        const a = get().activity;
        const r: ReportLogItem = { ...item, id: Date.now(), at: Date.now() };
        set({
          activity: {
            ...a,
            reportLog: [r, ...(a.reportLog ?? [])].slice(0, 12),
          },
        });
        get().notify(
          r.autoHidden ? "success" : "warning",
          r.autoHidden ? "Listing hidden — 3 strikes" : "Report received",
          r.autoHidden ? `${r.estate} listing auto-hidden pending review. Good catch!` : `${r.reason} report on ${r.estate} — audit trail created.`
        );
      },
      setLowData: (v) => set({ lowData: v }),
      recordQuiz: (pct) => {
        const a = get().activity;
        set({ activity: { ...a, quizRuns: (a.quizRuns ?? 0) + 1, quizBest: Math.max(a.quizBest ?? 0, pct) } });
      },
      setTheme: (t) => set({ theme: t }),
      setLang: (l) => set({ lang: l }),
    }),
    {
      name: "keja-halisi-state",
      // deep-merge nested objects so NEW fields (e.g. viewingLog) survive
      // hydration from older persisted states instead of being lost to undefined
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<KejaState>;
        return {
          ...current,
          ...p,
          filters: { ...current.filters, ...(p.filters ?? {}) },
          session: { ...current.session, ...(p.session ?? {}) },
          activity: {
            ...current.activity,
            ...(p.activity ?? {}),
            upvotes: { ...(p.activity?.upvotes ?? {}) },
          },
        };
      },
      partialize: (s) => ({
        filters: s.filters,
        saved: s.saved,
        recent: s.recent,
        compare: s.compare,
        savedSearches: s.savedSearches,
        session: s.session,
        activity: {
          leads: s.activity.leads,
          reports: s.activity.reports,
          ratings: s.activity.ratings,
          upvotes: s.activity.upvotes,
          notifications: s.activity.notifications,
          lastReadAt: s.activity.lastReadAt,
          reportLog: s.activity.reportLog,
          viewingLog: s.activity.viewingLog,
          quizBest: s.activity.quizBest,
          quizRuns: s.activity.quizRuns,
        },
        lowData: s.lowData,
        theme: s.theme,
        lang: s.lang,
      }),
    }
  )
);

// Toast bus (custom, brand-colored — used across views)
export type ToastKind = "success" | "error" | "warning" | "info";
export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

let toastId = 0;
export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (kind, message) => {
    const id = ++toastId;
    set({ toasts: [...get().toasts.slice(-3), { id, kind, message }] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    }, 3400);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function toast(kind: ToastKind, message: string) {
  useToasts.getState().push(kind, message);
}
