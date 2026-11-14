import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Suspense } from "react";
import { LocaleProvider } from "@/components/shared/LocaleProvider";
import SiteHeader from "@/components/shared/SiteHeader";
import SiteFooter from "@/components/shared/SiteFooter";
import ProgressSync from "@/components/shared/ProgressSync";
import PetCompanion from "@/components/pets/PetCompanion";
import PetRewards from "@/components/pets/PetRewards";
import StreakCelebration from "@/components/shared/StreakCelebration";
import LocalizedTitle from "@/components/shared/LocalizedTitle";
import { THEME_LABEL_CSS } from "@/lib/themes";
import { NAV_ACTIVE_SCRIPT, PREPAINT_SCRIPT } from "@/lib/prepaint";
import GoogleAnalytics from "@/components/shared/GoogleAnalytics";
import { SITE_URL } from "@/lib/site";
import "./globals.css";
import "./design-system.css";

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
      <head><script dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }} /><style dangerouslySetInnerHTML={{ __html: THEME_LABEL_CSS }} /></head>
      <body id="top" suppressHydrationWarning><LocaleProvider><SiteHeader /><script dangerouslySetInnerHTML={{ __html: NAV_ACTIVE_SCRIPT }} />{children}<SiteFooter /><ProgressSync /><Suspense fallback={null}><PetCompanion /></Suspense><PetRewards /><StreakCelebration /><Suspense fallback={null}><LocalizedTitle /></Suspense></LocaleProvider><GoogleAnalytics /></body>
    </html>
  );
}
