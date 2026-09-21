"use client";
// KEJA HALISI — single-route SPA shell (sandbox preview exposes "/" only).
// Every "page" is a client-side view switched via the zustand router in src/lib/store.ts.
import { useEffect } from "react";
import { useKeja } from "@/lib/store";
import { TopBar, Header, Footer, BottomNav } from "@/components/keja/nav";
import { CompareBar } from "@/components/keja/compare-bar";
import HomeView from "@/components/keja/views/home";
import EstateView from "@/components/keja/views/estate";
import SavedView from "@/components/keja/views/saved";
import ListingView from "@/components/keja/views/listing";
import VerifyView from "@/components/keja/views/verify";
import PostView from "@/components/keja/views/post";
import AgentView from "@/components/keja/views/agent";
import DashboardView from "@/components/keja/views/dashboard";
import AdminView from "@/components/keja/views/admin";
import PaymentsView from "@/components/keja/views/payments";
import MapView from "@/components/keja/views/map";
import CompareView from "@/components/keja/views/compare";

function ActiveView() {
  const view = useKeja((s) => s.view);
  switch (view) {
    case "estate":
      return <EstateView />;
    case "saved":
      return <SavedView />;
    case "listing":
      return <ListingView />;
    case "agent":
      return <AgentView />;
    case "verify":
      return <VerifyView />;
    case "post":
      return <PostView />;
    case "dashboard":
      return <DashboardView />;
    case "admin":
      return <AdminView />;
    case "payments":
      return <PaymentsView />;
    case "map":
      return <MapView />;
    case "compare":
      return <CompareView />;
    case "home":
    default:
      return <HomeView />;
  }
}

export default function Page() {
  const view = useKeja((s) => s.view);
  const theme = useKeja((s) => s.theme);

  // apply persisted theme to <html> (dark mode token flips in globals.css)
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // keep document title in sync with the active view (SEO nicety inside SPA)
  useEffect(() => {
    const titles: Record<string, string> = {
      home: "Keja Halisi — Real House Verified | Nairobi Verified Rentals",
      estate: "Browse estates — Keja Halisi",
      saved: "Your shortlist — Keja Halisi",
      listing: "Listing — Keja Halisi",
      agent: "Agent profile — Keja Halisi",
      verify: "Verify agent — Keja Halisi",
      post: "Post a house — Keja Halisi",
      dashboard: "Dashboard — Keja Halisi",
      admin: "Admin console — Keja Halisi",
      payments: "Payments — Keja Halisi",
      map: "Nairobi map — Keja Halisi",
      compare: "Compare kejas — Keja Halisi",
    };
    document.title = titles[view] ?? titles.home;
  }, [view]);

  return (
    <div className="flex min-h-screen flex-col bg-kbg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[200] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-[12px] focus:font-extrabold focus:text-white"
      >
        Skip to content
      </a>
      <TopBar />
      <Header />
      <main id="main-content" className="flex-1 pb-16 md:pb-0">
        <div key={view} className="view-in">
          <ActiveView />
        </div>
      </main>
      <Footer />
      <CompareBar />
      <BottomNav />
    </div>
  );
}
