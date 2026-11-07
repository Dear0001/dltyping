import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help & Guides — DL Typing",
  description: "How to use DL Typing, keyboard layout tips for English QWERTY and Khmer NiDA, and clear answers to common questions about accounts, progress and practice.",
};

const steps = [
  ["Pick a language", "Choose English or Khmer from Learn, or start a Quick Practice from Practice."],
  ["Follow a lesson", "Lessons are grouped by level. Start with Beginner and move up when your accuracy feels steady."],
  ["Reinforce with games", "Each game trains letters, words or sentences in a different way. Use them between lessons."],
  ["Check your progress", "The Progress page shows speed (WPM), accuracy and the lessons you have completed."],
];

const faqs = [
  ["Do I need an account?", "No. Everything works without signing in. An account is optional and only used to sync progress."],
  ["Where is my progress saved?", "On this device, in your browser. Clearing site data removes it unless you use the optional account."],
  ["How do I type Khmer?", "Switch your computer's input method to Khmer (NiDA layout) before you start, then type as the on-screen keyboard shows."],
  ["Can I change the look?", "Yes. Use the color dots in the header to switch themes, and EN / ខ្មែរ to change the interface language."],
];

const card = "rounded-2xl border border-slate-200 bg-white p-6";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-surface text-navy">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-extrabold">Help &amp; guides</h1>
        <p className="mt-2 text-mute">Everything you need to get started with English and Khmer typing practice.</p>

        <section id="how-to" className={`${card} mt-8 scroll-mt-24`}>
          <h2 className="text-xl font-bold">How to use DL Typing</h2>
          <ol className="mt-4 space-y-3">
            {steps.map(([title, text], i) => (
              <li key={title} className="flex gap-3">
                <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
                <p><strong>{title}.</strong> <span className="text-mute">{text}</span></p>
              </li>
            ))}
          </ol>
        </section>

        <section id="keyboards" className={`${card} mt-6 scroll-mt-24`}>
          <h2 className="text-xl font-bold">Keyboard guide</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div id="qwerty">
              <h3 className="font-bold">English QWERTY</h3>
              <p className="mt-1 text-mute">Rest your fingers on the home row (A S D F · J K L ;), use the bumps on F and J to find position, and look at the screen, not the keys.</p>
              <Link href="/learn/english" className="mt-2 inline-block font-semibold text-brand hover:underline">Practice English →</Link>
            </div>
            <div id="nida">
              <h3 className="font-bold">Khmer NiDA</h3>
              <p className="mt-1 text-mute">NiDA is the national Khmer layout. Enable it in your system input settings, then follow the on-screen keyboard, which shows the Khmer character for each key.</p>
              <Link href="/learn/khmer" className="mt-2 inline-block font-semibold text-brand hover:underline">Practice Khmer →</Link>
            </div>
          </div>
        </section>

        <section id="faq" className={`${card} mt-6 scroll-mt-24`}>
          <h2 className="text-xl font-bold">Frequently asked questions</h2>
          <dl className="mt-4 space-y-4">
            {faqs.map(([q, a]) => (
              <div key={q}><dt className="font-bold">{q}</dt><dd className="mt-1 text-mute">{a}</dd></div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  );
}
