import type { Metadata } from "next";
import SupportHub from "@/components/support/SupportHub";

export const metadata: Metadata = {
  title: "Support — DL Typing",
  description: "Contact DL Typing, send feedback or report a problem.",
};

export default function SupportPage() {
  return <SupportHub />;
}
