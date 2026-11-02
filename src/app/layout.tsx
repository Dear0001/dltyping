import type { Metadata } from "next";
import { LocaleProvider } from "@/components/shared/LocaleProvider";
import ProgressSync from "@/components/shared/ProgressSync";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keyflow — Find your typing rhythm",
  description: "Build your typing confidence with free English and Khmer practice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body suppressHydrationWarning><LocaleProvider>{children}<ProgressSync /></LocaleProvider></body>
    </html>
  );
}
