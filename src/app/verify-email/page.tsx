import type { Metadata } from "next";
import VerifyEmail from "@/components/shared/VerifyEmail";

export const metadata: Metadata = { title: "Verify your email — DL Typing", robots: { index: false, follow: false } };

export default function VerifyEmailPage() {
  return <VerifyEmail />;
}
