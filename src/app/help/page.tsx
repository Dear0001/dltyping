import type { Metadata } from "next";
import HelpContent from "@/components/shared/HelpContent";

export const metadata: Metadata = {
  title: "Help & Guides — DL Typing",
  description: "How to use DL Typing, keyboard layout tips for English QWERTY and Khmer NiDA, and clear answers to common questions about accounts, progress and practice.",
};

export default function HelpPage() {
  return <HelpContent />;
}
