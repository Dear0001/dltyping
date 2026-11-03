import type { Metadata } from "next";
import { LocaleProvider } from "@/components/shared/LocaleProvider";
import SiteFooter from "@/components/shared/SiteFooter";
import ProgressSync from "@/components/shared/ProgressSync";
import { THEME_INIT_SCRIPT } from "@/lib/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "DL Typing — Find your typing rhythm",
  description: "Build your typing confidence with free English and Khmer practice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} /></head>
      <body id="top" suppressHydrationWarning><LocaleProvider>{children}<SiteFooter /><ProgressSync /></LocaleProvider></body>
    </html>
  );
}
