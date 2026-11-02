"use client";

import { useLocale } from "@/components/shared/LocaleProvider";

export default function LocaleToggle() {
  const { locale, setLocale, t } = useLocale();
  return (
    <div className="locale-toggle" role="group" aria-label={t("common.interfaceLanguage")}>
      <button type="button" onClick={() => setLocale("en")} aria-pressed={locale === "en"} className={locale === "en" ? "active" : ""}>EN</button>
      <button type="button" onClick={() => setLocale("km")} aria-pressed={locale === "km"} className={locale === "km" ? "active" : ""}>ខ្មែរ</button>
    </div>
  );
}
