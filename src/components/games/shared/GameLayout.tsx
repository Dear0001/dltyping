"use client";

import Link from "next/link";
import SiteHeader from "@/components/shared/SiteHeader";
import { useSettings } from "@/hooks/use-stored-value";

/** Page chrome for every game: header, breadcrumb, title and sound/animation preferences. */
export default function GameLayout({ title, tagline, children }: { title: string; tagline: string; children: React.ReactNode }) {
  const [settings, update] = useSettings();
  const toggle = "rounded-full border px-3 py-1.5 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-brand";
  return <div className="gm-page min-h-screen bg-surface text-navy" data-reduce-motion={settings.animations ? "false" : "true"}>
    <SiteHeader />
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <nav aria-label="Breadcrumb" className="mb-1 text-xs font-semibold text-mute"><Link className="hover:text-brand" href="/games">Games</Link> <span aria-hidden="true">/</span> {title}</nav>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-1 text-sm text-mute">{tagline}</p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Game preferences">
          <button type="button" aria-pressed={settings.sound} onClick={() => update({ sound: !settings.sound })} className={`${toggle} ${settings.sound ? "border-brand bg-blue-50 text-brand" : "border-slate-300 bg-white text-mute"}`}>{settings.sound ? "🔊 Sound on" : "🔇 Sound off"}</button>
          <button type="button" aria-pressed={settings.animations} onClick={() => update({ animations: !settings.animations })} className={`${toggle} ${settings.animations ? "border-brand bg-blue-50 text-brand" : "border-slate-300 bg-white text-mute"}`}>{settings.animations ? "✨ Animations on" : "⏹ Animations off"}</button>
        </div>
      </div>
      {children}
    </main>
  </div>;
}
