"use client";

import { useLocale } from "@/components/shared/LocaleProvider";

export default function UnknownKeyboardLayout() {
  const { t } = useLocale();
  return <div className="rounded-2xl border border-dashed border-[#d8dce3] bg-[#eff6ff] p-5 text-center text-sm text-[#787d85]">{t("keyboard.unknown")}</div>;
}
