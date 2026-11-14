"use client";

import { useLocale } from "@/components/shared/LocaleProvider";
import { PageHeader } from "@/components/ui/ui";

export function SetupHeading() {
  const { t } = useLocale();
  return <PageHeader kicker={t("setup.kicker")} title={t("setup.title")} subtitle={t("setup.intro")} />;
}
