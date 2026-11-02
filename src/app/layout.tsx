import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keyflow — Find your typing rhythm",
  description: "Build your typing confidence with free English and Khmer practice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
