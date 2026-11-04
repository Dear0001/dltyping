import ShareButtons from "@/components/shared/ShareButtons";
import { LANDING_FAQ } from "@/data/landing-faq";

const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
const link = "font-semibold text-brand underline-offset-2 hover:underline";

const steps = [
  ["Pick your language and keyboard", "Choose English (QWERTY) or Khmer (NiDA). The on-screen keyboard shows which finger presses every key, so you build correct typing habits from the very first lesson."],
  ["Follow the lessons in order", "Each language has 13 lessons across five levels, from home-row letters to full passages. Every lesson lists its objective, the keys it focuses on, and a typing game that reinforces the skill."],
  ["Play games and track your speed", "Five typing games turn repetition into play. Your words per minute, accuracy and best scores are saved on your device and shown on your progress page, so you can watch yourself type faster."],
];

const tips = [
  ["Sit comfortably", "Keep your feet flat, your back straight and your wrists relaxed, level with the keyboard. Good posture lets you practise longer without strain."],
  ["Start on the home row", "Rest your fingers on A S D F and J K L ; and feel the small bumps on F and J. Every other key is reached from there and returns there."],
  ["Look at the screen, not the keys", "Watching your hands slows you down. Trust the on-screen keyboard and let your fingers learn where each key is."],
  ["Accuracy first, speed second", "Aim for at least 95 percent accuracy before you push for more speed. Speed grows naturally once your fingers stop making mistakes."],
  ["Use every finger", "Each finger owns a set of keys. Using all ten fingers is what separates fast touch typing from slow hunt-and-peck typing."],
  ["Practise a little every day", "Fifteen to twenty minutes daily beats one long weekly session. Regular short practice is how muscle memory forms."],
];

/** Static homepage copy, rendered on the server. Kept here so the landing page stays easy to read and the text is crawlable. */
export default function LandingContent({ siteUrl }: { siteUrl: string }) {
  return <>
    <section className="mx-auto max-w-6xl px-4 pb-6 pt-2 sm:px-6" aria-labelledby="how-heading">
      <h2 id="how-heading" className="text-2xl font-extrabold sm:text-3xl">How to type faster with DL Typing</h2>
      <p className="mt-2 max-w-3xl text-slate-600">Learning to type faster does not need expensive software. You need a clear path, the right habits and a little practice each day. DL Typing gives you all three in your browser, for free.</p>
      <ol className="mt-6 grid gap-4 md:grid-cols-3">
        {steps.map(([title, text], i) => <li key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-sm font-bold text-white" aria-hidden="true">{i + 1}</span>
          <p className="mt-3 font-extrabold">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{text}</p>
        </li>)}
      </ol>
    </section>

    <section className="bg-white py-14" aria-labelledby="tips-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="tips-heading" className="text-2xl font-extrabold sm:text-3xl">Touch typing tips for beginners</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          <a href="https://en.wikipedia.org/wiki/Touch_typing" {...ext} className={link}>Touch typing</a> means typing without looking at the keyboard, using all your fingers. It is the skill behind fast, accurate typing, and these habits help you learn it quickly. Progress is usually measured in <a href="https://en.wikipedia.org/wiki/Words_per_minute" {...ext} className={link}>words per minute</a>, where a word counts as five characters.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tips.map(([title, text]) => <li key={title} className="rounded-2xl border border-slate-200 bg-surface p-5">
            <p className="font-extrabold">{title}</p>
            <p className="mt-1 text-sm text-slate-600">{text}</p>
          </li>)}
        </ul>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="khmer-heading">
      <h2 id="khmer-heading" className="text-2xl font-extrabold sm:text-3xl">Typing in Khmer: what makes it different</h2>
      <div className="mt-3 max-w-3xl space-y-3 text-slate-600">
        <p>The <a href="https://en.wikipedia.org/wiki/Khmer_alphabet" {...ext} className={link}>Khmer alphabet</a> has 33 consonants, plus vowels, signs and subscript consonants that stack under the letter before them. Because of this, typing Khmer is about more than finding single letters: you also learn to build clusters in the right order.</p>
        <p>Modern Khmer text uses Unicode, and the <a href="https://www.unicode.org/charts/PDF/U1780.pdf" {...ext} className={link}>Khmer Unicode chart</a> lists every character. On computers, most people type it with the NiDA layout. Switch your system input method to Khmer, then follow the on-screen keyboard in DL Typing, which shows the Khmer character, the key and the finger for each step.</p>
        <p>The Khmer curriculum starts with single consonants and vowels, moves on to subscript clusters and common words, and ends with full passages, so you can type faster in Khmer with the same step-by-step approach used for English.</p>
      </div>
    </section>

    <section className="bg-white py-14" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 id="faq-heading" className="text-2xl font-extrabold sm:text-3xl">Frequently asked questions</h2>
        <div className="mt-6 space-y-3">
          {LANDING_FAQ.map((item) => <details key={item.q} className="group rounded-2xl border border-slate-200 bg-surface p-5">
            <summary className="cursor-pointer list-none font-extrabold">{item.q}</summary>
            <p className="mt-2 text-sm text-slate-600">{item.a}</p>
          </details>)}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="share-heading">
      <h2 id="share-heading" className="text-2xl font-extrabold sm:text-3xl">Know someone learning to type?</h2>
      <p className="mb-5 mt-2 max-w-3xl text-slate-600">Share DL Typing with friends, classmates and teachers. It is free for everyone.</p>
      <ShareButtons url={siteUrl} text="Learn to type faster in English and Khmer with free lessons and games on DL Typing." />
    </section>
  </>;
}
