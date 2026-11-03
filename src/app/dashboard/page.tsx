import type { Metadata } from "next";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export const metadata: Metadata = {
  title: "Typing Dashboard — DL Typing",
  description: "Your typing sessions, speed, accuracy, streak and activity history, saved on this device.",
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
