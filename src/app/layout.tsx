import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import { LocaleProvider } from "@/components/shared/LocaleProvider";
import SiteHeader from "@/components/shared/SiteHeader";
import { SiteHeaderSkeleton } from "@/components/skeleton/Skeleton";
import SiteFooter from "@/components/shared/SiteFooter";
import ProgressSync from "@/components/shared/ProgressSync";
import PetCompanion from "@/components/pets/PetCompanion";
import PetRewards from "@/components/pets/PetRewards";
import StreakCelebration from "@/components/shared/StreakCelebration";
import { THEME_INIT_SCRIPT } from "@/lib/themes";
import GoogleAnalytics from "@/components/shared/GoogleAnalytics";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

/** The app font. Poppins has no Khmer letters, so Khmer text falls back to the Khmer fonts listed in --font-body (globals.css). */
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], display: "swap", variable: "--font-poppins" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "DL Typing — Free English & Khmer typing practice",
  description: "Build your typing confidence with free English and Khmer typing practice. Follow structured lessons, play typing games and track your speed and accuracy.",
  openGraph: {
    title: "DL Typing — Free English & Khmer typing practice",
    description: "Free typing lessons, games, and practice in English and Khmer.",
    siteName: "DL Typing",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "DL Typing — Free English & Khmer typing practice", description: "Free typing lessons, games, and practice in English and Khmer." },
  // Search Console "HTML tag" verification: set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION to the content value Google gives you.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : undefined,
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={poppins.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} /></head>
      <body id="top" suppressHydrationWarning><LocaleProvider><Suspense fallback={<SiteHeaderSkeleton />}><SiteHeader /></Suspense>{children}<SiteFooter /><ProgressSync /><Suspense fallback={null}><PetCompanion /></Suspense><PetRewards /><StreakCelebration /></LocaleProvider><GoogleAnalytics /></body>
    </html>
  );
}
