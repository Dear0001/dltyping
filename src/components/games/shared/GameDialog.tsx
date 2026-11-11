"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@/hooks/useTypingProgress";
import { useLocale } from "@/components/shared/LocaleProvider";

export function GameDialog({ title, subtitle, icon, logo, children, onEscape, wide }: { title: string; subtitle?: string; icon?: string; /** Show the DL Typing logo above the title instead of an emoji icon. */ logo?: boolean; children: React.ReactNode; onEscape?: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  // Rendered into <body> so it is always centred on the viewport, whatever element (e.g. the fixed navbar) opened it.
  const mounted = useHydrated();
  const escape = useRef(onEscape);
  useEffect(() => {
    escape.current = onEscape;
  });
  useEffect(() => {
    if (!mounted) return;
    ref.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && escape.current) {
        event.preventDefault();
        escape.current();
      }
      if (event.key === "Tab" && ref.current) {
        const items = Array.from(ref.current.querySelectorAll<HTMLElement>("button, a[href], summary, input, select"));
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted]);
  if (!mounted) return null;
  return createPortal(<div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-navy/60 p-4 backdrop-blur-sm">
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="gm-dialog-title" className={`my-auto w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-3xl bg-white p-6 shadow-2xl sm:p-8`}>
      <div className="mb-5 text-center">
        {logo && <Image src="/icon.svg" alt="" width={64} height={64} unoptimized priority className="mx-auto mb-3 h-16 w-16 rounded-2xl shadow-sm" />}
        {!logo && icon && <div className="mb-2 text-5xl" aria-hidden="true">{icon}</div>}
        <h2 id="gm-dialog-title" className="text-2xl font-extrabold text-navy">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
      </div>
      {children}
    </div>
  </div>, document.body);
}

export const primaryBtn = "inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
export const secondaryBtn = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-navy transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function GameStartDialog({ title, subtitle, icon, children, onStart, startLabel }: { title: string; subtitle: string; icon: string; children: React.ReactNode; onStart: () => void; startLabel?: string }) {
  const { t } = useLocale();
  return <GameDialog title={title} subtitle={subtitle} icon={icon} wide>
    <div className="space-y-5">
      {children}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button data-autofocus type="button" className={`${primaryBtn} flex-1`} onClick={onStart}>{startLabel ?? t("gm.startGame")} →</button>
        <Link href="/games" className={`${secondaryBtn} flex-1`}>{t("gm.allGames")}</Link>
      </div>
    </div>
  </GameDialog>;
}

export function GamePauseDialog({ onResume, onRestart }: { onResume: () => void; onRestart: () => void }) {
  const { t } = useLocale();
  return <GameDialog title={t("gm.paused")} subtitle={t("gm.pausedSub")} icon="⏸️" onEscape={onResume}>
    <div className="flex flex-col gap-2">
      <button data-autofocus type="button" className={primaryBtn} onClick={onResume}>{t("gm.resume")}</button>
      <button type="button" className={secondaryBtn} onClick={onRestart}>{t("gm.restart")}</button>
      <Link href="/games" className={secondaryBtn}>{t("gm.exitToGames")}</Link>
    </div>
  </GameDialog>;
}

export function GameOverDialog({ title, subtitle, icon, children, onRetry, extra }: { title: string; subtitle: string; icon: string; children: React.ReactNode; onRetry: () => void; extra?: React.ReactNode }) {
  const { t } = useLocale();
  return <GameDialog title={title} subtitle={subtitle} icon={icon} wide>
    <div className="space-y-5">
      {children}
      <div className="flex flex-col gap-2 sm:flex-row">
        {extra}
        <button data-autofocus={extra ? undefined : true} type="button" className={`${extra ? secondaryBtn : primaryBtn} flex-1`} onClick={onRetry}>{t("gm.retry")}</button>
        <Link href="/games" className={`${secondaryBtn} flex-1`}>{t("gm.allGames")}</Link>
      </div>
    </div>
  </GameDialog>;
}
