"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useLocale } from "@/components/shared/LocaleProvider";

const TABS = [
  { href: "/dashboard", key: "dash.tabOverview" },
  { href: "/dashboard/keyboard-mastery", key: "dash.tabMastery" },
  { href: "/dashboard/training", key: "dash.tabTraining" },
];

/** Shared frame for the three dashboard pages: site header, title and section tabs. */
export default function DashboardShell({ title, subtitle, actions, children }: { title: string; subtitle: string; actions?: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useLocale();
  return (
    <div className="min-h-screen bg-surface text-navy">
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand">{t("dash.kicker")}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-mute">{subtitle}</p>
          </div>
          {actions}
        </div>
        <nav aria-label={t("dash.tabsLabel")} className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href} href={tab.href} aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${active ? "bg-brand text-white shadow-sm" : "text-mute hover:bg-slate-50 hover:text-navy"}`}
              >{t(tab.key)}</Link>
            );
          })}
        </nav>
        {children}
      </main>
    </div>
  );
}
