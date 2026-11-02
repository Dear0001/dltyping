import type { Metadata } from "next";
import Landing from "@/components/shared/Landing";

export const metadata: Metadata = {
  title: "Keyflow — English & Khmer typing practice and games",
  description: "Free typing practice and games in English and Khmer. No sign-up needed.",
};

export default function Home() {
  return <Landing />;
}
