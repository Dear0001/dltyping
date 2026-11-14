import type { Metadata } from "next";

import SetupForm from "@/components/setup/SetupForm";
import { SetupHeading } from "@/components/setup/SetupHeader";

export const metadata: Metadata = {
  title: "Setup — DL Typing",
  description: "Choose your language and keyboard layout for DL Typing.",
  robots: { index: false, follow: true },
};

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-surface text-navy">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <SetupHeading />
        <SetupForm />
      </div>
    </main>
  );
}
