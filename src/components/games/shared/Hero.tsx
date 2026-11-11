// Original characters drawn as inline SVG (no third-party artwork).
"use client";

import { useLocale } from "@/components/shared/LocaleProvider";

export type HeroVariant = "blob" | "explorer";

export default function Hero({ variant, className = "" }: { variant: HeroVariant; className?: string }) {
  const { t } = useLocale();
  if (variant === "blob") {
    return <svg viewBox="0 0 56 64" className={className} role="img" aria-label={t("gm.heroBlob")}>
      <ellipse cx="28" cy="61" rx="16" ry="3" fill="#0F172A" opacity=".18" />
      <line x1="28" y1="8" x2="28" y2="1" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="28" cy="3" r="3.4" fill="#38BDF8" />
      <path d="M6 40c0-17 9-30 22-30s22 13 22 30c0 10-6 19-22 19S6 50 6 40z" fill="#2563EB" />
      <path d="M12 30c3-9 9-14 16-14" stroke="#93C5FD" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".7" />
      <circle cx="20" cy="36" r="7" fill="#fff" /><circle cx="36" cy="36" r="7" fill="#fff" />
      <circle cx="21.5" cy="37" r="3.4" fill="#0F172A" /><circle cx="37.5" cy="37" r="3.4" fill="#0F172A" />
      <path d="M22 49c3 3 9 3 12 0" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <ellipse cx="17" cy="59" rx="6" ry="3" fill="#1E3A8A" /><ellipse cx="39" cy="59" rx="6" ry="3" fill="#1E3A8A" />
    </svg>;
  }
  return <svg viewBox="0 0 56 64" className={className} role="img" aria-label={t("gm.heroExplorer")}>
    <ellipse cx="28" cy="62" rx="15" ry="2.6" fill="#0F172A" opacity=".2" />
    <rect x="9" y="30" width="13" height="22" rx="5" fill="#B45309" />
    <rect x="16" y="28" width="26" height="26" rx="8" fill="#0D9488" />
    <path d="M16 36l26 0v6H16z" fill="#14B8A6" opacity=".6" />
    <rect x="19" y="53" width="7" height="8" rx="3" fill="#7C2D12" /><rect x="31" y="53" width="7" height="8" rx="3" fill="#7C2D12" />
    <circle cx="29" cy="20" r="11" fill="#F5C99B" />
    <path d="M15 28c5 5 21 5 26 0l-2 7c-6 3-16 3-22 0z" fill="#DC2626" />
    <path d="M18 30l4 2M25 32l4 1M33 32l4 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M13 15c2-9 9-12 16-12s14 3 16 12c-8-3-24-3-32 0z" fill="#F59E0B" />
    <rect x="11" y="13" width="36" height="4" rx="2" fill="#D97706" />
    <circle cx="25" cy="21" r="1.7" fill="#0F172A" /><circle cx="34" cy="21" r="1.7" fill="#0F172A" />
    <path d="M26 25c2 2 5 2 7 0" stroke="#7C2D12" strokeWidth="1.6" strokeLinecap="round" fill="none" />
  </svg>;
}
