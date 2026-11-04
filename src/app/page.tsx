import type { Metadata } from "next";
import Landing from "@/components/shared/Landing";
import LandingContent from "@/components/shared/LandingContent";
import { LANDING_FAQ } from "@/data/landing-faq";

import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "DL Typing — English & Khmer typing practice and games",
  description: "Learn to type faster in English and Khmer with free typing lessons, games and live feedback. No sign-up needed.",
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
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: LANDING_FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Landing><LandingContent siteUrl={SITE_URL} /></Landing>
    </>
  );
}
