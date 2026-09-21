import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/keja/toaster";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Keja Halisi — Real House Verified | Nairobi Verified Rentals",
  description:
    "Stop scrolling fake kejas. Only verified TikTok houses in Nairobi. No viewing fee before viewing — Hakuna Kulipa Kabla Ya Kuona Nyumba. Verified agents, evidence video, phone masked until contact.",
  keywords: [
    "Nairobi rentals", "keja", "verified houses", "TikTok rentals Kenya",
    "Kileleshwa", "Kasarani", "no viewing fee", "Hakuna Kulipa Kabla Ya Kuona Nyumba",
  ],
  icons: { icon: "/logo/icon.svg", apple: "/logo/icon.svg" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Keja Halisi — Real House Verified",
    description: "Verified TikTok rentals across Nairobi's 6 boroughs. No viewing fee before viewing.",
    siteName: "keja-halisi.co.ke",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1976D2" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sora.variable} ${inter.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
