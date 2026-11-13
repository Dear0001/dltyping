import type { Metadata } from "next";
import LegalPage from "@/components/shared/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — DL Typing",
  description: "The rules for using DL Typing: free educational use, optional accounts, fair use, content ownership and changes to the service.",
};

export default function TermsPage() {
  return <LegalPage doc="tos" />;
}
