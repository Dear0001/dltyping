import type { Metadata } from "next";
import FeedbackPage from "@/components/support/FeedbackPage";

export const metadata: Metadata = {
  title: "Feedback — DL Typing",
  description: "Share ideas and rate DL Typing to help improve lessons, games and features.",
};

export default function Page() {
  return <FeedbackPage />;
}
