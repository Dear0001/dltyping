import type { Metadata } from "next";
import { Suspense } from "react";
import { LocaleProvider } from "@/components/shared/LocaleProvider";
import SiteFooter from "@/components/shared/SiteFooter";
import ProgressSync from "@/components/shared/ProgressSync";
import PetCompanion from "@/components/pets/PetCompanion";
import PetRewards from "@/components/pets/PetRewards";
import { THEME_INIT_SCRIPT } from "@/lib/themes";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "DL Typing — Free English & Khmer typing practice",
  description: "Build your typing confidence with free English and Khmer typing practice, lessons, and games.",
  openGraph: {
    title: "DL Typing — Free English & Khmer typing practice",
    description: "Free typing lessons, games, and practice in English and Khmer.",
    siteName: "DL Typing",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} /></head>
      <body id="top" suppressHydrationWarning><LocaleProvider>{children}<SiteFooter /><ProgressSync /><Suspense fallback={null}><PetCompanion /></Suspense><PetRewards /></LocaleProvider></body>
    </html>
  );
}
