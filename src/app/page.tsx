import type { Metadata } from "next";
import Landing from "@/components/shared/Landing";

import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "DL Typing — English & Khmer typing practice and games",
  description: "Free typing practice and games in English and Khmer. No sign-up needed.",
  alternates: { canonical: "/" },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DL Typing",
    alternateName: "dltyping",
    url: SITE_URL,
    inLanguage: ["en", "km"],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Landing />
    </>
  );
}
