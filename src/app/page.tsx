"use client";
// KEJA HALISI — single-route SPA shell (sandbox preview exposes "/" only).
// Every "page" is a client-side view switched via the zustand router in src/lib/store.ts.
import { useEffect } from "react";
import { useKeja } from "@/lib/store";
import { TopBar, Header, Footer, BottomNav } from "@/components/keja/nav";
import HomeView from "@/components/keja/views/home";
import EstateView from "@/components/keja/views/estate";
import ListingView from "@/components/keja/views/listing";
import VerifyView from "@/components/keja/views/verify";
import PostView from "@/components/keja/views/post";
import AgentView from "@/components/keja/views/agent";
import DashboardView from "@/components/keja/views/dashboard";
import AdminView from "@/components/keja/views/admin";
import PaymentsView from "@/components/keja/views/payments";
import MapView from "@/components/keja/views/map";

function ActiveView() {
  const view = useKeja((s) => s.view);
  switch (view) {
    case "estate":
      return <EstateView />;
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
    case "home":
    default:
      return <HomeView />;
  }
}

export default function Page() {
  const view = useKeja((s) => s.view);

  // keep document title in sync with the active view (SEO nicety inside SPA)
  useEffect(() => {
    const titles: Record<string, string> = {
      home: "Keja Halisi — Real House Verified | Nairobi Verified Rentals",
      estate: "Browse estates — Keja Halisi",
      listing: "Listing — Keja Halisi",
      agent: "Agent profile — Keja Halisi",
      verify: "Verify agent — Keja Halisi",
      post: "Post a house — Keja Halisi",
      dashboard: "Dashboard — Keja Halisi",
      admin: "Admin console — Keja Halisi",
      payments: "Payments — Keja Halisi",
      map: "Nairobi map — Keja Halisi",
    };
    document.title = titles[view] ?? titles.home;
  }, [view]);

  return (
    <div className="flex min-h-screen flex-col bg-kbg">
      <TopBar />
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <ActiveView />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
