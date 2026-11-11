import Link from "next/link";
import { useLocale } from "@/components/shared/LocaleProvider";
import type { Recommendation } from "@/lib/progress/training-recommendations";

const PRIORITY = {
  high: { label: "rec.high", cls: "bg-red-100 text-red-800" },
  medium: { label: "rec.medium", cls: "bg-blue-100 text-blue-800" },
  low: { label: "rec.low", cls: "bg-slate-100 text-slate-700" },
} as const;

const ICON: Record<Recommendation["category"], string> = {
  "weak-keys": "🎯", "home-row": "🏠", combinations: "🔗", words: "📝", speed: "⚡", accuracy: "🧘", consistency: "〰️",
};

export default function TrainingRecommendations({ items }: { items: Recommendation[] }) {
  const { t } = useLocale();
  return (
    <ul className="space-y-3">
      {items.map((r) => (
        <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start gap-4">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-blue-50 text-xl" aria-hidden="true">{ICON[r.category]}</span>
            <div className="min-w-0 flex-1 basis-64">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-extrabold text-navy">{r.title}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${PRIORITY[r.priority].cls}`}>{t(PRIORITY[r.priority].label)}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{t(`category.${r.language}`)} · ~{r.minutes} {t("dash.min")}</span>
              </div>
              <p className="mt-1 text-sm text-mute"><span className="font-semibold text-navy">{t("rec.why")}</span>{r.reason}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.actions.map((a) => (
                <Link
                  key={a.href} href={a.href}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${a.kind === "practice" ? "bg-brand text-white shadow-sm hover:brightness-110" : "border border-slate-200 bg-white text-navy hover:border-brand hover:text-brand"}`}
                >{a.kind === "game" ? "🎮 " : ""}{a.label}</Link>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
