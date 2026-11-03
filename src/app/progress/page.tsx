import type { Metadata } from "next";
import ProgressDashboard from "@/components/progress/ProgressDashboard";

export const metadata: Metadata = {
  title: "Progress — Keyflow",
  description: "Track your typing progress, XP, achievements and lesson completions.",
};

export default function ProgressPage() {
  return <ProgressDashboard />;
}
