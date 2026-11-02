import { Suspense } from "react";
import Link from "next/link";
import SetupForm from "@/components/setup/SetupForm";
import VirtualKeyboard from "@/components/keyboard/VirtualKeyboard";

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-[#fbfbf8] text-[#242721]">
      <header className="border-b border-[#e9e9e2] bg-white/70">
        <div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#315c42] font-serif text-xl italic text-white">d</span><span>keyflow<span className="text-[#73a96b]">.</span></span></Link>
          <Link href="/" className="text-xs text-[#7f867c] hover:text-[#365b40]">← Back to overview</Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <div className="mb-7 max-w-xl">
          <span className="text-[10px] font-bold tracking-[0.16em] text-[#64866a]">YOUR PRACTICE, YOUR PACE</span>
          <h1 className="mt-3 font-serif text-4xl tracking-tight text-[#252a24] sm:text-5xl">Set up your session.</h1>
          <p className="mt-3 text-sm leading-6 text-[#81867d]">Choose a language, a lesson, and how long you want to practice. No sign-up needed.</p>
        </div>
        <SetupForm />
        <section className="mt-6">
          <Suspense fallback={<div className="rounded-2xl border border-[#e8e9e2] bg-white p-5 text-sm text-[#858b80]">Loading your keyboard preview…</div>}>
            <VirtualKeyboard />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
