import type { Metadata } from "next";
import TypingTest from "@/components/test/TypingTest";

export const metadata: Metadata = {
  title: "Typing Test — DL Typing",
  description: "Free English and Khmer typing speed test: 15, 30, 60 or 120 seconds of random words, with WPM, accuracy, consistency and personal bests.",
};

export default function TypingTestPage() {
  return <TypingTest />;
}
