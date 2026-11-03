import type { Metadata } from "next";
import ProgressDashboard from "@/components/progress/ProgressDashboard";

export const metadata: Metadata = {
  title: "Progress — DL Typing",
  description: "Track your typing progress, XP, achievements and lesson completions.",
};

export default function ProgressPage() {
  return <ProgressDashboard />;
}
