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
  | "compare";

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
  setSession: (s: Partial<KejaState["session"]>) => void;
  bumpActivity: (patch: Partial<Pick<KejaState["activity"], "leads" | "reports" | "ratings">>) => void;
  toggleUpvote: (agentId: string) => void;
  notify: (kind: KejaNotification["kind"], title: string, body: string) => void;
  markAllRead: () => void;
  logReport: (item: Omit<ReportLogItem, "id" | "at">) => void;
  setLowData: (v: boolean) => void;
  setTheme: (t: KejaState["theme"]) => void;
  setLang: (l: KejaState["lang"]) => void;
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
      session: { phone: null, verified: false },
      activity: { leads: 0, reports: 0, ratings: 0, upvotes: {}, notifications: [], lastReadAt: 0, reportLog: [], viewingLog: [] },
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
      setFilters: (patch) => set({ filters: { ...get().filters, ...patch } }),
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
