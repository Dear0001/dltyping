"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export function GameDialog({ title, subtitle, icon, children, onEscape, wide }: { title: string; subtitle?: string; icon?: string; children: React.ReactNode; onEscape?: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const escape = useRef(onEscape);
  useEffect(() => {
    escape.current = onEscape;
  });
  useEffect(() => {
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
  }, []);
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy/60 p-4 backdrop-blur-sm">
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="gm-dialog-title" className={`my-auto w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-3xl bg-white p-6 shadow-2xl sm:p-8`}>
      <div className="mb-5 text-center">
        {icon && <div className="mb-2 text-5xl" aria-hidden="true">{icon}</div>}
        <h2 id="gm-dialog-title" className="text-2xl font-extrabold text-navy">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
      </div>
      {children}
    </div>
  </div>;
}

export const primaryBtn = "inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
export const secondaryBtn = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-navy transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function GameStartDialog({ title, subtitle, icon, children, onStart, startLabel = "Start Game" }: { title: string; subtitle: string; icon: string; children: React.ReactNode; onStart: () => void; startLabel?: string }) {
  return <GameDialog title={title} subtitle={subtitle} icon={icon} wide>
    <div className="space-y-5">
      {children}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button data-autofocus type="button" className={`${primaryBtn} flex-1`} onClick={onStart}>{startLabel} →</button>
        <Link href="/games" className={`${secondaryBtn} flex-1`}>All games</Link>
      </div>
    </div>
  </GameDialog>;
}

export function GamePauseDialog({ onResume, onRestart }: { onResume: () => void; onRestart: () => void }) {
  return <GameDialog title="Paused" subtitle="Take a breath. Your progress is safe." icon="⏸️" onEscape={onResume}>
    <div className="flex flex-col gap-2">
      <button data-autofocus type="button" className={primaryBtn} onClick={onResume}>Resume</button>
      <button type="button" className={secondaryBtn} onClick={onRestart}>Restart</button>
      <Link href="/games" className={secondaryBtn}>Exit to games</Link>
    </div>
  </GameDialog>;
}

export function GameOverDialog({ title, subtitle, icon, children, onRetry, extra }: { title: string; subtitle: string; icon: string; children: React.ReactNode; onRetry: () => void; extra?: React.ReactNode }) {
  return <GameDialog title={title} subtitle={subtitle} icon={icon} wide>
    <div className="space-y-5">
      {children}
      <div className="flex flex-col gap-2 sm:flex-row">
        {extra}
        <button data-autofocus={extra ? undefined : true} type="button" className={`${extra ? secondaryBtn : primaryBtn} flex-1`} onClick={onRetry}>Retry ↻</button>
        <Link href="/games" className={`${secondaryBtn} flex-1`}>All games</Link>
      </div>
    </div>
  </GameDialog>;
}
