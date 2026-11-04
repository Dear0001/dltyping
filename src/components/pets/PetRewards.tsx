"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAccount } from "@/lib/account";
import PetSprite from "@/components/pets/PetSprite";
import { usePetState } from "@/hooks/usePets";
import { useTypingProgress } from "@/hooks/useTypingProgress";
import { getPet, RARITIES } from "@/lib/pets/pet-catalog";
import { emitPetEvent } from "@/lib/pets/pet-events";
import { evaluateRewards } from "@/lib/pets/pet-rewards";
import { activatePet, activeIds, dismissPending, grantAllPets, readPetState, revokeAccountGrants, writePetState } from "@/lib/pets/pet-storage";

// Fixed burst directions, so rendering stays pure.
const CONFETTI = ["🎉", "⭐", "✨", "💙", "🎊", "🌟", "💫", "🎈"].map((symbol, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return { symbol, cx: `${Math.round(Math.cos(angle) * 90)}px`, cy: `${Math.round(Math.sin(angle) * 55 - 40)}px`, cr: `${(i % 2 ? 1 : -1) * 140}deg`, delay: `${i * 0.05}s` };
});

/**
 * Grants pets from real saved sessions (only while signed in) and announces them. It runs when saved sessions change,
 * never on page load alone: opening or refreshing the site cannot create a reward, and a pet
 * that was already granted is never granted again.
 */
export default function PetRewards() {
  const { store, hydrated } = useTypingProgress();
  const { state } = usePetState();
  const account = useAccount();

  // Accounts with the all-pets perk (decided by the server) get every pet; signing out takes the grant away again.
  const allPets = account.status === "user" && account.perks?.allPets === true;
  useEffect(() => {
    if (!hydrated) return;
    if (allPets) grantAllPets();
    else if (account.status === "anon") revokeAccountGrants();
  }, [allPets, account.status, hydrated]);

  useEffect(() => {
    if (!hydrated || account.status !== "user") return; // streak rewards need an account
    const result = evaluateRewards(readPetState(), store.sessions, new Date());
    if (!result.unlocked.length) return;
    writePetState(result.state, "keep");
    emitPetEvent({ type: "unlock" });
  }, [store.sessions, hydrated, account.status]);

  const pet = getPet(state.pending[0]);
  if (!hydrated || !pet) return null;
  const rarity = RARITIES[pet.rarity];
  const isActive = activeIds(state).includes(pet.id);

  return (
    <div className="pet-toast" role="status" aria-live="polite">
      <div className="pet-toast-art">
        <div className="pet-confetti" aria-hidden="true">
          {CONFETTI.map((c) => <span key={c.symbol} style={{ "--cx": c.cx, "--cy": c.cy, "--cr": c.cr, animationDelay: c.delay } as React.CSSProperties}>{c.symbol}</span>)}
        </div>
        <PetSprite def={pet} anim="celebrate" />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest" style={{ color: rarity.color }}>New pet unlocked · {rarity.label}</p>
      <h2 className="mt-0.5 text-xl font-extrabold">{pet.name}</h2>
      <p className="mt-1 text-sm text-slate-600">You reached a {pet.unlockStreak}-day practice streak. {pet.tagline}</p>
      {state.pending.length > 1 && <p className="mt-1 text-xs text-slate-500">{state.pending.length - 1} more waiting after this one.</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {!isActive && <button type="button" className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:brightness-110" onClick={() => { activatePet(pet.id); dismissPending(pet.id); }}>Add to my pets</button>}
        <Link href="/pets" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold hover:border-brand hover:text-brand" onClick={() => dismissPending(pet.id)}>See collection</Link>
        <button type="button" className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:text-navy" onClick={() => dismissPending(pet.id)}>{isActive ? "Great!" : "Later"}</button>
      </div>
    </div>
  );
}
