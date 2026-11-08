import type { Metadata } from "next";
import DailyChallenge from "@/components/test/DailyChallenge";

export const metadata: Metadata = {
  title: "Daily Typing Challenge — DL Typing",
  description: "A new English and Khmer typing challenge every day. Hit the goal to keep your daily streak going.",
};

export default function DailyChallengePage() {
  return <DailyChallenge />;
}
