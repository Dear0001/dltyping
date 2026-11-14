"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDay } from "@/lib/i18n/dates";
import PetSprite from "@/components/pets/PetSprite";
import { effectiveMotion } from "@/components/pets/PetCompanion";
import { SkCard, SkGrid } from "@/components/skeleton/Skeleton";
import { stopPetSounds } from "@/lib/pets/pet-sound";
import { usePetState } from "@/hooks/usePets";
import { useNow, useTypingProgress } from "@/hooks/useTypingProgress";
import { PETS, RARITIES, type PetAnim, type PetDefinition } from "@/lib/pets/pet-catalog";
import { useAccount } from "@/lib/account";
import { emitPetEvent } from "@/lib/pets/pet-events";
import { nextReward } from "@/lib/pets/pet-rewards";
import { activeIds, MAX_ACTIVE_PETS, patchPetSettings, setPetEnabled, togglePet, type PetSettings } from "@/lib/pets/pet-storage";
import { useLocale } from "@/components/shared/LocaleProvider";
import { usePetText } from "@/hooks/usePetText";
import { currentStreak, longestStreak, QUALIFYING_MIN_CORRECT } from "@/lib/progress/progress-analytics";

const PREVIEW_ANIMS: PetAnim[] = ["walk", "run", "jump", "sit", "stretch", "happy", "excited", "sleep", "celebrate", "stalk", "crouch", "pounce"];

export default function PetCollection() {
  const { t } = useLocale();
  const pt = usePetText();
  const { state, hydrated } = usePetState();
  const { store } = useTypingProgress();
  const now = useNow();
  const signedIn = useAccount().status === "user";
  // Streaks (and the pets they unlock) need an account; signed out, they read as zero.
  const current = useMemo(() => (signedIn ? currentStreak(store.sessions, now) : 0), [signedIn, store.sessions, now]);
  const best = useMemo(() => (signedIn ? longestStreak(store.sessions) : 0), [signedIn, store.sessions]);
  const next = nextReward(state, best);
  const unlockedCount = Object.keys(state.unlocked).length;
  const team = activeIds(state);
  const systemReduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const motion = effectiveMotion(state.settings.animations, Boolean(systemReduced));

  return (
    <div className="min-h-screen bg-surface text-navy">
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-brand">{t("pets.kicker")}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{t("pets.title")}</h1>
          <p className="mt-1 max-w-2xl text-mute">{t("pets.subtitle")}</p>
        </div>

        {!hydrated ? (
          <div className="space-y-6" aria-busy="true" aria-label={t("pets.loading")}><div className="grid gap-4 lg:grid-cols-2"><SkCard lines={3} media="h-16" /><SkCard lines={3} media="h-16" /></div><SkGrid count={8} cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" lines={1} media="h-28" /></div>
        ) : (
          <div className="space-y-6">
            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" aria-label={t("pets.streakSettings")}>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-extrabold">{t("pets.yourStreak")}</h2>
                {!signedIn && <p role="status" className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">{t("pets.signIn")}</p>}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Stat label={t("pets.current")} value={`${current}`} unit={t(current === 1 ? "pets.day" : "pets.days")} />
                  <Stat label={t("pets.best")} value={`${best}`} unit={t(best === 1 ? "pets.day" : "pets.days")} />
                  <Stat label={t("pets.pets")} value={`${unlockedCount}/${PETS.length}`} />
                </div>
                {next ? (
                  <div className="mt-4">
                    <p className="text-sm"><strong>{t("pets.nextPet", { name: pt.name(next.pet) })}</strong> <span className="text-mute">{t("pets.atDays", { n: next.pet.unlockStreak })}{next.daysToGo > 0 ? t("pets.toGo", { n: next.daysToGo }) : ""}</span></p>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={t("pets.progressToward", { name: pt.name(next.pet) })} aria-valuemin={0} aria-valuemax={next.pet.unlockStreak} aria-valuenow={Math.min(best, next.pet.unlockStreak)}>
                      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, (best / next.pet.unlockStreak) * 100)}%` }} />
                    </div>
                  </div>
                ) : <p className="mt-4 text-sm font-semibold text-brand">{t("pets.haveAll")}</p>}
                <p className="mt-3 text-xs text-mute">{t("pets.howStreak", { n: QUALIFYING_MIN_CORRECT })}</p>
              </div>

              <Settings settings={state.settings} enabled={state.enabled} hasActive={Boolean(state.active)} />
            </section>

            {unlockedCount > 0 && <p className="text-sm text-mute" role="status">{t("pets.activePets")}<strong className="text-navy">{team.length}/{MAX_ACTIVE_PETS}</strong>{t("pets.activeHelp", { max: MAX_ACTIVE_PETS })}</p>}

            <section aria-label={t("pets.allPets")} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PETS.map((pet) => (
                <PetCard
                  key={pet.id} pet={pet} unlocked={Boolean(state.unlocked[pet.id])} unlockedAt={state.unlocked[pet.id]?.at}
                  active={team.includes(pet.id)} teamSize={team.length} companionOn={state.enabled} best={best} motion={motion}
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
  const { t } = useLocale();
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-extrabold">{t("pets.settings")}</h2>
      <Toggle label={t("pets.showPets")} hint={t(hasActive ? "pets.showHint" : "pets.showHintNone")} checked={enabled && hasActive} onChange={(v) => hasActive && setPetEnabled(v)} />
      <Segmented<PetSettings["animations"]> label={t("pets.animations")} value={settings.animations} onChange={(animations) => patchPetSettings({ animations })} options={[["full", t("pets.animFull")], ["reduced", t("pets.animReduced")], ["off", t("pets.animOff")]]} />
      <Toggle label={t("pets.cursor")} checked={settings.cursor} onChange={(cursor) => patchPetSettings({ cursor })} />
      <Toggle label={t("pets.sounds")} hint={t("pets.soundsHint")} checked={settings.sound} onChange={(sound) => { patchPetSettings({ sound }); if (!sound) stopPetSounds(); }} />
      <Toggle label={t("pets.speech")} checked={settings.speech} onChange={(speech) => patchPetSettings({ speech })} />
      <Segmented<PetSettings["whileTyping"]> label={t("pets.whileTyping")} value={settings.whileTyping} onChange={(whileTyping) => patchPetSettings({ whileTyping })} options={[["quiet", t("pets.quiet")], ["stay", t("pets.stay")], ["hide", t("pets.hide")]]} />
      <Segmented<PetSettings["size"]> label={t("pets.size")} value={settings.size} onChange={(size) => patchPetSettings({ size })} options={[["sm", t("pets.sm")], ["md", t("pets.md")], ["lg", t("pets.lg")]]} />
      <p className="text-xs text-mute">{t("pets.reduceMotion")}</p>
    </div>
  );
}

type CardProps = { pet: PetDefinition; unlocked: boolean; unlockedAt?: string; active: boolean; /** How many pets are active now. */ teamSize: number; companionOn: boolean; best: number; motion: ReturnType<typeof effectiveMotion> };

function PetCard({ pet, unlocked, unlockedAt, active, teamSize, companionOn, best, motion }: CardProps) {
  const { t, locale } = useLocale();
  const pt = usePetText();
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
  const choices = PREVIEW_ANIMS.filter((c) => pet.anims.includes(c));
  const daysToGo = Math.max(0, pet.unlockStreak - best);

  return (
    <article className={`flex flex-col rounded-2xl border bg-white p-4 shadow-sm ${active ? "border-brand ring-2 ring-brand/30" : "border-slate-200"}`} aria-label={t("pets.cardAria", { name: pt.name(pet), state: t(unlocked ? "pets.stateUnlocked" : "pets.stateLocked") })}>
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: rarity.color }}>{pt.rarity(pet.rarity)}</span>
        {active ? <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">{t("pets.tagActive")}</span>
          : unlocked ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">{t("pets.tagUnlocked")}</span>
          : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">{t("pets.tagLocked")}</span>}
      </div>

      <div className="my-3 grid h-40 place-items-center rounded-xl bg-gradient-to-b from-sky-50 to-blue-50">
        <div style={{ ["--pet-size" as string]: "124px" }}><PetSprite def={pet} anim={unlocked ? anim : "idle"} motion={unlocked ? motion : "off"} silhouette={!unlocked} /></div>
      </div>

      <h3 className="text-lg font-extrabold">{pt.name(pet)}</h3>
      <p className="text-sm font-semibold text-brand">{unlocked ? pt.tagline(pet) : t("pets.reachStreak", { n: pet.unlockStreak })}</p>

      {unlocked ? (
        <>
          <p className="mt-2 text-sm text-slate-700">{pt.personality(pet)}</p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs text-mute">{pet.behaviors.map((b) => <li key={b}>{pt.behavior(b)}</li>)}</ul>
          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label={t("pets.previewAria", { name: pt.name(pet) })}>
            {choices.map((c) => (
              <button key={c} type="button" onClick={() => preview(c)} aria-pressed={anim === c} className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${anim === c ? "border-brand bg-brand text-white" : "border-slate-200 text-mute hover:border-brand hover:text-brand"}`}>{t(`pets.anim.${c}`)}</button>
            ))}
          </div>
          <div className="mt-auto pt-4">
            {active ? (
              <>
                <p className="mb-2 text-xs text-mute">{t(companionOn ? "pets.playingEverywhere" : "pets.selectedOff")}</p>
                {pet.keyCast ? <KeyCastGuide pet={pet} /> : pet.ultimate && <button type="button" onClick={() => emitPetEvent({ type: "ultimate", pet: pet.id })} disabled={!companionOn || motion !== "full"} title={motion !== "full" ? t("pets.needFull") : undefined} className="mb-2 w-full rounded-xl bg-navy px-4 py-2 text-sm font-bold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">{t("pets.cast", { name: pt.skill(pet.ultimate.name) })}</button>}
                {!pet.keyCast && pet.abilities && <div className="mb-2 grid grid-cols-2 gap-1.5">{pet.abilities.map((ab) => <button key={ab.id} type="button" onClick={() => emitPetEvent({ type: "ability", pet: pet.id, id: ab.id })} disabled={!companionOn || motion !== "full"} title={pt.blurb(ab.blurb)} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-navy hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50">✨ {pt.skill(ab.name)}</button>)}</div>}
                <button type="button" onClick={() => togglePet(pet.id)} disabled={teamSize <= 1} title={teamSize <= 1 ? t("pets.keepOne") : undefined} className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-navy hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50">{t("pets.remove")}</button>
              </>
            ) : (
              <button type="button" onClick={() => togglePet(pet.id)} disabled={teamSize >= MAX_ACTIVE_PETS} className="w-full rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">{teamSize >= MAX_ACTIVE_PETS ? t("pets.teamFull", { a: MAX_ACTIVE_PETS, b: MAX_ACTIVE_PETS }) : teamSize === 0 ? t("pets.choose", { name: pt.name(pet) }) : t("pets.add", { name: pt.name(pet) })}</button>
            )}
            {unlockedAt && <p className="mt-2 text-[11px] text-mute">{t("pets.unlockedOn", { date: formatDay(new Date(unlockedAt), locale, true) })}</p>}
          </div>
        </>
      ) : (
        <div className="mt-auto pt-4">
          <p className="text-xs text-mute">{t("pets.rewardLine", { rarity: pt.rarity(pet.rarity), n: daysToGo, best })}</p>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={t("pets.progressDays", { n: pet.unlockStreak })} aria-valuemin={0} aria-valuemax={pet.unlockStreak} aria-valuenow={Math.min(best, pet.unlockStreak)}>
            <div className="h-full rounded-full bg-brand/70" style={{ width: `${Math.min(100, (best / pet.unlockStreak) * 100)}%` }} />
          </div>
        </div>
      )}
    </article>
  );
}

/** For key-to-cast pets: no buttons, so the card only explains which key casts what. */
function KeyCastGuide({ pet }: { pet: PetDefinition }) {
  const { t } = useLocale();
  const pt = usePetText();
  const name = (id: string) => pt.skill((id === "ultimate" ? pet.ultimate?.name : pet.abilities?.find((a) => a.id === id)?.name) ?? id);
  return (
    <div className="mb-2 rounded-xl bg-slate-50 p-3 text-xs text-mute">
      <p className="mb-1.5 font-bold text-navy">{t("pets.pressKey")}</p>
      <ul className="space-y-0.5">{Object.entries(pet.keyCast ?? {}).map(([key, id]) => <li key={key}><kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 font-bold text-navy">{key.toUpperCase()}</kbd> {name(id)}</li>)}</ul>
      <p className="mt-1.5">{t("pets.noCastTyping")}</p>
    </div>
  );
}
