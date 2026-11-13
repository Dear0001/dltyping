import type { Metadata } from "next";
import LegalPage from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — DL Typing",
  description: "What DL Typing stores in your browser and on its server, which cookies it uses, who it shares data with, and how to have your data deleted.",
};

export default function PrivacyPage() {
  return <LegalPage doc="pp" />;
}
