"use client";
// KEJA HALISI — SPA navigation + app state (single-route architecture)
// The sandbox preview exposes only "/", so every "page" is a client-side view.

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewName =
  | "home"
  | "estate"
  | "listing"
  | "agent"
  | "verify"
  | "post"
  | "dashboard"
  | "admin"
  | "payments"
  | "map";

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
  // demo session (OTP-verified user)
  session: { phone: string | null; verified: boolean };
  navigate: (view: ViewName, params?: ViewParams) => void;
  back: () => void;
  setFilters: (patch: Partial<KejaState["filters"]>) => void;
  resetFilters: () => void;
  toggleSaved: (id: string) => void;
  setSession: (s: Partial<KejaState["session"]>) => void;
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
      session: { phone: null, verified: false },
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
        set({ saved: saved.includes(id) ? saved.filter((s) => s !== id) : [...saved, id] });
      },
      setSession: (s) => set({ session: { ...get().session, ...s } }),
    }),
    {
      name: "keja-halisi-state",
      partialize: (s) => ({ filters: s.filters, saved: s.saved, session: s.session }),
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
