"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import PetSprite from "@/components/pets/PetSprite";
import { effectiveMotion } from "@/components/pets/PetCompanion";
import SiteHeader from "@/components/shared/SiteHeader";
import { usePetState } from "@/hooks/usePets";
import { useNow, useTypingProgress } from "@/hooks/useTypingProgress";
import { PETS, RARITIES, type PetAnim, type PetDefinition } from "@/lib/pets/pet-catalog";
import { nextReward } from "@/lib/pets/pet-rewards";
import { patchPetSettings, selectPet, setPetEnabled, type PetSettings } from "@/lib/pets/pet-storage";
import { currentStreak, longestStreak, QUALIFYING_MIN_CORRECT } from "@/lib/progress/progress-analytics";

const PREVIEW_ANIMS: { anim: PetAnim; label: string }[] = [
  { anim: "walk", label: "Walk" }, { anim: "run", label: "Run" }, { anim: "jump", label: "Jump" }, { anim: "sit", label: "Sit" },
  { anim: "stretch", label: "Stretch" }, { anim: "happy", label: "Happy" }, { anim: "excited", label: "Excited" }, { anim: "sleep", label: "Sleep" }, { anim: "celebrate", label: "Celebrate" },
];

export default function PetCollection() {
  const { state, hydrated } = usePetState();
  const { store } = useTypingProgress();
  const now = useNow();
  const current = useMemo(() => currentStreak(store.sessions, now), [store.sessions, now]);
  const best = useMemo(() => longestStreak(store.sessions), [store.sessions]);
  const next = nextReward(state, best);
  const unlockedCount = Object.keys(state.unlocked).length;
  const systemReduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const motion = effectiveMotion(state.settings.animations, Boolean(systemReduced));

  return (
    <div className="min-h-screen bg-surface text-navy">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Rewards</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Pet collection</h1>
          <p className="mt-1 max-w-2xl text-mute">Practice a little each day to unlock companions. Unlocked pets are yours for good, even if a streak ends.</p>
        </div>

        {!hydrated ? (
          <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" aria-busy="true" />
        ) : (
          <div className="space-y-6">
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" aria-label="Streak and settings">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-extrabold">Your streak</h2>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Current" value={`${current}`} unit={current === 1 ? "day" : "days"} />
                  <Stat label="Best" value={`${best}`} unit={best === 1 ? "day" : "days"} />
                  <Stat label="Pets" value={`${unlockedCount}/${PETS.length}`} />
                </div>
                {next ? (
                  <div className="mt-4">
                    <p className="text-sm"><strong>Next: {next.pet.name}</strong> <span className="text-mute">at {next.pet.unlockStreak} days{next.daysToGo > 0 ? ` (${next.daysToGo} to go)` : ""}</span></p>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`Progress toward ${next.pet.name}`} aria-valuemin={0} aria-valuemax={next.pet.unlockStreak} aria-valuenow={Math.min(best, next.pet.unlockStreak)}>
                      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, (best / next.pet.unlockStreak) * 100)}%` }} />
                    </div>
                  </div>
                ) : <p className="mt-4 text-sm font-semibold text-brand">You have every pet. Amazing!</p>}
                <p className="mt-3 text-xs text-mute">A practice day is a day with at least one finished lesson, test or game with {QUALIFYING_MIN_CORRECT}+ correct characters. Just opening the site doesn&apos;t count.</p>
              </div>

              <Settings settings={state.settings} enabled={state.enabled} hasActive={Boolean(state.active)} />
            </section>

            <section aria-label="All pets" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PETS.map((pet) => (
                <PetCard
                  key={pet.id} pet={pet} unlocked={Boolean(state.unlocked[pet.id])} unlockedAt={state.unlocked[pet.id]?.at}
                  active={state.active === pet.id} companionOn={state.enabled} best={best} motion={motion}
                />
              ))}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-mute">{label}</p>
      <p className="mt-0.5 text-2xl font-extrabold tabular-nums">{value}{unit && <span className="ml-1 text-xs font-semibold text-mute">{unit}</span>}</p>
    </div>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="radiogroup" aria-label={label}>
        {options.map(([id, text]) => (
          <button key={id} type="button" role="radio" aria-checked={value === id} onClick={() => onChange(id)} className={`rounded-md px-3 py-1 text-xs font-semibold transition ${value === id ? "bg-navy text-white" : "text-mute hover:text-navy"}`}>{text}</button>
        ))}
      </div>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span><span className="text-sm font-semibold">{label}</span>{hint && <span className="block text-xs text-mute">{hint}</span>}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-9 cursor-pointer accent-[#2563eb]" />
    </label>
  );
}

function Settings({ settings, enabled, hasActive }: { settings: PetSettings; enabled: boolean; hasActive: boolean }) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold">Companion settings</h2>
      <Toggle label="Show my companion" hint={hasActive ? "A pet keeps you company while you learn." : "Unlock a pet to choose a companion."} checked={enabled && hasActive} onChange={(v) => hasActive && setPetEnabled(v)} />
      <Segmented<PetSettings["animations"]> label="Animations" value={settings.animations} onChange={(animations) => patchPetSettings({ animations })} options={[["full", "Full"], ["reduced", "Reduced"], ["off", "Off"]]} />
      <Toggle label="Follow and react to my cursor" checked={settings.cursor} onChange={(cursor) => patchPetSettings({ cursor })} />
      <Toggle label="Speech bubbles" checked={settings.speech} onChange={(speech) => patchPetSettings({ speech })} />
      <Segmented<PetSettings["whileTyping"]> label="While I'm typing" value={settings.whileTyping} onChange={(whileTyping) => patchPetSettings({ whileTyping })} options={[["quiet", "Stay calm"], ["stay", "Keep playing"], ["hide", "Hide"]]} />
      <Segmented<PetSettings["size"]> label="Size" value={settings.size} onChange={(size) => patchPetSettings({ size })} options={[["sm", "Small"], ["md", "Medium"], ["lg", "Large"]]} />
      <p className="text-xs text-mute">Pets also respect your device&apos;s &quot;reduce motion&quot; setting.</p>
    </div>
  );
}

type CardProps = { pet: PetDefinition; unlocked: boolean; unlockedAt?: string; active: boolean; companionOn: boolean; best: number; motion: ReturnType<typeof effectiveMotion> };

function PetCard({ pet, unlocked, unlockedAt, active, companionOn, best, motion }: CardProps) {
  const rarity = RARITIES[pet.rarity];
  const [anim, setAnim] = useState<PetAnim>("idle");
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const preview = (a: PetAnim) => {
    if (timer.current) window.clearTimeout(timer.current);
    setAnim(a);
    // Sleep and sit are poses; the rest are short actions.
    timer.current = window.setTimeout(() => setAnim("idle"), a === "sleep" || a === "sit" ? 4000 : 2800);
  };
  const choices = PREVIEW_ANIMS.filter((c) => pet.anims.includes(c.anim));
  const daysToGo = Math.max(0, pet.unlockStreak - best);

  return (
    <article className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm ${active ? "border-brand ring-2 ring-brand/30" : "border-slate-200"}`} aria-label={`${pet.name}, ${unlocked ? "unlocked" : "locked"}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: rarity.color }}>{rarity.label}</span>
        {active ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">✓ Active companion</span>
          : unlocked ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">Unlocked</span>
          : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">🔒 Locked</span>}
      </div>

      <div className="my-3 grid h-40 place-items-center rounded-xl bg-gradient-to-b from-sky-50 to-blue-50">
        <div style={{ ["--pet-size" as string]: "124px" }}><PetSprite def={pet} anim={unlocked ? anim : "idle"} motion={unlocked ? motion : "off"} silhouette={!unlocked} /></div>
      </div>

      <h3 className="text-lg font-extrabold">{pet.name}</h3>
      <p className="text-sm font-semibold text-brand">{unlocked ? pet.tagline : `Reach a ${pet.unlockStreak}-day streak`}</p>

      {unlocked ? (
        <>
          <p className="mt-2 text-sm text-slate-700">{pet.personality}</p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-mute">{pet.behaviors.map((b) => <li key={b}>{b}</li>)}</ul>
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={`Preview ${pet.name} animations`}>
            {choices.map((c) => (
              <button key={c.anim} type="button" onClick={() => preview(c.anim)} aria-pressed={anim === c.anim} className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${anim === c.anim ? "border-brand bg-brand text-white" : "border-slate-200 text-mute hover:border-brand hover:text-brand"}`}>{c.label}</button>
            ))}
          </div>
          <div className="mt-auto pt-4">
            {active ? <p className="text-xs text-mute">{companionOn ? "Playing on every page." : "Selected, but the companion is turned off."}</p>
              : <button type="button" onClick={() => selectPet(pet.id)} className="w-full rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:brightness-110">Choose {pet.name}</button>}
            {unlockedAt && <p className="mt-2 text-[11px] text-mute">Unlocked {new Date(unlockedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>}
          </div>
        </>
      ) : (
        <div className="mt-auto pt-4">
          <p className="text-xs text-mute">{rarity.label} reward · {daysToGo} more practice day{daysToGo === 1 ? "" : "s"} in a row (you&apos;ve reached {best}).</p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`Progress toward ${pet.unlockStreak}-day streak`} aria-valuemin={0} aria-valuemax={pet.unlockStreak} aria-valuenow={Math.min(best, pet.unlockStreak)}>
            <div className="h-full rounded-full bg-brand/70" style={{ width: `${Math.min(100, (best / pet.unlockStreak) * 100)}%` }} />
          </div>
        </div>
      )}
    </article>
  );
}
