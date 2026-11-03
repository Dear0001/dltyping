import type { Metadata } from "next";
import KeyboardMasteryView from "@/components/dashboard/KeyboardMasteryView";

export const metadata: Metadata = {
  title: "Keyboard Mastery — DL Typing",
  description: "A heatmap of your accuracy on every key for English QWERTY and Khmer NiDA, on Mac and Windows boards.",
};

export default function KeyboardMasteryPage() {
  return <KeyboardMasteryView />;
}
