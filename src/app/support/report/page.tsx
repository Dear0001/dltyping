import type { Metadata } from "next";
import ReportPage from "@/components/support/ReportPage";

export const metadata: Metadata = {
  title: "Report a Problem — DL Typing",
  description: "Report a bug or broken page in DL Typing, with steps, the page link and an optional screenshot.",
};

export default function Page() {
  return <ReportPage />;
}
